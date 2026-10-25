const Notification = require("../models/Notification");

/*
=========================================================
PHASE 12 — NOTIFICATION CONTROLLER
=========================================================
*/

/*
=========================================================
GET MY NOTIFICATIONS
GET /api/notifications
=========================================================
*/
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
    })
      .populate("order", "_id status totalAmount paymentStatus")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

/*
=========================================================
GET UNREAD COUNT
GET /api/notifications/unread-count
=========================================================
*/
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "Get unread count error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count.",
    });
  }
};

/*
=========================================================
CREATE NOTIFICATION
POST /api/notifications
=========================================================
*/
const createNotification = async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      order,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Title and message are required.",
      });
    }

    const notification =
      await Notification.create({
        user: req.user.id,
        type: type || "system",
        title,
        message,
        order: order || null,
        isRead: false,
      });

    res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      notification,
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create notification.",
    });
  }
};

/*
=========================================================
MARK ONE NOTIFICATION AS READ
PUT /api/notifications/:id/read
=========================================================
*/
const markNotificationRead = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message:
        "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to mark notification as read.",
    });
  }
};

/*
=========================================================
MARK ALL NOTIFICATIONS AS READ
PUT /api/notifications/read-all
=========================================================
*/
const markAllNotificationsRead = async (
  req,
  res
) => {
  try {
    await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message:
        "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to mark all notifications as read.",
    });
  }
};

/*
=========================================================
DELETE NOTIFICATION
DELETE /api/notifications/:id
=========================================================
*/
const deleteNotification = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete notification.",
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};