// =========================================================
// PHASE 16 - SELLER MODEL
// =========================================================

const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    // -------------------------------------------------------
    // Seller's User Account
    // -------------------------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // -------------------------------------------------------
    // Shop Information
    // -------------------------------------------------------

    shop_name: {
      type: String,
      required: true,
      trim: true,
    },

    // -------------------------------------------------------
    // CNIC
    // -------------------------------------------------------

    cnic_number: {
      type: String,
      required: true,
      trim: true,
    },

    cnic_front_image: {
      type: String,
      default: "",
    },

    cnic_back_image: {
      type: String,
      default: "",
    },

    // -------------------------------------------------------
    // Seller Status
    // -------------------------------------------------------

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Seller ||
  mongoose.model(
    "Seller",
    sellerSchema
  );