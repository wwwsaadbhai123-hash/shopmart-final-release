const express = require("express");

const {
  getMyNotifications,
  getUnreadCount,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
=========================================================
PHASE 12 — NOTIFICATION ROUTES
=========================================================
*/

/*
GET ALL MY NOTIFICATIONS
*/
router.get(
  "/",
  protect,
  getMyNotifications
);

/*
GET UNREAD NOTIFICATION COUNT
*/
router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

/*
CREATE NOTIFICATION
*/
router.post(
  "/",
  protect,
  createNotification
);

/*
MARK ALL AS READ
IMPORTANT: This must come before /:id/read
*/
router.put(
  "/read-all",
  protect,
  markAllNotificationsRead
);

/*
MARK ONE AS READ
*/
router.put(
  "/:id/read",
  protect,
  markNotificationRead
);

/*
DELETE NOTIFICATION
*/
router.delete(
  "/:id",
  protect,
  deleteNotification
);

module.exports = router;