
const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const crypto = require("crypto");

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

/* =========================================================
   GET MY CONVERSATIONS
========================================================= */

const getMyConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const conversations = await ChatConversation.find({
      participants: userId,
    })
      .populate("participants", "name email role")
      .populate("customer", "name email role")
      .populate("seller", "name email role")
      .populate("admin", "name email role")
      .populate("order", "_id status totalAmount")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({
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
    const {
      participantId,
      orderId,
      supportTicketId,
      subject,
      type,
    } = req.body || {};

    let participantIds = [userId, participantId]
      .filter(Boolean)
      .map(String);

    if (
      !participantId &&
      req.user?.role === "customer" &&
      !orderId &&
      !supportTicketId
    ) {
      const admin = await User.findOne({
        role: "admin",
        isActive: true,
      }).select("_id name email role");

      if (!admin) {
        return res.status(503).json({
          success: false,
          message:
            "Support admin abhi available nahi hai. Baad mein dobara try karein.",
        });
      }

      participantIds = [String(userId), String(admin._id)];
    } else if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant is required",
      });
    }

    const participants = await User.find({
      _id: { $in: participantIds },
    }).select("_id name email role");

    if (participants.length !== participantIds.length) {
      return res.status(404).json({
        success: false,
        message: "Conversation participant not found",
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
      status: "open",
    };

    if (customerIndex !== -1) {
      conversationData.customer = participants[customerIndex]._id;
    }

    if (sellerIndex !== -1) {
      conversationData.seller = participants[sellerIndex]._id;
    }

    if (adminIndex !== -1) {
      conversationData.admin = participants[adminIndex]._id;
    }

    if (orderId) conversationData.order = orderId;
    if (supportTicketId) {
      conversationData.supportTicket = supportTicketId;
    }

    // Reuse an existing open customer support conversation.
    let conversation;

    if (
      !participantId &&
      req.user?.role === "customer" &&
      !orderId &&
      !supportTicketId
    ) {
      conversation = await ChatConversation.findOne({
        participants: { $all: participantIds },
        status: "open",
        type: "general",
        order: null,
        supportTicket: null,
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
      conversation: populated,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
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

    const conversation = await ChatConversation.findOne({
      _id: id,
      ...(req.user?.role === "admin" ? {} : { participants: userId }),
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await ChatMessage.find({
      conversation: id,
    })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    const unreadMessages = await ChatMessage.find({
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

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
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

    const conversation = await ChatConversation.findOne({
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

    const newMessage = await ChatMessage.create({
      conversation: id,
      sender: userId,
      message: message.trim(),
      readBy: [userId],
    });

    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();

    await conversation.save();

    const populatedMessage = await ChatMessage.findById(
      newMessage._id
    ).populate("sender", "name email role");

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
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

    const conversation = await ChatConversation.findOne({
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

    return res.json({
      success: true,
      message: "Conversation closed",
    });
  } catch (error) {
    console.error("Close conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close conversation",
      error: error.message,
    });
  }
};

/* =========================================================
   ADMIN - ALL CONVERSATIONS
========================================================= */

const getAllConversations = async (req, res) => {
  try {
    const conversations = await ChatConversation.find()
      .populate("participants", "name email role")
      .populate("customer", "name email role")
      .populate("seller", "name email role")
      .populate("admin", "name email role")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get all conversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load all conversations",
      error: error.message,
    });
  }
};

/* =========================================================
   REOPEN CONVERSATION
========================================================= */

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

/* =========================================================
   GUEST SUPPORT CHAT
========================================================= */

const guestTokenHash = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/* START GUEST CONVERSATION */

const startGuestConversation = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 80);
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name and email are required.",
      });
    }

    const admin = await User.findOne({
      role: "admin",
      isActive: true,
    }).select("_id");

    if (!admin) {
      return res.status(503).json({
        success: false,
        message: "Support is temporarily unavailable.",
      });
    }

    const guestToken = crypto.randomBytes(32).toString("hex");

    const conversation = await ChatConversation.create({
      participants: [admin._id],
      admin: admin._id,
      guest: {
        name,
        email,
        tokenHash: guestTokenHash(guestToken),
      },
      subject: "Guest Support",
      type: "general",
      status: "open",
    });

    return res.status(201).json({
      success: true,
      conversation: {
        _id: conversation._id,
        subject: conversation.subject,
        status: conversation.status,
      },
      guestToken,
    });
  } catch (error) {
    console.error("Start guest chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not start support chat.",
    });
  }
};

/* AUTHORIZE GUEST CONVERSATION */

const authorizeGuestConversation = async (req) => {
  const token = req.get("x-guest-chat-token");

  if (!token || token.length > 200) {
    return null;
  }

  return ChatConversation.findOne({
    _id: req.params.id,
    "guest.tokenHash": guestTokenHash(token),
  }).select("+guest.tokenHash");
};

/* GET GUEST MESSAGES */

const getGuestMessages = async (req, res) => {
  try {
    const conversation = await authorizeGuestConversation(req);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Guest conversation not found.",
      });
    }

    const messages = await ChatMessage.find({
      conversation: conversation._id,
    })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get guest messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load messages.",
    });
  }
};

/* SEND GUEST MESSAGE */

const sendGuestMessage = async (req, res) => {
  try {
    const conversation = await authorizeGuestConversation(req);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Guest conversation not found.",
      });
    }

    if (conversation.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This conversation is closed.",
      });
    }

    const message = String(req.body?.message || "").trim();

    if (!message || message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 3000 characters.",
      });
    }

    const saved = await ChatMessage.create({
      conversation: conversation._id,
      senderName: conversation.guest.name,
      senderEmail: conversation.guest.email,
      senderType: "guest",
      message,
      readBy: [],
    });

    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: saved,
    });
  } catch (error) {
    console.error("Send guest message error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not send message.",
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
  startGuestConversation,
  getGuestMessages,
  sendGuestMessage,
};