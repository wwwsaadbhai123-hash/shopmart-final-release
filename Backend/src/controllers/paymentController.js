const Stripe = require("stripe");

const Payment = require("../models/payment");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// Same required fields createOrder() (COD) validates - kept in
// sync intentionally so a Stripe order is held to the same bar
// before it is ever created.
const REQUIRED_SHIPPING_FIELDS = [
  "fullName",
  "countryCode",
  "phone",
  "cnic",
  "address",
  "city",
  "province",
  "postalCode",
];

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return "Shipping address is required";
  }

  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (
      shippingAddress[field] === undefined ||
      shippingAddress[field] === null ||
      String(shippingAddress[field]).trim() === ""
    ) {
      return `${field} is required`;
    }
  }

  return null;
};

/* ========================================
   COUPON CODE
======================================== */

const normalizeCouponCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase();

/* ========================================
   CALCULATE COUPON
======================================== */

const calculateCouponDiscount = async (
  couponCode,
  subtotal
) => {
  if (!couponCode) {
    return {
      coupon: null,
      discountAmount: 0,
    };
  }

  const coupon = await Coupon.findOne({
    code: normalizeCouponCode(couponCode),
  });

  if (!coupon) {
    const error =
      new Error("Invalid coupon code");

    error.statusCode = 404;

    throw error;
  }

  if (!coupon.isActive) {
    const error =
      new Error(
        "This coupon is inactive"
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    new Date() >
    new Date(coupon.expiryDate)
  ) {
    const error =
      new Error(
        "This coupon has expired"
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >=
      coupon.usageLimit
  ) {
    const error =
      new Error(
        "This coupon usage limit has been reached"
      );

    error.statusCode = 400;

    throw error;
  }

  if (
    subtotal <
    coupon.minOrderAmount
  ) {
    const error =
      new Error(
        `Minimum order amount is Rs. ${coupon.minOrderAmount}`
      );

    error.statusCode = 400;

    throw error;
  }

  let discountAmount = 0;

  if (
    coupon.discountType ===
    "percentage"
  ) {
    discountAmount =
      (subtotal *
        coupon.discountValue) /
      100;

    if (
      coupon.maxDiscount !== null &&
      discountAmount >
        coupon.maxDiscount
    ) {
      discountAmount =
        coupon.maxDiscount;
    }
  }

  if (
    coupon.discountType === "fixed"
  ) {
    discountAmount =
      coupon.discountValue;
  }

  discountAmount = Math.min(
    discountAmount,
    subtotal
  );

  return {
    coupon,
    discountAmount:
      Number(
        discountAmount.toFixed(2)
      ),
  };
};

/* ========================================
   CREATE STRIPE CHECKOUT
======================================== */

const createCheckoutSession =
  async (req, res) => {
    let paymentRecord = null;

    try {
      const {
        items,
        couponCode,
        shippingAddress,
      } = req.body;

      // -----------------------------------------------------
      // AUTHENTICATION
      // -----------------------------------------------------
      // Required so the Order created after verified payment can
      // be attributed to a real user, exactly like COD orders.

      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "User authentication is required",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      // -----------------------------------------------------
      // SHIPPING ADDRESS
      // -----------------------------------------------------
      // Collected up front and stored on the Payment record so it
      // is available the moment payment is verified - the Order
      // is never created without it.

      const shippingError = validateShippingAddress(
        shippingAddress
      );

      if (shippingError) {
        return res.status(400).json({
          success: false,
          message: shippingError,
        });
      }

      if (!stripe) {
        return res.status(500).json({
          success: false,
          message:
            "Stripe secret key is not configured",
        });
      }

      const safeItems = [];

      let subtotal = 0;

      /* =========================
         SERVER-SIDE PRODUCT CHECK
      ========================= */

      for (const item of items) {
        if (!item?.productId) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product in cart",
          });
        }

        const quantity =
          Number(item.quantity);

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product quantity",
          });
        }

        const product =
          await Product.findById(
            item.productId
          );

        if (!product) {
          return res.status(404).json({
            success: false,
            message:
              "One of the products no longer exists",
          });
        }

        const stock =
          Number(product.stock || 0);

        if (stock <= 0) {
          return res.status(400).json({
            success: false,
            message:
              `${product.name} is out of stock`,
          });
        }

        if (quantity > stock) {
          return res.status(400).json({
            success: false,
            message:
              `Only ${stock} unit(s) of ${product.name} are available`,
          });
        }

        const price =
          Number(product.price || 0);

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid price for ${product.name}`,
          });
        }

        subtotal +=
          price * quantity;

        safeItems.push({
          product: product._id,
          name: product.name,
          quantity,
          price,
        });
      }

      subtotal =
        Number(
          subtotal.toFixed(2)
        );

      /* =========================
         COUPON VALIDATION
      ========================= */

      const {
        coupon,
        discountAmount,
      } =
        await calculateCouponDiscount(
          couponCode,
          subtotal
        );

      const totalAmount =
        Number(
          Math.max(
            0,
            subtotal -
              discountAmount
          ).toFixed(2)
        );

      if (totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount must be greater than 0",
        });
      }

      /* =========================
         SAVE PAYMENT
      ========================= */

      paymentRecord =
        await Payment.create({
          user: req.user._id,

          shippingAddress: {
            fullName: String(shippingAddress.fullName).trim(),
            countryCode: String(shippingAddress.countryCode).trim(),
            phone: String(shippingAddress.phone).trim(),
            cnic: String(shippingAddress.cnic).trim(),
            address: String(shippingAddress.address).trim(),
            city: String(shippingAddress.city).trim(),
            province: String(shippingAddress.province).trim(),
            postalCode: String(shippingAddress.postalCode).trim(),
          },

          items: safeItems,

          subtotal,

          discountAmount,

          totalAmount,

          couponCode: coupon
            ? coupon.code
            : null,

          currency: "pkr",

          status: "pending",
        });

      const itemCount =
        safeItems.reduce(
          (total, item) =>
            total +
            item.quantity,
          0
        );

      /* =========================
         STRIPE SESSION
      ========================= */

      const session =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            line_items: [
              {
                price_data: {
                  currency: "pkr",

                  product_data: {
                    name:
                      "ShopMart Order",

                    description:
                      `${itemCount} item(s)${
                        coupon
                          ? ` • Coupon ${coupon.code} applied`
                          : ""
                      }`,
                  },

                  unit_amount:
                    Math.round(
                      totalAmount *
                        100
                    ),
                },

                quantity: 1,
              },
            ],

            success_url:
              `${FRONTEND_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
              `${FRONTEND_URL}/?payment=cancelled`,

            client_reference_id:
              String(
                paymentRecord._id
              ),

            metadata: {
              paymentId:
                String(
                  paymentRecord._id
                ),
            },
          }
        );

      paymentRecord.sessionId =
        session.id;

      await paymentRecord.save();

      return res.json({
        success: true,

        message:
          "Stripe Checkout session created",

        url: session.url,

        sessionId:
          session.id,

        paymentId:
          paymentRecord._id,

        subtotal,

        discountAmount,

        totalAmount,
      });
    } catch (error) {
      if (paymentRecord?._id) {
        await Payment
          .findByIdAndDelete(
            paymentRecord._id
          )
          .catch(() => {});
      }

      console.error(
        "CREATE STRIPE CHECKOUT ERROR:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Unable to create payment session",
      });
    }
  };

