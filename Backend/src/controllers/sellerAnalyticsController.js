// =========================================================
// PHASE 20 - SELLER ANALYTICS CONTROLLER
// =========================================================

const Order = require("../models/Order");
const Product = require("../models/Product");
const Seller = require("../models/Seller");

// =========================================================
// GET SELLER ANALYTICS
// =========================================================

exports.getSellerAnalytics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const seller = await Seller.findOne({ user: userId });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const sellerId = seller._id;

    // -----------------------------------------------------
    // SELLER PRODUCTS
    // -----------------------------------------------------

    const products = await Product.find({
      seller: sellerId,
    }).lean();

    const productIds = products.map((product) => product._id);

    // -----------------------------------------------------
    // SELLER ORDERS
    // -----------------------------------------------------

    const orders = await Order.find({
      "items.product": { $in: productIds },
    })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .lean();

    // -----------------------------------------------------
    // INITIAL STATS
    // -----------------------------------------------------

    let totalSales = 0;
    let deliveredSales = 0;
    let pendingSales = 0;
    let cancelledSales = 0;

    let totalOrders = 0;
    let deliveredOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;

    let totalItemsSold = 0;

    // -----------------------------------------------------
    // PRODUCT SALES MAP
    // -----------------------------------------------------

    const productSalesMap = {};

    // -----------------------------------------------------
    // PROCESS ORDERS
    // -----------------------------------------------------

    orders.forEach((order) => {
      const sellerItems = (order.items || []).filter((item) => {
        const productId =
          item.product?._id?.toString() ||
          item.product?.toString();

        return productIds.some(
          (id) => id.toString() === productId
        );
      });

      if (sellerItems.length === 0) {
        return;
      }

      totalOrders += 1;

      let sellerOrderTotal = 0;

      sellerItems.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        const itemTotal = quantity * price;

        sellerOrderTotal += itemTotal;
        totalItemsSold += quantity;

        const productId =
          item.product?._id?.toString() ||
          item.product?.toString();

        const productName =
          item.product?.name ||
          item.product?.title ||
          "Unknown Product";

        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            productId,
            name: productName,
            quantity: 0,
            sales: 0,
          };
        }

        productSalesMap[productId].quantity += quantity;
        productSalesMap[productId].sales += itemTotal;
      });

      const status = String(
        order.status || "pending"
      ).toLowerCase();

      if (status === "delivered") {
        deliveredOrders += 1;
        deliveredSales += sellerOrderTotal;
        totalSales += sellerOrderTotal;
      } else if (
        status === "cancelled" ||
        status === "canceled"
      ) {
        cancelledOrders += 1;
        cancelledSales += sellerOrderTotal;
      } else {
        pendingOrders += 1;
        pendingSales += sellerOrderTotal;
      }
    });

    // -----------------------------------------------------
    // TOP SELLING PRODUCTS
    // -----------------------------------------------------

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => {
        return b.quantity - a.quantity;
      })
      .slice(0, 10);

    // -----------------------------------------------------
    // LOW STOCK
    // -----------------------------------------------------

    const lowStockProducts = products
      .filter((product) => {
        const stock = Number(product.stock || 0);

        return stock <= 5;
      })
      .map((product) => ({
        _id: product._id,
        name: product.name || product.title || "Unnamed Product",
        stock: Number(product.stock || 0),
      }))
      .sort((a, b) => a.stock - b.stock);

    // -----------------------------------------------------
    // AVERAGE ORDER VALUE
    // -----------------------------------------------------

    const averageOrderValue =
      totalOrders > 0
        ? totalSales / totalOrders
        : 0;

    // -----------------------------------------------------
    // RECENT ORDERS
    // -----------------------------------------------------

    const recentOrders = orders
      .slice(0, 10)
      .map((order) => {
        const sellerItems = (order.items || []).filter((item) => {
          const productId =
            item.product?._id?.toString() ||
            item.product?.toString();

          return productIds.some(
            (id) => id.toString() === productId
          );
        });

        const amount = sellerItems.reduce(
          (sum, item) =>
            sum +
            Number(item.price || 0) *
              Number(item.quantity || 0),
          0
        );

        return {
          _id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          amount,
          itemCount: sellerItems.reduce(
            (sum, item) =>
              sum + Number(item.quantity || 0),
            0
          ),
          createdAt: order.createdAt,
        };
      });

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.json({
      success: true,

      analytics: {
        totalSales,
        deliveredSales,
        pendingSales,
        cancelledSales,

        totalOrders,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,

        totalProducts: products.length,
        totalItemsSold,

        averageOrderValue,

        lowStockCount: lowStockProducts.length,

        topProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error(
      "SELLER ANALYTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load seller analytics",
    });
  }
};