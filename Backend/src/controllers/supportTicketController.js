// =========================================================
// PHASE 19 - SUPPORT TICKET CONTROLLER
// =========================================================

const SupportTicket = require("../models/SupportTicket");
const Notification = require("../models/Notification");

// =========================================================
// CREATE SUPPORT TICKET
// =========================================================

exports.createTicket = async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const ticket = await SupportTicket.create({
      user: req.user.id || req.user._id,
      subject,
      message,
      category: category || "other",
      priority: priority || "medium",
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// GET SELLER'S TICKETS
// =========================================================

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const tickets = await SupportTicket.find({
      user: userId,
    })
      .populate("user", "name email role")
      .populate("replies.sender", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("Get tickets error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// GET SINGLE TICKET
// =========================================================

exports.getTicketById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: userId,
    })
      .populate("user", "name email role")
      .populate("replies.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    return res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================================
// ADD REPLY
// =========================================================

exports.addReply = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is already closed",
      });
    }

    ticket.replies.push({
      sender: userId,
      message: message.trim(),
    });

    await ticket.save();

    return res.json({
      success: true,
      message: "Reply added successfully",
      ticket,
    });
  } catch (error) {
    console.error("Add reply error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};