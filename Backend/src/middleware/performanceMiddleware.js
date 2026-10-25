// ============================================================
// SHOPMART BACKEND
// PHASE 26 — PERFORMANCE OPTIMIZATION
// FILE: backend/src/middleware/performanceMiddleware.js
// ============================================================

/*
============================================================
CACHE CONTROL
============================================================
*/

const cacheControl = (req, res, next) => {
  // API responses should generally not be cached by browser
  // unless a specific route enables caching.
  if (req.path.startsWith("/api")) {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );
  }

  next();
};

/*
============================================================
STATIC CACHE
============================================================
*/

const staticCache = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=86400"
  );

  next();
};

/*
============================================================
API PERFORMANCE HEADERS
============================================================
*/

const performanceHeaders = (req, res, next) => {
  res.setHeader(
    "X-Performance-Phase",
    "26"
  );

  next();
};

/*
============================================================
PAGINATION HELPER
============================================================
*/

const getPagination = (req) => {
  let page = Number.parseInt(
    req.query.page,
    10
  );

  let limit = Number.parseInt(
    req.query.limit,
    10
  );

  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    limit = 20;
  }

  // Never allow huge API responses
  if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

module.exports = {
  cacheControl,
  staticCache,
  performanceHeaders,
  getPagination,
};