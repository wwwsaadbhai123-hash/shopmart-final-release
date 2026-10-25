// =========================================================
// PHASE 18 - SELLER RETURN ROUTES
// =========================================================

const express = require("express");

const router =
  express.Router();

const {
  getSellerReturns,
  updateSellerReturnStatus,
} = require("../controllers/sellerReturnController");

const {
  protect,
} = require("../middleware/authMiddleware");

// Get seller return requests
router.get(
  "/",
  protect,
  getSellerReturns
);

// Update return status
router.patch(
  "/:id/status",
  protect,
  updateSellerReturnStatus
);

module.exports = router;