const express = require("express");

const {
  getProducts,
  getProductById,
} = require("../controllers/productController");

const router = express.Router();

// Get all products
router.get("/", getProducts);

// Get single product
router.get("/:id", getProductById);

module.exports = router;