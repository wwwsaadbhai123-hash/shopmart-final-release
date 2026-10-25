const Coupon = require("../models/Coupon");

// CREATE COUPON
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      expiryDate,
      usageLimit,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required coupon fields",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (Number(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      Number(discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscount:
        maxDiscount !== undefined && maxDiscount !== ""
          ? Number(maxDiscount)
          : null,
      minOrderAmount:
        minOrderAmount !== undefined && minOrderAmount !== ""
          ? Number(minOrderAmount)
          : 0,
      expiryDate,
      usageLimit:
        usageLimit !== undefined && usageLimit !== ""
          ? Number(usageLimit)
          : null,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL COUPONS
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// APPLY COUPON
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const amount = Number(orderAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid order amount is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is inactive",
      });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon usage limit has been reached",
      });
    }

    if (amount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is Rs. ${coupon.minOrderAmount}`,
      });
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (amount * coupon.discountValue) / 100;

      if (
        coupon.maxDiscount !== null &&
        discount > coupon.maxDiscount
      ) {
        discount = coupon.maxDiscount;
      }
    }

    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    if (discount > amount) {
      discount = amount;
    }

    const finalAmount = amount - discount;

    res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount: Number(discount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE COUPON
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  applyCoupon,
  deleteCoupon,
};