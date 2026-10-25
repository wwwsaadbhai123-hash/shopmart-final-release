const Review = require("../models/Review");
const Product = require("../models/Product");

// =========================================================
// GET REVIEWS FOR PRODUCT
// =========================================================

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({
      product: productId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

// =========================================================
// CREATE REVIEW
// =========================================================

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review must contain at least 3 characters",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "name"
    );

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Create review error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};

// =========================================================
// UPDATE REVIEW
// =========================================================

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own review",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review must contain at least 3 characters",
      });
    }

    review.rating = Number(rating);
    review.comment = comment.trim();

    await review.save();

    const updatedReview = await Review.findById(review._id).populate(
      "user",
      "name"
    );

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Update review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

// =========================================================
// DELETE REVIEW
// =========================================================

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};