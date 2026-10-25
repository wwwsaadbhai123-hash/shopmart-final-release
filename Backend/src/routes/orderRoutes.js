const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// CUSTOMER ORDERS
// =========================================================

// Create order
router.post("/", protect, createOrder);

// Get logged-in user's orders
router.get("/my-orders", protect, getMyOrders);

// Get single order
router.get("/:id", protect, getOrderById);

// Cancel order
router.put("/:id/cancel", protect, cancelOrder);

// Update order status
router.put("/:id/status", protect, updateOrderStatus);

module.exports = router;