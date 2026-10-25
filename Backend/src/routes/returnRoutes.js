/* =========================================================
   SHOPMART - PHASE 13
   RETURN / REFUND ROUTES
========================================================= */

const express = require("express");

const {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelReturnRequest,
} = require("../controllers/returnController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   CREATE REQUEST
========================= */

router.post(
  "/",
  protect,
  createReturnRequest
);

/* =========================
   GET MY REQUESTS
========================= */

router.get(
  "/",
  protect,
  getMyReturnRequests
);

/* =========================
   GET SINGLE REQUEST
========================= */

router.get(
  "/:id",
  protect,
  getReturnRequestById
);

/* =========================
   CANCEL REQUEST
========================= */

router.put(
  "/:id/cancel",
  protect,
  cancelReturnRequest
);

module.exports = router;