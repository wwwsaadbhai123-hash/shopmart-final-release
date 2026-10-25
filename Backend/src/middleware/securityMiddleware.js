const rateLimit = require("express-rate-limit");

/*
=========================================================
SHOPMART - SECURITY MIDDLEWARE
PHASE 25
=========================================================
*/

/*
=========================================================
GENERAL API RATE LIMIT
=========================================================
*/

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/*
=========================================================
AUTH RATE LIMIT
Login / Register / OTP / Forgot Password
=========================================================
*/

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

/*
=========================================================
SENSITIVE ACTION RATE LIMIT
Payments / Orders / Payouts / Password changes
=========================================================
*/

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 60,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests for this operation. Please try again later.",
  },
});

/*
=========================================================
BLOCK UNNECESSARY HTTP METHODS
=========================================================
*/

const blockDangerousMethods = (req, res, next) => {
  const blockedMethods = ["TRACE", "CONNECT"];

  if (blockedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: "HTTP method not allowed.",
    });
  }

  next();
};

/*
=========================================================
REQUEST SIZE PROTECTION
=========================================================
*/

const requestSizeGuard = (req, res, next) => {
  const contentLength = Number(req.headers["content-length"] || 0);

  // 10 MB maximum request size
  const MAX_REQUEST_SIZE = 10 * 1024 * 1024;

  if (contentLength > MAX_REQUEST_SIZE) {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large.",
    });
  }

  next();
};

/*
=========================================================
SECURITY RESPONSE HEADERS
=========================================================
*/

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");

  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  blockDangerousMethods,
  requestSizeGuard,
  securityHeaders,
};