/* ========================================
   MARK PAYMENT PAID
======================================== */

const markPaymentPaid =
  async (session) => {
    const paymentId =
      session.metadata?.paymentId ||
      session.client_reference_id;

    if (!paymentId) {
      return null;
    }

    // -----------------------------------------------------
    // ATOMIC pending -> paid TRANSITION
    // -----------------------------------------------------
    // This is what makes Order creation idempotent. The webhook
    // and the polling fallback (getPaymentSession) can both call
    // this for the same payment - whichever call wins this atomic
    // update is the ONLY one that proceeds to create the Order.
    // A refreshed success page re-triggers this function too, but
    // it will simply find status is already "paid" and no-op.

    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: { $ne: "paid" } },
      {
        $set: {
          status: "paid",
          stripePaymentIntentId: session.payment_intent || null,
        },
      },
      { new: true }
    );

    if (!payment) {
      // Already paid (or payment doesn't exist) - return whatever
      // exists so callers can still read the linked order, if any.
      return await Payment.findById(paymentId);
    }

    /* =========================
       COUPON USAGE
    ========================= */
    // Only runs once, since this code is only reached by the
    // single call that won the atomic transition above.

    if (payment.couponCode) {
      await Coupon.findOneAndUpdate(
        {
          code:
            payment.couponCode,
        },
        {
          $inc: {
            usedCount: 1,
          },
        }
      );
    }

    /* =========================
       CREATE THE ORDER
    ========================= */
    // Only ever runs once per payment (guarded by the atomic
    // transition above) - this is what prevents duplicate orders
    // on repeated/duplicate verification.

    try {
      const order = await Order.create({
        user: payment.user,
        items: payment.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: payment.totalAmount,
        status: "pending",
        paymentStatus: "paid",
        paymentMethod: "stripe",
        payment: payment._id,
        shippingAddress: payment.shippingAddress,
      });

      // Reduce stock now that payment is genuinely verified.
      // Floor at 0 (never negative) - the payment has already
      // been taken, so this is best-effort bookkeeping, not a
      // gate that can reject the order.
      for (const item of payment.items) {
        const product = await Product.findById(item.product);

        if (product) {
          product.stock = Math.max(
            0,
            Number(product.stock || 0) - Number(item.quantity || 0)
          );

          await product.save();
        }
      }

      payment.order = order._id;
      await payment.save();
    } catch (orderError) {
      // The payment is genuinely taken (status stays "paid") even
      // if Order creation fails for some reason - we log loudly
      // rather than silently lose it. getPaymentSession surfaces
      // payment.order === null so this is visible, not hidden.
      console.error(
        "STRIPE PAYMENT VERIFIED BUT ORDER CREATION FAILED:",
        orderError
      );
    }

    return payment;
  };

