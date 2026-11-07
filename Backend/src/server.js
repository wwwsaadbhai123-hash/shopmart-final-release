
// ============================================================
// SHOPMART BACKEND
// PHASE 25 - SECURITY
// CORS + PERFORMANCE + ALL API ROUTES
// ============================================================

require("dotenv").config();

const compression = require("compression");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

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

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const returnRoutes = require("./routes/returnRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const sellerProductRoutes = require("./routes/sellerProductRoutes");
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");
const sellerReturnRoutes = require("./routes/sellerReturnRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const sellerAnalyticsRoutes = require("./routes/sellerAnalyticsRoutes");
const sellerEarningsRoutes = require("./routes/sellerEarningsRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");
const chatRoutes = require("./routes/chatRoutes");

// ============================================================
// STRIPE WEBHOOK
// ============================================================

const {
  handleStripeWebhook,
} = require("./controllers/paymentController");

// ============================================================
// APP
// ============================================================

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

const PORT = process.env.PORT || 5000;

// ============================================================
// CORS CONFIGURATION - FIXED
// ============================================================

// Add frontend URLs through environment variables.
// FRONTEND_URL=https://your-production-frontend.vercel.app
//
// Optional:
// FRONTEND_URLS=https://frontend1.vercel.app,https://frontend2.vercel.app

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  "https://shopmart-frontend-three.vercel.app",
  "https://shopmart-frontend-git-main-saad-portfolio1.vercel.app",

  "https://shopmart-frontend-c3nfnwhdl-saad-portfolio1.vercel.app",

  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean),

  ...(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

const corsOptions = {
  origin: function (origin, callback) {

    // Allow requests without Origin.
    // Example: Postman, server-to-server requests.

    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    // Exact production and local origins.

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow deployments belonging to the ShopMart
    // frontend Vercel project naming pattern.
    //
    // Examples:
    // shopmart-frontend-three.vercel.app
    // shopmart-frontend-c3nfnwhdl-saad-portfolio1.vercel.app

    const shopmartVercelPattern =
      /^https:\/\/shopmart-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/i;

    if (shopmartVercelPattern.test(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);

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
    "Accept",
    "Origin",
    "X-Requested-With",
    "x-guest-chat-token",
  ],

  exposedHeaders: [
    "Content-Length",
  ],

  credentials: false,

  optionsSuccessStatus: 204,

  maxAge: 86400,
};

// ============================================================
// PERFORMANCE MIDDLEWARE
// ============================================================

app.use(performanceHeaders);
app.use(cacheControl);

// ============================================================
// CORS MUST RUN BEFORE OTHER SECURITY MIDDLEWARE
// ============================================================

app.use(cors(corsOptions));

// ============================================================
// DATABASE CONNECTION
// ============================================================

connectDB();

// ============================================================
// BASIC SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(blockDangerousMethods);

app.use(requestSizeGuard);

app.use(securityHeaders);

app.use(
  compression({
    threshold: 1024,
  })
);

// ============================================================
// GENERAL API RATE LIMIT
// ============================================================

app.use("/api", apiLimiter);

// ============================================================
// STRIPE WEBHOOK
// IMPORTANT: BEFORE express.json()
// ============================================================

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  handleStripeWebhook
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

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
    path.join(__dirname, "../uploads"),
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

app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/returns", returnRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/sellers", sellerRoutes);

app.use("/api/sellers/products", sellerProductRoutes);

app.use("/api/sellers/orders", sellerOrderRoutes);

app.use("/api/sellers/returns", sellerReturnRoutes);

app.use("/api/support-tickets", supportTicketRoutes);

app.use("/api/sellers/analytics", sellerAnalyticsRoutes);

app.use("/api/sellers/earnings", sellerEarningsRoutes);

app.use("/api/admin/dashboard", adminDashboardRoutes);

app.use("/api/admin/management", adminManagementRoutes);

app.use("/api/chat", chatRoutes);

// ============================================================
// ROOT API
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopMart Backend API is running",
  });
});

// ============================================================
// 404
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

  if (
    err.message === "CORS policy: Origin not allowed."
  ) {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request.",
    });
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong."
        : err.message || "Internal server error.",
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {

  console.log(
    `ShopMart Backend running on port ${PORT}`
  );

  console.log(
    "Security: Phase 25 enabled"
  );

  console.log(
    "CORS: Configured"
  );

});

