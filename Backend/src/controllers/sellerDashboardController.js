// =========================================================
// PHASE 16 - SELLER DASHBOARD CONTROLLER
// =========================================================

const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

// =========================================================
// GET SELLER DASHBOARD
// =========================================================

const getSellerDashboard = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------------
    // Find seller profile
    // -------------------------------------------------------

    const seller = await Seller.findOne({
      user: userId,
    }).populate("user", "name email phone");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    // -------------------------------------------------------
    // Seller must be approved
    // -------------------------------------------------------

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Seller account is ${seller.status || "pending"}.`,
        sellerStatus: seller.status || "pending",
      });
    }

    // -------------------------------------------------------
    // Seller products
    // -------------------------------------------------------

    const products = await Product.find({
      seller: seller._id,
    }).sort({
      createdAt: -1,
    });

    const totalProducts = products.length;

    // -------------------------------------------------------
    // Low stock products
    // -------------------------------------------------------

    const lowStockProducts = products.filter((product) => {
      const stock = Number(product.stock || 0);

      return stock > 0 && stock <= 5;
    });

    const outOfStockProducts = products.filter((product) => {
      return Number(product.stock || 0) <= 0;
    });

    // -------------------------------------------------------
    // Seller orders
    // -------------------------------------------------------

    const allOrders = await Order.find({})
      .populate("user", "name email phone")
      .populate("items.product")
      .sort({
        createdAt: -1,
      });

    // -------------------------------------------------------
    // Filter orders containing seller products
    // -------------------------------------------------------

    const sellerProductIds = new Set(
      products.map((product) => String(product._id))
    );

    const sellerOrders = allOrders.filter((order) => {
      return (order.items || []).some((item) => {
        const productId =
          typeof item.product === "object"
            ? item.product?._id
            : item.product;

        return (
          productId &&
          sellerProductIds.has(String(productId))
        );
      });
    });

    // -------------------------------------------------------
    // Calculate seller sales
    // -------------------------------------------------------

    let totalSales = 0;

    sellerOrders.forEach((order) => {
      const sellerItems = (order.items || []).filter((item) => {
        const productId =
          typeof item.product === "object"
            ? item.product?._id
            : item.product;

        return (
          productId &&
          sellerProductIds.has(String(productId))
        );
      });

      sellerItems.forEach((item) => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);

        totalSales += price * quantity;
      });
    });

    // -------------------------------------------------------
    // Pending orders
    // -------------------------------------------------------

    const pendingStatuses = [
      "pending",
      "confirmed",
      "processing",
    ];

    const pendingOrders = sellerOrders.filter((order) =>
      pendingStatuses.includes(order.status)
    ).length;

    // -------------------------------------------------------
    // Recent orders
    // -------------------------------------------------------

    const recentOrders = sellerOrders
      .slice(0, 10)
      .map((order) => {
        const sellerItems = (order.items || []).filter((item) => {
          const productId =
            typeof item.product === "object"
              ? item.product?._id
              : item.product;

          return (
            productId &&
            sellerProductIds.has(String(productId))
          );
        });

        const sellerOrderTotal = sellerItems.reduce(
          (total, item) => {
            return (
              total +
              Number(item.price || 0) *
                Number(item.quantity || 1)
            );
          },
          0
        );

        return {
          _id: order._id,
          createdAt: order.createdAt,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customer: order.user
            ? {
                _id: order.user._id,
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone,
              }
            : null,
          items: sellerItems,
          totalAmount: sellerOrderTotal,
        };
      });

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,

      dashboard: {
        shop: {
          id: seller._id,
          shopName:
            seller.shop_name ||
            seller.shopName ||
            "My Shop",

          status: seller.status,

          cnic:
            seller.cnic_number ||
            seller.cnicNumber ||
            "",

          user: seller.user
            ? {
                name: seller.user.name,
                email: seller.user.email,
                phone: seller.user.phone,
              }
            : null,
        },

        totalProducts,

        totalOrders: sellerOrders.length,

        totalSales,

        pendingOrders,

        lowStockProducts: lowStockProducts.length,

        outOfStockProducts: outOfStockProducts.length,

        recentOrders,

        lowStockItems: lowStockProducts
          .slice(0, 10)
          .map((product) => ({
            _id: product._id,
            title:
              product.title ||
              product.name ||
              "Product",
            stock: Number(product.stock || 0),
            price: Number(product.price || 0),
          })),
      },
    });
  } catch (error) {
    console.error(
      "Seller dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load seller dashboard.",
    });
  }
};

module.exports = {
  getSellerDashboard,
};