// =========================================================
// PHASE 19 - SUPPORT TICKET ROUTES
// =========================================================

const express = require("express");
const router = express.Router();

const {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
} = require("../controllers/supportTicketController");

const { protect } = require("../middleware/authMiddleware");

// =========================================================
// SELLER SUPPORT TICKETS
// =========================================================

router.post("/", protect, createTicket);

router.get("/my", protect, getMyTickets);

router.get("/:id", protect, getTicketById);

router.post("/:id/reply", protect, addReply);

module.exports = router;