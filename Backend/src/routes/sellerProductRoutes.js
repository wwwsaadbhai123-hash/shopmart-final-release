// =========================================================
// PHASE 17 - SELLER PRODUCT ROUTES
// =========================================================

const express = require("express");

const router = express.Router();

const {
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  updateSellerStock,
} = require("../controllers/sellerProductController");

const {
  protect,
} = require("../middleware/authMiddleware");

// GET seller products
router.get(
  "/",
  protect,
  getSellerProducts
);

// CREATE product
router.post(
  "/",
  protect,
  createSellerProduct
);

// UPDATE product
router.put(
  "/:id",
  protect,
  updateSellerProduct
);

// DELETE product
router.delete(
  "/:id",
  protect,
  deleteSellerProduct
);

// UPDATE stock
router.patch(
  "/:id/stock",
  protect,
  updateSellerStock
);

module.exports = router;