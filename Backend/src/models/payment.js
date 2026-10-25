const mongoose = require("mongoose");

const paymentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const paymentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // The authenticated customer who started this Stripe checkout.
    // Required for new payments so the resulting Order can be
    // attributed correctly; left optional at the schema level so
    // this never throws for any pre-existing documents.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Captured at checkout-session creation time, same shape as
    // Order.shippingAddress, so the Order created after verified
    // payment has everything it needs.
    shippingAddress: {
      fullName: { type: String, trim: true },
      countryCode: { type: String, trim: true },
      phone: { type: String, trim: true },
      cnic: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },

    // Set once the Order has actually been created for this
    // payment. Checking this (not just payment.status) is what
    // makes Order creation idempotent against repeated/duplicate
    // verification calls (webhook + polling fallback both landing,
    // or the success page being refreshed).
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    items: {
      type: [paymentItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    couponCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },

    currency: {
      type: String,
      default: "pkr",
      lowercase: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },

    stripePaymentIntentId: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model("Payment", paymentSchema);