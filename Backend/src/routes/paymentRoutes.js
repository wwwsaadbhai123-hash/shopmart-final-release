const express = require("express");

const {
  createCheckoutSession,
  getPaymentSession,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Stripe checkout now needs to know who is checking out (so the
// Order created after verified payment is attributed to the right
// user, exactly like the existing COD flow).
//
// NOTE: the real Stripe webhook (POST /api/payments/webhook) is
// mounted directly in server.js, BEFORE express.json(), because
// Stripe signature verification needs the raw request body. It is
// intentionally not duplicated here.
router.post(
  "/create-checkout-session",
  protect,
  createCheckoutSession
);

router.get(
  "/session/:sessionId",
  protect,
  getPaymentSession
);

module.exports = router;