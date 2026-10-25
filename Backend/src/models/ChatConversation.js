const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    supportTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },

    subject: {
      type: String,
      trim: true,
      default: "General Support",
    },

    type: {
      type: String,
      default: "general",
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    lastMessage: {
      type: String,
      trim: true,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PHASE 26 — CHAT PERFORMANCE
// ============================================================

chatConversationSchema.index({
  participants: 1,
  lastMessageAt: -1,
});

chatConversationSchema.index({
  customer: 1,
  lastMessageAt: -1,
});

chatConversationSchema.index({
  seller: 1,
  lastMessageAt: -1,
});

chatConversationSchema.index({
  admin: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "ChatConversation",
  chatConversationSchema
);
