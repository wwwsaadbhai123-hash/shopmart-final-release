const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
    
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

  // ============================================================
// PHASE 26 — PRODUCT PERFORMANCE INDEXES
// ============================================================

productSchema.index({
  category: 1,
});

productSchema.index({
  seller: 1,
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({
  name: 1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  isActive: 1,
});
productSchema.index({
  name: "text",
  description: "text",
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
