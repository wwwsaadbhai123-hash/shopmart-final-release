// =========================================================
// PHASE 16 - SELLER ROUTES
// =========================================================

const express = require("express");

const router = express.Router();

const {
  getSellerDashboard,
} = require("../controllers/sellerDashboardController");

const {
  registerSeller,
  getMySellerStatus,
} = require("../controllers/sellerController");

const { protect } = require("../middleware/authMiddleware");

const {
  uploadSellerDocs,
} = require("../middleware/uploadMiddleware");

// =========================================================
// SELLER REGISTRATION
// =========================================================

router.post(
  "/register",
  protect,
  uploadSellerDocs.fields([
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
  ]),
  registerSeller
);

// =========================================================
// SELLER STATUS
// =========================================================

router.get(
  "/me",
  protect,
  getMySellerStatus
);

// =========================================================
// SELLER DASHBOARD
// =========================================================

router.get(
  "/dashboard",
  protect,
  getSellerDashboard
);

module.exports = router;