// =========================================================
// PHASE 20 - SELLER ANALYTICS ROUTES
// =========================================================

const express = require("express");

const router = express.Router();

const {
  getSellerAnalytics,
} = require("../controllers/sellerAnalyticsController");

const {
  protect,
} = require("../middleware/authMiddleware");

// =========================================================
// SELLER ANALYTICS
// =========================================================

router.get(
  "/",
  protect,
  getSellerAnalytics
);

module.exports = router;