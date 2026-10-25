const Product = require("../models/Product");

// =========================================
// GET ALL PRODUCTS
// GET /api/products
// =========================================

const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      minPrice,
      maxPrice,
      sort = "",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      isActive: { $ne: false },
    };

    // -----------------------------
    // SEARCH
    // -----------------------------
    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // -----------------------------
    // CATEGORY
    // -----------------------------
    if (category.trim()) {
      filter.category = category.trim();
    }

    // -----------------------------
    // PRICE FILTER
    // -----------------------------
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // -----------------------------
    // SORT
    // -----------------------------
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price-low") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price-high") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "name-asc") {
      sortOption = {
        name: 1,
      };
    }

    if (sort === "name-desc") {
      sortOption = {
        name: -1,
      };
    }

    if (sort === "rating") {
      sortOption = {
        rating: -1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    // -----------------------------
    // PAGINATION
    // -----------------------------
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 12, 1),
      100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      page: pageNumber,
      pages: Math.ceil(totalProducts / limitNumber),
      products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =========================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =========================================

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
};