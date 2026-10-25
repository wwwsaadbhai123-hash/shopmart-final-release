const express = require("express");

const router = express.Router();

const {
  getAdminDashboard,
} = require("../controllers/adminDashboardController");

const { protect } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

router.get("/", protect, adminOnly, getAdminDashboard);

module.exports = router;