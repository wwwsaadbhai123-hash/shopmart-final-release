const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "ChatConversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  senderName: { type: String, trim: true, maxlength: 80, default: "" },
  senderEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  senderType: { type: String, enum: ["user", "guest"], default: "user" },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  messageType: { type: String, enum: ["text", "system"], default: "text" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

chatMessageSchema.index({ conversation: 1, createdAt: 1 });
module.exports = mongoose.model("ChatMessage", chatMessageSchema);
