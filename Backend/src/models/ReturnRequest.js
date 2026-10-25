/* =========================================================
   SHOPMART - PHASE 13
   RETURN / REFUND REQUEST MODEL
========================================================= */

const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    /* =========================
       CUSTOMER
    ========================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* =========================
       ORDER
    ========================= */

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    /* =========================
       RETURN REASON
    ========================= */

    reason: {
      type: String,
      enum: [
        "wrong_item",
        "damaged_item",
        "defective_item",
        "not_as_described",
        "missing_item",
        "changed_mind",
        "other",
      ],
      required: true,
    },

    /* =========================
       CUSTOMER DESCRIPTION
    ========================= */

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /* =========================
       REFUND AMOUNT
    ========================= */

    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* =========================
       RETURN STATUS
    ========================= */

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },

    /* =========================
       ADMIN / SELLER RESPONSE
    ========================= */

    responseNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    /* =========================
       PROCESSED DATE
    ========================= */

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PHASE 26 — RETURN PERFORMANCE
// ============================================================

returnRequestSchema.index({
  user: 1,
  createdAt: -1,
});

returnRequestSchema.index({
  status: 1,
  createdAt: -1,
});

returnRequestSchema.index({
  order: 1,
});

module.exports = mongoose.model(
  "ReturnRequest",
  returnRequestSchema
);
