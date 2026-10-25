// =========================================================
// PHASE 19 - SUPPORT TICKET MODEL
// =========================================================

const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: [
        "order",
        "payment",
        "product",
        "return",
        "account",
        "technical",
        "other",
      ],
      default: "other",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },

    replies: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: 5000,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PHASE 26 — SUPPORT TICKET PERFORMANCE
// ============================================================

supportTicketSchema.index({
  user: 1,
  createdAt: -1,
});

supportTicketSchema.index({
  seller: 1,
  createdAt: -1,
});

supportTicketSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
