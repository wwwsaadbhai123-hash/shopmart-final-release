const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
// =========================================================
// ALLOWED ORDER STATUSES
// =========================================================

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

// =========================================================
// CREATE ORDER
// =========================================================
// Phase 11 - Order Creation
// Phase 25 - Security Validation
// Phase 26 - Performance Improvements
// =========================================================

const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "cod",
    } = req.body;

    // -----------------------------------------------------
    // USER AUTHENTICATION CHECK
    // -----------------------------------------------------

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    // -----------------------------------------------------
    // VALIDATE ORDER ITEMS
    // -----------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // -----------------------------------------------------
    // VALIDATE SHIPPING ADDRESS
    // -----------------------------------------------------

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const requiredAddressFields = [
      "fullName",
      "countryCode",
      "phone",
      "cnic",
      "address",
      "city",
      "province",
      "postalCode",
    ];

    for (const field of requiredAddressFields) {
      if (
        shippingAddress[field] === undefined ||
        shippingAddress[field] === null ||
        String(shippingAddress[field]).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // -----------------------------------------------------
    // VALIDATE PAYMENT METHOD
    // -----------------------------------------------------

    if (paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "Only COD payment method is currently supported",
      });
    }

    // -----------------------------------------------------
    // NORMALIZE & VALIDATE ITEMS
    // -----------------------------------------------------

    const normalizedItems = [];

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${item.product}`,
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be a whole number greater than 0",
        });
      }

      normalizedItems.push({
        product: item.product,
        quantity,
      });
    }

    // -----------------------------------------------------
    // COMBINE DUPLICATE PRODUCTS
    // -----------------------------------------------------
    // Example:
    // Product A x2
    // Product A x3
    // becomes:
    // Product A x5
    // -----------------------------------------------------

    const itemMap = new Map();

    for (const item of normalizedItems) {
      const productId = item.product.toString();

      if (itemMap.has(productId)) {
        itemMap.set(
          productId,
          itemMap.get(productId) + item.quantity
        );
      } else {
        itemMap.set(productId, item.quantity);
      }
    }

    const finalItems = Array.from(itemMap.entries()).map(
      ([product, quantity]) => ({
        product,
        quantity,
      })
    );

    // -----------------------------------------------------
    // FETCH ALL PRODUCTS AT ONCE
    // -----------------------------------------------------
    // Performance improvement:
    // Instead of querying MongoDB once per item,
    // fetch all products in one query.
    // -----------------------------------------------------

    const productIds = finalItems.map((item) => item.product);

    const products = await Product.find({
      _id: { $in: productIds },
    });

    // -----------------------------------------------------
    // VERIFY ALL PRODUCTS EXIST
    // -----------------------------------------------------

    if (products.length !== productIds.length) {
      const foundProductIds = new Set(
        products.map((product) => product._id.toString())
      );

      const missingProduct = finalItems.find(
        (item) => !foundProductIds.has(item.product.toString())
      );

      return res.status(404).json({
        success: false,
        message: `Product not found: ${missingProduct.product}`,
      });
    }

    // -----------------------------------------------------
    // CREATE QUICK PRODUCT LOOKUP MAP
    // -----------------------------------------------------

    const productMap = new Map();

    for (const product of products) {
      productMap.set(product._id.toString(), product);
    }

    // -----------------------------------------------------
    // CHECK STOCK
    // -----------------------------------------------------

    for (const item of finalItems) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.stock} item(s) in stock`,
        });
      }
    }

    // -----------------------------------------------------
    // PREPARE ORDER ITEMS
    // -----------------------------------------------------

    const orderItems = [];

    let calculatedTotal = 0;

    for (const item of finalItems) {
      const product = productMap.get(item.product.toString());

      const itemPrice = Number(product.price);
      const quantity = Number(item.quantity);

      orderItems.push({
        product: product._id,
        quantity,
        price: itemPrice,
      });

      calculatedTotal += itemPrice * quantity;
    }

    // -----------------------------------------------------
    // ROUND TOTAL
    // -----------------------------------------------------

    calculatedTotal = Number(calculatedTotal.toFixed(2));

    // -----------------------------------------------------
    // REDUCE STOCK
    // -----------------------------------------------------

    for (const item of finalItems) {
      const product = productMap.get(item.product.toString());

      product.stock -= item.quantity;

      await product.save();
    }

    // -----------------------------------------------------
    // CREATE ORDER
    // -----------------------------------------------------

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "cod",
      shippingAddress: {
        fullName: String(shippingAddress.fullName).trim(),
        countryCode: String(shippingAddress.countryCode).trim(),
        phone: String(shippingAddress.phone).trim(),
        cnic: String(shippingAddress.cnic).trim(),
        address: String(shippingAddress.address).trim(),
        city: String(shippingAddress.city).trim(),
        province: String(shippingAddress.province).trim(),
        postalCode: String(shippingAddress.postalCode).trim(),
      },
    });

    // -----------------------------------------------------
    // POPULATE ORDER
    // -----------------------------------------------------

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "name price image stock"
      );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// GET MY ORDERS
