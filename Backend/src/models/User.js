const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer",
    },

    phone: {
      type: String,
      default: "",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // =====================================================
    // SELLER INFORMATION - PHASE 15
    // =====================================================

    shopName: {
      type: String,
      trim: true,
      default: "",
    },

    cnicNumber: {
      type: String,
      trim: true,
      default: "",
    },

    cnicFrontImage: {
      type: String,
      default: "",
    },

    cnicBackImage: {
      type: String,
      default: "",
    },

    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    sellerRejectionReason: {
      type: String,
      default: "",
    },

    sellerAppliedAt: {
      type: Date,
      default: null,
    },

    sellerApprovedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// ============================================================
// PHASE 26 — PERFORMANCE INDEXES
// ============================================================

userSchema.index({
  email: 1,
});

userSchema.index({
  role: 1,
});

userSchema.index({
  sellerStatus: 1,
});

userSchema.index({
  isActive: 1,
});

module.exports = mongoose.model("User", userSchema);