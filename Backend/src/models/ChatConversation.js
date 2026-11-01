const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  guest: {
    name: { type: String, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    tokenHash: { type: String, select: false }
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  supportTicket: { type: mongoose.Schema.Types.ObjectId, ref: "SupportTicket", default: null },
  subject: { type: String, trim: true, default: "General Support" },
  type: { type: String, default: "general" },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  lastMessage: { type: String, trim: true, default: "" },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

chatConversationSchema.index({ participants: 1, lastMessageAt: -1 });
chatConversationSchema.index({ customer: 1, lastMessageAt: -1 });
chatConversationSchema.index({ seller: 1, lastMessageAt: -1 });
chatConversationSchema.index({ admin: 1, lastMessageAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