/* ========================================
   GET PAYMENT SESSION
======================================== */

const getPaymentSession =
  async (req, res) => {
    try {
      const {
        sessionId,
      } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Session ID is required",
        });
      }

      const payment =
        await Payment.findOne({
          sessionId,
        });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Payment session not found",
        });
      }

      // -----------------------------------------------------
      // AUTHORIZATION
      // -----------------------------------------------------
      // Same rule as order access: only the customer who started
      // this checkout (or an admin) may look it up.

      if (
        payment.user &&
        String(payment.user) !== String(req.user._id) &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this payment session",
        });
      }

      if (!stripe) {
        return res.status(500).json({
          success: false,
          message:
            "Stripe secret key is not configured",
        });
      }

      /* =========================
         FALLBACK VERIFICATION
      ========================= */

      if (
        payment.status ===
        "pending"
      ) {
        const session =
          await stripe.checkout.sessions.retrieve(
            sessionId
          );

        if (
          session.payment_status ===
          "paid"
        ) {
          await markPaymentPaid(
            session
          );
        }
      }

      const refreshedPayment =
        await Payment.findById(
          payment._id
        );

      let order = null;

      if (refreshedPayment?.order) {
        order = await Order.findById(
          refreshedPayment.order
        ).populate(
          "items.product",
          "name price image stock"
        );
      }

      return res.json({
        success: true,
        payment:
          refreshedPayment,
        order,
      });
    } catch (error) {
      console.error(
        "GET PAYMENT SESSION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to fetch payment session",
      });
    }
  };

/* ========================================
   STRIPE WEBHOOK
======================================== */

const handleStripeWebhook =
  async (req, res) => {
    const signature =
      req.headers[
        "stripe-signature"
      ];

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message:
          "Stripe secret key is not configured",
      });
    }

    if (
      !process.env
        .STRIPE_WEBHOOK_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Stripe webhook secret is not configured",
      });
    }

    let event;

    try {
      event =
        stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env
            .STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
      console.error(
        "STRIPE WEBHOOK SIGNATURE ERROR:",
        error.message
      );

      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":

        case "checkout.session.async_payment_succeeded":
          await markPaymentPaid(
            event.data.object
          );

          break;

        case "checkout.session.expired": {
          const session =
            event.data.object;

          const paymentId =
            session.metadata
              ?.paymentId ||
            session.client_reference_id;

          if (paymentId) {
            await Payment.findByIdAndUpdate(
              paymentId,
              {
                status:
                  "cancelled",
              }
            );
          }

          break;
        }

        case "checkout.session.async_payment_failed": {
          const session =
            event.data.object;

          const paymentId =
            session.metadata
              ?.paymentId ||
            session.client_reference_id;

          if (paymentId) {
            await Payment.findByIdAndUpdate(
              paymentId,
              {
                status: "failed",
              }
            );
          }

          break;
        }

        default:
          break;
      }

      return res.json({
        received: true,
      });
    } catch (error) {
      console.error(
        "STRIPE WEBHOOK HANDLER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook processing failed",
      });
    }
  };

module.exports = {
  createCheckoutSession,
  getPaymentSession,
  handleStripeWebhook,
  // Exported for testing the webhook/polling idempotency guard
  // directly; not mounted on any route.
  markPaymentPaid,
};