// =========================================================
// PHASE 21 - SELLER PAYOUT MODEL
// =========================================================

const mongoose = require("mongoose");

const sellerPayoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMethod: {
      type: String,
      enum: [
        "bank",
        "easypaisa",
        "jazzcash",
        "other",
      ],
      required: true,
    },

    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "paid",
      ],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    transactionReference: {
      type: String,
      default: "",
      trim: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PHASE 26 — PAYOUT PERFORMANCE
// ============================================================

sellerPayoutSchema.index({
  seller: 1,
  createdAt: -1,
});

sellerPayoutSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "SellerPayout",
  sellerPayoutSchema
);
