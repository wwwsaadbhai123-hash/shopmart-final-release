// =========================================================
// PHASE 17 - SELLER PRODUCTS + INVENTORY CONTROLLER
// =========================================================

const Seller = require("../models/Seller");
const Product = require("../models/Product");

// =========================================================
// GET SELLER PROFILE
// =========================================================

const getSellerProfile = async (userId) => {
  return await Seller.findOne({
    user: userId,
  });
};

// =========================================================
// GET SELLER PRODUCTS
// =========================================================

const getSellerProducts = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSellerProfile(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Seller account is ${seller.status}.`,
      });
    }

    const products = await Product.find({
      seller: seller._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error(
      "Get seller products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load seller products.",
    });
  }
};

// =========================================================
// CREATE SELLER PRODUCT
// =========================================================

const createSellerProduct = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSellerProfile(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your seller account must be approved before adding products.",
      });
    }

    const {
      title,
      name,
      description,
      price,
      stock,
      category,
      image,
      images,
      rating,
    } = req.body;

    const productTitle =
      title?.trim() ||
      name?.trim();

    if (!productTitle) {
      return res.status(400).json({
        success: false,
        message: "Product title is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product price is required.",
      });
    }

    if (
      stock === undefined ||
      stock === null ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product stock is required.",
      });
    }

    const productData = {
      name: productTitle,
      description: description || "",
      price: Number(price),
      stock: Number(stock),
      category: category || null,
      seller: seller._id,
    };

    if (image) {
      productData.image = image;
    } else if (Array.isArray(images) && images[0]) {
      // Product schema only stores a single image URL; fall back to
      // the first entry if the client sends an "images" array.
      productData.image = images[0];
    }

    if (
      rating !== undefined &&
      rating !== null
    ) {
      productData.rating = Number(rating);
    }

    const product =
      await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Create seller product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create product.",
    });
  }
};

// =========================================================
// UPDATE SELLER PRODUCT
// =========================================================

const updateSellerProduct = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSellerProfile(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Seller account is not approved.",
      });
    }

    const product =
      await Product.findOne({
        _id: req.params.id,
        seller: seller._id,
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or does not belong to you.",
      });
    }

    const {
      title,
      name,
      description,
      price,
      stock,
      category,
      image,
      images,
    } = req.body;

    if (title !== undefined) {
      product.name = String(title).trim();
    }

    if (
      name !== undefined &&
      !title
    ) {
      product.name = String(name).trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({
          success: false,
          message: "Price cannot be negative.",
        });
      }

      product.price = Number(price);
    }

    if (stock !== undefined) {
      if (Number(stock) < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock cannot be negative.",
        });
      }

      product.stock = Number(stock);
    }

    if (category !== undefined) {
      product.category = category || null;
    }

    if (image !== undefined) {
      product.image = image;
    } else if (Array.isArray(images) && images[0]) {
      product.image = images[0];
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Update seller product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update product.",
    });
  }
};

// =========================================================
// DELETE SELLER PRODUCT
// =========================================================

const deleteSellerProduct = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSellerProfile(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const product =
      await Product.findOneAndDelete({
        _id: req.params.id,
        seller: seller._id,
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or does not belong to you.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete seller product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete product.",
    });
  }
};

// =========================================================
// UPDATE STOCK ONLY
// =========================================================

const updateSellerStock = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSellerProfile(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Seller account is not approved.",
      });
    }

    const stockNumber = Number(
      req.body.stock
    );

    if (
      !Number.isFinite(stockNumber) ||
      stockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock must be a valid number greater than or equal to 0.",
      });
    }

    const product =
      await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          seller: seller._id,
        },
        {
          $set: {
            stock: Math.floor(stockNumber),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or does not belong to you.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Update seller stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update stock.",
    });
  }
};

module.exports = {
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  updateSellerStock,
};
