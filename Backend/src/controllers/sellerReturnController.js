// =========================================================
// PHASE 18 - SELLER RETURNS CONTROLLER
// =========================================================

const Seller = require("../models/Seller");
const Product = require("../models/Product");
const ReturnRequest = require("../models/ReturnRequest");

// =========================================================
// GET SELLER PROFILE FOR THE AUTHENTICATED USER
// =========================================================

const getSeller = async (userId) => {
  return await Seller.findOne({ user: userId });
};

// =========================================================
// GET SELLER PRODUCT IDS
// =========================================================

const getSellerProductIds = async (sellerId) => {
  const products = await Product.find({ seller: sellerId }).select("_id");

  return new Set(products.map((product) => String(product._id)));
};

// =========================================================
// FIND THE ORDER ITEM (AND ITS PRODUCT) THAT BELONGS TO
// THIS SELLER, WITHIN A RETURN REQUEST'S ORDER
// =========================================================

const findSellerItem = (returnRequest, sellerProductIds) => {
  const items = returnRequest.order?.items || [];

  return items.find((item) => {
    const productId = item.product?._id || item.product;

    return productId && sellerProductIds.has(String(productId));
  });
};

// =========================================================
// GET SELLER RETURNS
// =========================================================

const getSellerReturns = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSeller(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved.",
      });
    }

    const sellerProductIds = await getSellerProductIds(seller._id);

    const allReturns = await ReturnRequest.find({})
      .populate("user", "name email phone")
      .populate({
        path: "order",
        populate: { path: "items.product", select: "name price image" },
      })
      .sort({ createdAt: -1 });

    const sellerReturns = [];

    for (const returnRequest of allReturns) {
      const sellerItem = findSellerItem(returnRequest, sellerProductIds);

      if (sellerItem) {
        const returnObject = returnRequest.toObject();
        returnObject.product = sellerItem.product;
        sellerReturns.push(returnObject);
      }
    }

    return res.status(200).json({
      success: true,
      returns: sellerReturns,
      count: sellerReturns.length,
    });
  } catch (error) {
    console.error("Get seller returns error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load return requests.",
    });
  }
};

// =========================================================
// UPDATE RETURN STATUS
// =========================================================

const updateSellerReturnStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const seller = await getSeller(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    if (seller.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved.",
      });
    }

    const sellerProductIds = await getSellerProductIds(seller._id);

    const newStatus = String(req.body.status || "").toLowerCase();

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "refunded",
      "cancelled",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return status.",
      });
    }

    const returnRequest = await ReturnRequest.findById(
      req.params.id
    ).populate({
      path: "order",
      populate: { path: "items.product", select: "name price" },
    });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found.",
      });
    }

    const sellerItem = findSellerItem(returnRequest, sellerProductIds);

    if (!sellerItem) {
      return res.status(403).json({
        success: false,
        message: "This return request is not for your product.",
      });
    }

    returnRequest.status = newStatus;
    returnRequest.processedAt = new Date();

    if (req.body.reason !== undefined) {
      returnRequest.responseNote = req.body.reason;
    }

    await returnRequest.save();

    return res.status(200).json({
      success: true,
      message: "Return request status updated successfully.",
      returnRequest,
    });
  } catch (error) {
    console.error("Update seller return error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update return request.",
    });
  }
};

module.exports = {
  getSellerReturns,
  updateSellerReturnStatus,
};
