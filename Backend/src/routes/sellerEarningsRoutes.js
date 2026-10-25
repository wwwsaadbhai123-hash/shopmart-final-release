// =========================================================
// PHASE 21 - SELLER EARNINGS ROUTES
// =========================================================

const express = require("express");

const router = express.Router();

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  getSellerEarnings,
  createPayoutRequest,
  getPayoutHistory,
} = require("../controllers/sellerEarningsController");

// =========================================================
// EARNINGS
// =========================================================

router.get(
  "/",
  protect,
  getSellerEarnings
);

// =========================================================
// PAYOUT REQUEST
// =========================================================

router.post(
  "/payout",
  protect,
  createPayoutRequest
);

// =========================================================
// PAYOUT HISTORY
// =========================================================

router.get(
  "/payouts",
  protect,
  getPayoutHistory
);

module.exports = router;