// =========================================================
// Phase 11 - Order History
// Phase 26 - Performance
// =========================================================

const getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await Order.find({
      user: req.user._id,
    })
      .populate(
        "items.product",
        "name price image"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// GET SINGLE ORDER
// =========================================================
// Phase 11 - Order Details & Tracking
// Phase 25 - Authorization
// =========================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------------
    // VALIDATE ORDER ID
    // -----------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // -----------------------------------------------------
    // FIND ORDER
    // -----------------------------------------------------

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "name price image stock"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // -----------------------------------------------------
    // AUTHORIZATION
    // -----------------------------------------------------
    // Customer:
    // only own order
    //
    // Admin:
    // can view any order
    // -----------------------------------------------------

    if (
      order.user &&
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// CANCEL ORDER
// =========================================================
// Phase 11 - Order Cancellation
// Phase 25 - Security
// =========================================================

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------------
    // VALIDATE ORDER ID
    // -----------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // -----------------------------------------------------
    // FIND ORDER
    // -----------------------------------------------------

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // -----------------------------------------------------
    // CUSTOMER AUTHORIZATION
    // -----------------------------------------------------

    if (
      order.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order",
      });
    }

    // -----------------------------------------------------
    // CHECK CURRENT STATUS
    // -----------------------------------------------------

    if (
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status}`,
      });
    }

    // -----------------------------------------------------
    // RESTORE STOCK
    // -----------------------------------------------------

    const productIds = order.items.map(
      (item) => item.product
    );

    const products = await Product.find({
      _id: { $in: productIds },
    });

    const productMap = new Map();

    for (const product of products) {
      productMap.set(
        product._id.toString(),
        product
      );
    }

    for (const item of order.items) {
      const product = productMap.get(
        item.product.toString()
      );

      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // -----------------------------------------------------
    // UPDATE ORDER
    // -----------------------------------------------------

    order.status = "cancelled";

    // COD order is not paid yet
    if (order.paymentMethod === "cod") {
      order.paymentStatus = "pending";
    }

    await order.save();

    // -----------------------------------------------------
    // POPULATE UPDATED ORDER
    // -----------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "name price image stock"
      );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// ADMIN - UPDATE ORDER STATUS
// =========================================================
// Phase 11.18 - Order Status & Tracking
// Phase 22/23 - Admin Authorization
// Phase 25 - Security
// =========================================================

const updateOrderStatus = async (req, res) => {
  try {
    // -----------------------------------------------------
    // ADMIN AUTHORIZATION
    // -----------------------------------------------------

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update order status",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // -----------------------------------------------------
    // VALIDATE ORDER ID
    // -----------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // -----------------------------------------------------
    // VALIDATE STATUS
    // -----------------------------------------------------

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // -----------------------------------------------------
    // FIND ORDER
    // -----------------------------------------------------

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // -----------------------------------------------------
    // PREVENT UNNECESSARY STATUS UPDATE
    // -----------------------------------------------------

    if (order.status === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
    }

    // -----------------------------------------------------
    // PREVENT CHANGING FINAL STATES
    // -----------------------------------------------------

    if (
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be changed because it is already ${order.status}`,
      });
    }

    // -----------------------------------------------------
    // STATUS TRANSITION RULES
    // -----------------------------------------------------
    // pending -> confirmed
    // confirmed -> processing
    // processing -> shipped
    // shipped -> delivered
    //
    // cancellation allowed before shipped
    // -----------------------------------------------------

    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const allowedNextStatuses =
      validTransitions[order.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`,
      });
    }

    // -----------------------------------------------------
    // UPDATE STATUS
    // -----------------------------------------------------

    order.status = status;

    // -----------------------------------------------------
    // COD PAYMENT
    // -----------------------------------------------------
    // COD becomes paid after successful delivery.
    // -----------------------------------------------------

    if (status === "delivered") {
      order.paymentStatus = "paid";
    }

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    await order.save();

    // -----------------------------------------------------
    // POPULATE UPDATED ORDER
    // -----------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "name price image stock"
      );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};