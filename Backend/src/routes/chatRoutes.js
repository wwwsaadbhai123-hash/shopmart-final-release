
const express = require("express");
const router = express.Router();

const {
  getMyConversations,
  createConversation,
  getMessages,
  sendMessage,
  closeConversation,
  reopenConversation,
  getAllConversations,
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

router.get("/", protect, getMyConversations);
router.post("/", protect, createConversation);

router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

router.patch("/:id/close", protect, closeConversation);

router.patch(
  "/:id/reopen",
  protect,
  adminOnly,
  reopenConversation
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllConversations
);

module.exports = router;
