const User = require("../models/User");
const Seller = require("../models/Seller");

// =========================================================
// SELLER REGISTRATION
// =========================================================

const registerSeller = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      shopName,
      cnicNumber,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!shopName || !shopName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required",
      });
    }

    if (!cnicNumber || !cnicNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "CNIC number is required",
      });
    }

    // Pakistani CNIC format: 13 digits
    const cleanCnic = cnicNumber.replace(/[-\s]/g, "");

    if (!/^\d{13}$/.test(cleanCnic)) {
      return res.status(400).json({
        success: false,
        message: "CNIC must contain exactly 13 digits",
      });
    }

    // -----------------------------------------------------
    // USER
    // -----------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------------
    // ALREADY APPROVED
    // -----------------------------------------------------

    if (
      user.role === "vendor" &&
      user.sellerStatus === "approved"
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already an approved seller",
      });
    }

    // -----------------------------------------------------
    // ALREADY PENDING
    // -----------------------------------------------------

    if (user.sellerStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your seller application is already pending",
      });
    }

    // -----------------------------------------------------
    // CNIC IMAGES
    // -----------------------------------------------------

    const cnicFrontImage =
      req.files?.cnicFront?.[0]?.filename || "";

    const cnicBackImage =
      req.files?.cnicBack?.[0]?.filename || "";

    if (!cnicFrontImage || !cnicBackImage) {
      return res.status(400).json({
        success: false,
        message: "Both CNIC front and back images are required",
      });
    }

    // -----------------------------------------------------
    // SAVE SELLER APPLICATION
    // -----------------------------------------------------

    user.shopName = shopName.trim();
    user.cnicNumber = cleanCnic;

    user.cnicFrontImage =
      `/uploads/seller-documents/${cnicFrontImage}`;

    user.cnicBackImage =
      `/uploads/seller-documents/${cnicBackImage}`;

    user.sellerStatus = "pending";
    user.sellerRejectionReason = "";
    user.sellerAppliedAt = new Date();

    await user.save();

    await Seller.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        shop_name: user.shopName,
        cnic_number: user.cnicNumber,
        cnic_front_image: user.cnicFrontImage,
        cnic_back_image: user.cnicBackImage,
        status: "pending",
        rejectionReason: "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message:
        "Seller application submitted successfully. Waiting for admin approval.",
      seller: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        cnicNumber: user.cnicNumber,
        sellerStatus: user.sellerStatus,
        sellerAppliedAt: user.sellerAppliedAt,
      },
    });
  } catch (error) {
    console.error("Seller registration error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit seller application",
    });
  }
};

// =========================================================
// GET MY SELLER STATUS
// =========================================================

const getMySellerStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      seller: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shopName: user.shopName,
        cnicNumber: user.cnicNumber,
        cnicFrontImage: user.cnicFrontImage,
        cnicBackImage: user.cnicBackImage,
        sellerStatus: user.sellerStatus,
        sellerRejectionReason:
          user.sellerRejectionReason,
        sellerAppliedAt: user.sellerAppliedAt,
        sellerApprovedAt: user.sellerApprovedAt,
      },
    });
  } catch (error) {
    console.error("Get seller status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get seller status",
    });
  }
};

// =========================================================
// ADMIN - GET SELLER APPLICATIONS
// =========================================================

const getSellerApplications = async (req, res) => {
  try {
    const sellers = await User.find({
      sellerStatus: {
        $in: ["pending", "approved", "rejected"],
      },
    })
      .select(
        "-password -otp -otpExpires"
      )
      .sort({
        sellerAppliedAt: -1,
      });

    res.status(200).json({
      success: true,
      sellers,
    });
  } catch (error) {
    console.error(
      "Get seller applications error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller applications",
    });
  }
};

// =========================================================
// ADMIN - APPROVE SELLER
// =========================================================

const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    if (seller.sellerStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Seller is already approved",
      });
    }

    seller.role = "vendor";
    seller.sellerStatus = "approved";
    seller.sellerRejectionReason = "";
    seller.sellerApprovedAt = new Date();

    await seller.save();

    await Seller.findOneAndUpdate(
      { user: seller._id },
      { status: "approved", rejectionReason: "" }
    );

    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        shopName: seller.shopName,
        role: seller.role,
        sellerStatus: seller.sellerStatus,
        sellerApprovedAt: seller.sellerApprovedAt,
      },
    });
  } catch (error) {
    console.error("Approve seller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve seller",
    });
  }
};

// =========================================================
// ADMIN - REJECT SELLER
// =========================================================

const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    seller.sellerStatus = "rejected";
    seller.sellerRejectionReason =
      reason?.trim() || "Application rejected by admin";

    seller.role = "customer";

    await seller.save();

    await Seller.findOneAndUpdate(
      { user: seller._id },
      {
        status: "rejected",
        rejectionReason: seller.sellerRejectionReason,
      }
    );

    res.status(200).json({
      success: true,
      message: "Seller application rejected",
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        shopName: seller.shopName,
        role: seller.role,
        sellerStatus: seller.sellerStatus,
        sellerRejectionReason:
          seller.sellerRejectionReason,
      },
    });
  } catch (error) {
    console.error("Reject seller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject seller",
    });
  }
};

module.exports = {
  registerSeller,
  getMySellerStatus,
  getSellerApplications,
  approveSeller,
  rejectSeller,
};