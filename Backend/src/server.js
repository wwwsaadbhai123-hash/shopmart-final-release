// ============================================================
// SHOPMART BACKEND
// PHASE 25 â€” SECURITY
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

// PHASE 4 â€” Users / Authentication
const userRoutes = require("./routes/userRoutes");

// PHASE 5/6 â€” Products
const productRoutes = require("./routes/productRoutes");

// PHASE 6 â€” Categories
const categoryRoutes = require("./routes/categoryRoutes");

// PHASE 11 â€” Orders
const orderRoutes = require("./routes/orderRoutes");

// PHASE 9 â€” Coupons
const couponRoutes = require("./routes/couponRoutes");

// PHASE 10 â€” Payments
const paymentRoutes = require("./routes/paymentRoutes");

// PHASE 12 â€” Notifications
const notificationRoutes = require("./routes/notificationRoutes");

// PHASE 13 â€” Returns
const returnRoutes = require("./routes/returnRoutes");

// PHASE 14 â€” Reviews
const reviewRoutes = require("./routes/reviewRoutes");

// PHASE 15 â€” Seller Registration
const sellerRoutes = require("./routes/sellerRoutes");

// PHASE 17 â€” Seller Products
const sellerProductRoutes = require("./routes/sellerProductRoutes");

// PHASE 18 â€” Seller Orders
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");

// PHASE 18 â€” Seller Returns
const sellerReturnRoutes = require("./routes/sellerReturnRoutes");

// PHASE 19 â€” Support Tickets
const supportTicketRoutes = require("./routes/supportTicketRoutes");

// PHASE 20 â€” Seller Analytics
const sellerAnalyticsRoutes = require("./routes/sellerAnalyticsRoutes");

// PHASE 21 â€” Seller Earnings
const sellerEarningsRoutes = require("./routes/sellerEarningsRoutes");

// PHASE 22 â€” Admin Dashboard
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

// PHASE 23 â€” Admin Management
const adminManagementRoutes = require("./routes/adminManagementRoutes");

// PHASE 24 â€” Live Chat
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
  "https://shopmart-frontend-three.vercel.app",
  "https://shopmart-frontend-c3nfnwhdl-saad-portfolio1.vercel.app",
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
// PHASE 10 â€” STRIPE WEBHOOK
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
// PHASE 4 â€” USERS / AUTHENTICATION
// ============================================================

app.use(
  "/api/users",
  userRoutes
);

// ============================================================
// PHASE 5/6 â€” PRODUCTS
// ============================================================

app.use(
  "/api/products",
  productRoutes
);

// ============================================================
// PHASE 6 â€” CATEGORIES
// ============================================================

app.use(
  "/api/categories",
  categoryRoutes
);

// ============================================================
// PHASE 11 â€” ORDERS + TRACKING
// ============================================================

app.use(
  "/api/orders",
  orderRoutes
);

// ============================================================
// PHASE 9 â€” COUPONS
// ============================================================

app.use(
  "/api/coupons",
  couponRoutes
);

// ============================================================
// PHASE 10 â€” STRIPE PAYMENTS
// ============================================================

app.use(
  "/api/payments",
  paymentRoutes
);

// ============================================================
// PHASE 12 â€” NOTIFICATIONS
// ============================================================

app.use(
  "/api/notifications",
  notificationRoutes
);

// ============================================================
// PHASE 13 â€” RETURNS / REFUNDS
// ============================================================

app.use(
  "/api/returns",
  returnRoutes
);

// ============================================================
// PHASE 14 â€” REVIEWS + RATINGS
// ============================================================

app.use(
  "/api/reviews",
  reviewRoutes
);

// ============================================================
// PHASE 15 â€” SELLER REGISTRATION
// ============================================================

app.use(
  "/api/sellers",
  sellerRoutes
);

// ============================================================
// PHASE 17 â€” SELLER PRODUCTS + INVENTORY
// ============================================================

app.use(
  "/api/sellers/products",
  sellerProductRoutes
);

// ============================================================
// PHASE 18 â€” SELLER ORDERS
// ============================================================

app.use(
  "/api/sellers/orders",
  sellerOrderRoutes
);

// ============================================================
// PHASE 18 â€” SELLER RETURNS
// ============================================================

app.use(
  "/api/sellers/returns",
  sellerReturnRoutes
);

// ============================================================
// PHASE 19 â€” SELLER SUPPORT TICKETS
// ============================================================

app.use(
  "/api/support-tickets",
  supportTicketRoutes
);

// ============================================================
// PHASE 20 â€” SELLER ANALYTICS
// ============================================================

app.use(
  "/api/sellers/analytics",
  sellerAnalyticsRoutes
);

// ============================================================
// PHASE 21 â€” SELLER EARNINGS + PAYOUTS
// ============================================================

app.use(
  "/api/sellers/earnings",
  sellerEarningsRoutes
);

// ============================================================
// PHASE 22 â€” ADMIN DASHBOARD
// ============================================================

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

// ============================================================
// PHASE 23 â€” ADMIN MANAGEMENT
// ============================================================

app.use(
  "/api/admin/management",
  adminManagementRoutes
);

// ============================================================
// PHASE 24 â€” LIVE CHAT
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
    message: "ShopMart Backend API is running ðŸš€",
  });
});

// ============================================================
// 404 â€” API ROUTE NOT FOUND
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
    `ðŸš€ ShopMart Backend running on http://localhost:${PORT}`
  );

  console.log(
    `ðŸ” Security: Phase 25 enabled`
  );
});
