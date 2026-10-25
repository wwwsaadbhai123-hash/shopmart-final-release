// ============================================================
// SHOPMART BACKEND
// PHASE 25 — SECURITY
// FILE: backend/src/server.js
// ============================================================

require("dotenv").config();
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// ============================================================
// DATABASE
// ============================================================

const connectDB = require("./config/db");

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

const {
  apiLimiter,
  blockDangerousMethods,
  requestSizeGuard,
  securityHeaders,
} = require("./middleware/securityMiddleware");

const {
  cacheControl,
  staticCache,
  performanceHeaders,
} = require("./middleware/performanceMiddleware");

// ============================================================
// ROUTES
// ============================================================

// PHASE 4 — Users / Authentication
const userRoutes = require("./routes/userRoutes");

// PHASE 5/6 — Products
const productRoutes = require("./routes/productRoutes");

// PHASE 6 — Categories
const categoryRoutes = require("./routes/categoryRoutes");

// PHASE 11 — Orders
const orderRoutes = require("./routes/orderRoutes");

// PHASE 9 — Coupons
const couponRoutes = require("./routes/couponRoutes");

// PHASE 10 — Payments
const paymentRoutes = require("./routes/paymentRoutes");

// PHASE 12 — Notifications
const notificationRoutes = require("./routes/notificationRoutes");

// PHASE 13 — Returns
const returnRoutes = require("./routes/returnRoutes");

// PHASE 14 — Reviews
const reviewRoutes = require("./routes/reviewRoutes");

// PHASE 15 — Seller Registration
const sellerRoutes = require("./routes/sellerRoutes");

// PHASE 17 — Seller Products
const sellerProductRoutes = require("./routes/sellerProductRoutes");

// PHASE 18 — Seller Orders
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");

// PHASE 18 — Seller Returns
const sellerReturnRoutes = require("./routes/sellerReturnRoutes");

// PHASE 19 — Support Tickets
const supportTicketRoutes = require("./routes/supportTicketRoutes");

// PHASE 20 — Seller Analytics
const sellerAnalyticsRoutes = require("./routes/sellerAnalyticsRoutes");

// PHASE 21 — Seller Earnings
const sellerEarningsRoutes = require("./routes/sellerEarningsRoutes");

// PHASE 22 — Admin Dashboard
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

// PHASE 23 — Admin Management
const adminManagementRoutes = require("./routes/adminManagementRoutes");

// PHASE 24 — Live Chat
const chatRoutes = require("./routes/chatRoutes");

// ============================================================
// PAYMENT CONTROLLER
// ============================================================

const {
  handleStripeWebhook,
} = require("./controllers/paymentController");

// ============================================================
// APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;

// ============================================================
// PERFORMANCE HEADERS / CACHE CONTROL
// ============================================================

app.use(performanceHeaders);
app.use(cacheControl);

// ============================================================
// DATABASE CONNECTION
// ============================================================

connectDB();

// ============================================================
// BASIC SECURITY
// ============================================================

// Hide Express information
app.disable("x-powered-by");

// Helmet security headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// Block unnecessary/dangerous HTTP methods
app.use(blockDangerousMethods);

// Protect against very large requests
app.use(requestSizeGuard);

// Additional security headers
app.use(securityHeaders);

app.use(
  compression({
    threshold: 1024,
  })
);
// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman/server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS policy: Origin not allowed.")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: false,
  })
);

// ============================================================
// GENERAL API RATE LIMIT
// ============================================================

app.use("/api", apiLimiter);

// ============================================================
// PHASE 10 — STRIPE WEBHOOK
//
// IMPORTANT:
// Stripe webhook MUST come before express.json()
// because Stripe needs the raw request body.
// ============================================================

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  handleStripeWebhook
);

// ============================================================
// JSON BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

// ============================================================
// URL ENCODED BODY
// ============================================================

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  staticCache,
  express.static(
    path.join(
      __dirname,
      "../uploads"
    ),
    {
      maxAge: "1d",
      etag: true,
      lastModified: true,
    }
  )
);

// ============================================================
// API ROUTES
// ============================================================

// ============================================================
// PHASE 4 — USERS / AUTHENTICATION
// ============================================================

app.use(
  "/api/users",
  userRoutes
);

// ============================================================
// PHASE 5/6 — PRODUCTS
// ============================================================

app.use(
  "/api/products",
  productRoutes
);

// ============================================================
// PHASE 6 — CATEGORIES
// ============================================================

app.use(
  "/api/categories",
  categoryRoutes
);

// ============================================================
// PHASE 11 — ORDERS + TRACKING
// ============================================================

app.use(
  "/api/orders",
  orderRoutes
);

// ============================================================
// PHASE 9 — COUPONS
// ============================================================

app.use(
  "/api/coupons",
  couponRoutes
);

// ============================================================
// PHASE 10 — STRIPE PAYMENTS
// ============================================================

app.use(
  "/api/payments",
  paymentRoutes
);

// ============================================================
// PHASE 12 — NOTIFICATIONS
// ============================================================

app.use(
  "/api/notifications",
  notificationRoutes
);

// ============================================================
// PHASE 13 — RETURNS / REFUNDS
// ============================================================

app.use(
  "/api/returns",
  returnRoutes
);

// ============================================================
// PHASE 14 — REVIEWS + RATINGS
// ============================================================

app.use(
  "/api/reviews",
  reviewRoutes
);

// ============================================================
// PHASE 15 — SELLER REGISTRATION
// ============================================================

app.use(
  "/api/sellers",
  sellerRoutes
);

// ============================================================
// PHASE 17 — SELLER PRODUCTS + INVENTORY
// ============================================================

app.use(
  "/api/sellers/products",
  sellerProductRoutes
);

// ============================================================
// PHASE 18 — SELLER ORDERS
// ============================================================

app.use(
  "/api/sellers/orders",
  sellerOrderRoutes
);

// ============================================================
// PHASE 18 — SELLER RETURNS
// ============================================================

app.use(
  "/api/sellers/returns",
  sellerReturnRoutes
);

// ============================================================
// PHASE 19 — SELLER SUPPORT TICKETS
// ============================================================

app.use(
  "/api/support-tickets",
  supportTicketRoutes
);

// ============================================================
// PHASE 20 — SELLER ANALYTICS
// ============================================================

app.use(
  "/api/sellers/analytics",
  sellerAnalyticsRoutes
);

// ============================================================
// PHASE 21 — SELLER EARNINGS + PAYOUTS
// ============================================================

app.use(
  "/api/sellers/earnings",
  sellerEarningsRoutes
);

// ============================================================
// PHASE 22 — ADMIN DASHBOARD
// ============================================================

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

// ============================================================
// PHASE 23 — ADMIN MANAGEMENT
// ============================================================

app.use(
  "/api/admin/management",
  adminManagementRoutes
);

// ============================================================
// PHASE 24 — LIVE CHAT
// ============================================================

app.use(
  "/api/chat",
  chatRoutes
);

// ============================================================
// ROOT API
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopMart Backend API is running 🚀",
  });
});

// ============================================================
// 404 — API ROUTE NOT FOUND
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // CORS error
  if (
    err.message ===
    "CORS policy: Origin not allowed."
  ) {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request.",
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong."
        : err.message || "Internal server error.",
  });
});

// ============================================================
// SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `🚀 ShopMart Backend running on http://localhost:${PORT}`
  );

  console.log(
    `🔐 Security: Phase 25 enabled`
  );
});