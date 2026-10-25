const express = require("express");

const {
  createCoupon,
  getCoupons,
  applyCoupon,
  deleteCoupon,
} = require("../controllers/couponController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCoupons);

router.post("/", protect, adminOnly, createCoupon);

router.post("/apply", applyCoupon);

router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;