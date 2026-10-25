// =========================================================
// PHASE 18 - SELLER ORDERS + RETURNS CONTROLLER
// =========================================================

const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

// =========================================================
// GET SELLER
// =========================================================

const getSeller = async (userId) => {
  return await Seller.findOne({
    user: userId,
  });
};

// =========================================================
// GET SELLER PRODUCT IDS
// =========================================================

const getSellerProductIds = async (sellerId) => {
  const products = await Product.find({
    seller: sellerId,
  }).select("_id");

  return new Set(
    products.map((product) =>
      String(product._id)
    )
  );
};

// =========================================================
// GET SELLER ORDERS
// =========================================================

const getSellerOrders = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSeller(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your seller account is not approved.",
      });
    }

    const sellerProductIds =
      await getSellerProductIds(
        seller._id
      );

    const orders = await Order.find({})
      .populate(
        "user",
        "name email phone"
      )
      .populate(
        "items.product"
      )
      .sort({
        createdAt: -1,
      });

    const sellerOrders = orders
      .filter((order) => {
        return (order.items || []).some(
          (item) => {
            const productId =
              typeof item.product ===
              "object"
                ? item.product?._id
                : item.product;

            return (
              productId &&
              sellerProductIds.has(
                String(productId)
              )
            );
          }
        );
      })
      .map((order) => {
        const sellerItems =
          (order.items || []).filter(
            (item) => {
              const productId =
                typeof item.product ===
                "object"
                  ? item.product?._id
                  : item.product;

              return (
                productId &&
                sellerProductIds.has(
                  String(productId)
                )
              );
            }
          );

        const sellerTotal =
          sellerItems.reduce(
            (total, item) => {
              return (
                total +
                Number(
                  item.price || 0
                ) *
                  Number(
                    item.quantity || 1
                  )
              );
            },
            0
          );

        return {
          _id: order._id,
          createdAt:
            order.createdAt,
          status:
            order.status,
          paymentStatus:
            order.paymentStatus,
          paymentMethod:
            order.paymentMethod,
          shippingAddress:
            order.shippingAddress,
          customer: order.user
            ? {
                _id:
                  order.user._id,
                name:
                  order.user.name,
                email:
                  order.user.email,
                phone:
                  order.user.phone,
              }
            : null,
          items:
            sellerItems,
          totalAmount:
            sellerTotal,
        };
      });

    return res.status(200).json({
      success: true,
      orders: sellerOrders,
      count: sellerOrders.length,
    });
  } catch (error) {
    console.error(
      "Get seller orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load seller orders.",
    });
  }
};

// =========================================================
// UPDATE SELLER ORDER STATUS
// =========================================================

const updateSellerOrderStatus = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller =
      await getSeller(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message:
          "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your seller account is not approved.",
      });
    }

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const newStatus =
      String(
        req.body.status || ""
      ).toLowerCase();

    if (
      !allowedStatuses.includes(
        newStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    const sellerProductIds =
      await getSellerProductIds(
        seller._id
      );

    const order =
      await Order.findById(
        req.params.id
      ).populate(
        "items.product"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const sellerHasProduct =
      (order.items || []).some(
        (item) => {
          const productId =
            typeof item.product ===
            "object"
              ? item.product?._id
              : item.product;

          return (
            productId &&
            sellerProductIds.has(
              String(productId)
            )
          );
        }
      );

    if (!sellerHasProduct) {
      return res.status(403).json({
        success: false,
        message:
          "This order does not contain your products.",
      });
    }

    order.status =
      newStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Update seller order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update order status.",
    });
  }
};

// =========================================================
// GET SELLER ORDER DETAILS
// =========================================================

const getSellerOrderDetails = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const seller =
      await getSeller(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message:
          "Seller profile not found.",
      });
    }

    const sellerProductIds =
      await getSellerProductIds(
        seller._id
      );

    const order =
      await Order.findById(
        req.params.id
      )
        .populate(
          "user",
          "name email phone"
        )
        .populate(
          "items.product"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const sellerItems =
      (order.items || []).filter(
        (item) => {
          const productId =
            typeof item.product ===
            "object"
              ? item.product?._id
              : item.product;

          return (
            productId &&
            sellerProductIds.has(
              String(productId)
            )
          );
        }
      );

    if (
      sellerItems.length ===
      0
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This order does not contain your products.",
      });
    }

    const totalAmount =
      sellerItems.reduce(
        (total, item) => {
          return (
            total +
            Number(
              item.price || 0
            ) *
              Number(
                item.quantity || 1
              )
          );
        },
        0
      );

    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        createdAt:
          order.createdAt,
        status:
          order.status,
        paymentStatus:
          order.paymentStatus,
        paymentMethod:
          order.paymentMethod,
        customer:
          order.user,
        shippingAddress:
          order.shippingAddress,
        items:
          sellerItems,
        totalAmount,
      },
    });
  } catch (error) {
    console.error(
      "Seller order details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load order details.",
    });
  }
};

module.exports = {
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerOrderDetails,
};