
const User = require("../models/User");
const Seller = require("../models/Seller");

// =========================================================
// SELLER REGISTRATION
// =========================================================

const registerSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shopName, cnicNumber } = req.body;

    // Validate shop name
    if (!shopName || !shopName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required",
      });
    }

    // Validate CNIC
    if (!cnicNumber || !cnicNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "CNIC number is required",
      });
    }

    const cleanCnic = cnicNumber.replace(/[-\s]/g, "");

    if (!/^\d{13}$/.test(cleanCnic)) {
      return res.status(400).json({
        success: false,
        message: "CNIC must contain exactly 13 digits",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent already approved sellers
    if (
      user.role === "vendor" &&
      user.sellerStatus === "approved"
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already an approved seller",
      });
    }

    // Check whether this is an application update
    const isUpdating = user.sellerStatus === "pending";

    // Get uploaded CNIC images
    const cnicFrontImage =
      req.files?.cnicFront?.[0]?.filename || "";

    const cnicBackImage =
      req.files?.cnicBack?.[0]?.filename || "";

    // Both images are required
    if (!cnicFrontImage || !cnicBackImage) {
      return res.status(400).json({
        success: false,
        message: "Both CNIC front and back images are required",
      });
    }

    // Save application in User collection
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

    // Create or update Seller collection record
    await Seller.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          user: userId,
          shop_name: user.shopName,
          cnic_number: user.cnicNumber,
          cnic_front_image: user.cnicFrontImage,
          cnic_back_image: user.cnicBackImage,
          status: "pending",
          rejectionReason: "",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(isUpdating ? 200 : 201).json({
      success: true,
      message: isUpdating
        ? "Seller application updated successfully. Waiting for admin approval."
        : "Seller application submitted successfully. Waiting for admin approval.",

      seller: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        sellerStatus: user.sellerStatus,
        sellerAppliedAt: user.sellerAppliedAt,
      },
    });
  } catch (error) {
    console.error("Seller registration error:", error);

    return res.status(500).json({
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
      "-password -otp -otpExpires -cnicNumber"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      seller: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shopName: user.shopName,
        cnicFrontImage: user.cnicFrontImage,
        cnicBackImage: user.cnicBackImage,
        sellerStatus: user.sellerStatus,
        sellerRejectionReason: user.sellerRejectionReason,
        sellerAppliedAt: user.sellerAppliedAt,
        sellerApprovedAt: user.sellerApprovedAt,
      },
    });
  } catch (error) {
    console.error("Get seller status error:", error);

    return res.status(500).json({
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
      .select("-password -otp -otpExpires")
      .sort({
        sellerAppliedAt: -1,
      });

    return res.status(200).json({
      success: true,
      sellers,
    });
  } catch (error) {
    console.error("Get seller applications error:", error);

    return res.status(500).json({
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

    if (seller.sellerStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be approved",
      });
    }

    seller.role = "vendor";
    seller.sellerStatus = "approved";
    seller.sellerRejectionReason = "";
    seller.sellerApprovedAt = new Date();

    await seller.save();

    await Seller.findOneAndUpdate(
      { user: seller._id },
      {
        $set: {
          status: "approved",
          rejectionReason: "",
        },
      }
    );

    return res.status(200).json({
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

    return res.status(500).json({
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

    if (
      seller.sellerStatus === "approved"
    ) {
      return res.status(400).json({
        success: false,
        message: "Approved sellers cannot be rejected through this action",
      });
    }

    if (seller.sellerStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be rejected",
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
        $set: {
          status: "rejected",
          rejectionReason: seller.sellerRejectionReason,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Seller application rejected",

      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        shopName: seller.shopName,
        role: seller.role,
        sellerStatus: seller.sellerStatus,
        sellerRejectionReason: seller.sellerRejectionReason,
      },
    });
  } catch (error) {
    console.error("Reject seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject seller",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  registerSeller,
  getMySellerStatus,
  getSellerApplications,
  approveSeller,
  rejectSeller,
};
