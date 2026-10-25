// =========================================================
// PHASE 18 - SELLER ORDER ROUTES
// =========================================================

const express = require("express");

const router =
  express.Router();

const {
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerOrderDetails,
} = require("../controllers/sellerOrderController");

const {
  protect,
} = require("../middleware/authMiddleware");

// Seller orders
router.get(
  "/",
  protect,
  getSellerOrders
);

// Seller order details
router.get(
  "/:id",
  protect,
  getSellerOrderDetails
);

// Update order status
router.patch(
  "/:id/status",
  protect,
  updateSellerOrderStatus
);

module.exports = router;