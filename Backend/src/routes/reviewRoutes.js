const express = require("express");

const router = express.Router();

const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");

// Get all reviews of a product
router.get("/product/:productId", getProductReviews);

// Create review
router.post("/product/:productId", protect, createReview);

// Update own review
router.put("/:reviewId", protect, updateReview);

// Delete own review
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;