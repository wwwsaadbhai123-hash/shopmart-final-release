const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    messageType: {
      type: String,
      enum: [
        "text",
        "system",
      ],
      default: "text",
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PHASE 26 — CHAT MESSAGE PERFORMANCE
// ============================================================

chatMessageSchema.index({
  conversation: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "ChatMessage",
  chatMessageSchema
);
