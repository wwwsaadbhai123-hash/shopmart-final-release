const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

/* =========================================================
   GET MY CONVERSATIONS
========================================================= */

const getMyConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const conversations =
      await ChatConversation.find({
        participants: userId,
      })
        .populate("participants", "name email role")
        .populate("customer", "name email role")
        .populate("seller", "name email role")
        .populate("admin", "name email role")
        .populate("order", "_id status totalAmount")
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load conversations",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE / GET CONVERSATION
========================================================= */

const createConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { participantId, orderId, supportTicketId, subject, type } = req.body || {};

    let participantIds = [userId, participantId].filter(Boolean).map(String);
    let participants = [];

    if (!participantId && req.user?.role === "customer" && !orderId && !supportTicketId) {
      const admin = await User.findOne({ role: "admin", isActive: true }).select("_id name email role");
      if (!admin) {
        return res.status(503).json({
          success: false,
          message: "Support admin abhi available nahi hai. Baad mein dobara try karein."
        });
      }
      participantIds = [String(userId), String(admin._id)];
    } else if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant is required"
      });
    }

    participants = await User.find({ _id: { $in: participantIds } }).select("_id name email role");

    if (participants.length !== participantIds.length) {
      return res.status(404).json({
        success: false,
        message: "Conversation participant not found"
      });
    }

    const roles = participants.map((participant) => participant.role);
    const customerIndex = roles.indexOf("customer");
    const sellerIndex = roles.indexOf("vendor");
    const adminIndex = roles.indexOf("admin");

    const conversationData = {
      participants: participants.map((participant) => participant._id),
      subject: subject || "General Support",
      type: type || "general",
      status: "open"
    };

    if (customerIndex !== -1) conversationData.customer = participants[customerIndex]._id;
    if (sellerIndex !== -1) conversationData.seller = participants[sellerIndex]._id;
    if (adminIndex !== -1) conversationData.admin = participants[adminIndex]._id;
    if (orderId) conversationData.order = orderId;
    if (supportTicketId) conversationData.supportTicket = supportTicketId;

    // SHOPMART_CUSTOMER_START_CHAT_FIX
    let conversation;

    if (!participantId && req.user?.role === "customer" && !orderId && !supportTicketId) {
      conversation = await ChatConversation.findOne({
        participants: { $all: participantIds },
        status: "open",
        type: "general",
        order: null,
        supportTicket: null
      });
    }

    if (!conversation) {
      conversation = await ChatConversation.create(conversationData);
    }

    const populated = await ChatConversation.findById(conversation._id)
      .populate("participants", "name email role")
      .populate("customer", "name email role")
      .populate("seller", "name email role")
      .populate("admin", "name email role");

    return res.status(200).json({
      success: true,
      message: "Conversation ready",
      conversation: populated
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message
    });
  }
};
/* =========================================================
   GET CONVERSATION MESSAGES
========================================================= */

const getMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const conversation =
      await ChatConversation.findOne({
        _id: id,
        ...(req.user?.role === "admin" ? {} : { participants: userId }),
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages =
      await ChatMessage.find({
        conversation: id,
      })
        .populate(
          "sender",
          "name email role"
        )
        .sort({ createdAt: 1 })
        .lean();

    const unreadMessages =
      await ChatMessage.find({
        conversation: id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });

    if (unreadMessages.length > 0) {
      await ChatMessage.updateMany(
        {
          conversation: id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
        {
          $addToSet: {
            readBy: userId,
          },
        }
      );
    }

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load messages",
      error: error.message,
    });
  }
};

/* =========================================================
   SEND MESSAGE
========================================================= */

const sendMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const conversation =
      await ChatConversation.findOne({
        _id: id,
        ...(req.user?.role === "admin" ? {} : { participants: userId }),
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This conversation is closed",
      });
    }

    const newMessage =
      await ChatMessage.create({
        conversation: id,
        sender: userId,
        message: message.trim(),
        readBy: [userId],
      });

    conversation.lastMessage =
      message.trim();

    conversation.lastMessageAt =
      new Date();

    await conversation.save();

    const populatedMessage =
      await ChatMessage.findById(
        newMessage._id
      ).populate(
        "sender",
        "name email role"
      );

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/* =========================================================
   CLOSE CONVERSATION
========================================================= */

const closeConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const conversation =
      await ChatConversation.findOne({
        _id: id,
        ...(req.user?.role === "admin" ? {} : { participants: userId }),
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.status = "closed";

    await conversation.save();

    res.json({
      success: true,
      message: "Conversation closed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to close conversation",
      error: error.message,
    });
  }
};

/* =========================================================
   ADMIN - ALL CONVERSATIONS
========================================================= */

const getAllConversations = async (
  req,
  res
) => {
  try {
    const conversations =
      await ChatConversation.find()
        .populate(
          "participants",
          "name email role"
        )
        .populate(
          "customer",
          "name email role"
        )
        .populate(
          "seller",
          "name email role"
        )
        .populate(
          "admin",
          "name email role"
        )
        .sort({
          lastMessageAt: -1,
          updatedAt: -1,
        })
        .lean();

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Failed to load all conversations",
      error: error.message,
    });
  }
};

const reopenConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await ChatConversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.status = "open";
    await conversation.save();

    return res.json({
      success: true,
      message: "Conversation reopened",
      conversation,
    });
  } catch (error) {
    console.error("Reopen conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reopen conversation",
    });
  }
};


module.exports = {
  getMyConversations,
  createConversation,
  getMessages,
  sendMessage,
  closeConversation,
  reopenConversation,
  getAllConversations,
};