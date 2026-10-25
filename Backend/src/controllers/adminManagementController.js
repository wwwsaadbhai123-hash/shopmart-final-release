const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Seller = require("../models/Seller");
const ReturnRequest = require("../models/ReturnRequest");

let SupportTicket = null;

try {
  SupportTicket = require("../models/SupportTicket");
} catch (error) {
  SupportTicket = null;
}

/* =========================================================
   USERS
========================================================= */

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -otp")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: error.message,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin account cannot be disabled here",
      });
    }

    user.isActive = Boolean(isActive);

    await user.save();

    res.json({
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

/* =========================================================
   SELLERS / VENDORS
========================================================= */

const getSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: { $in: ["vendor", "seller"] },
    })
      .select("-password -otp")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      sellers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load sellers",
      error: error.message,
    });
  }
};

const updateSellerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller status",
      });
    }

    const seller = await User.findById(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    seller.sellerStatus = status;

    if (status === "approved") {
      seller.role = "vendor";
      seller.sellerApprovedAt = new Date();
      seller.sellerRejectionReason = "";
    } else if (status === "rejected") {
      seller.role = "customer";
      seller.sellerRejectionReason =
        req.body.reason?.trim() || "Application rejected by admin";
    }

    await seller.save();

    await Seller.findOneAndUpdate(
      { user: seller._id },
      {
        status,
        rejectionReason:
          status === "rejected" ? seller.sellerRejectionReason : "",
      }
    );

    res.json({
      success: true,
      message: `Seller ${status} successfully`,
      seller,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update seller status",
      error: error.message,
    });
  }
};

/* =========================================================
   PRODUCTS
========================================================= */

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: "seller",
        select: "shop_name status user",
        populate: { path: "user", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();

    products.forEach((product) => {
      if (product.seller) {
        const seller = product.seller;
        product.seller = {
          _id: seller._id,
          name: seller.user?.name || "",
          email: seller.user?.email || "",
          shop_name: seller.shop_name,
          status: seller.status,
        };
      }
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load products",
      error: error.message,
    });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = Boolean(isActive);

    await product.save();

    res.json({
      success: true,
      message: product.isActive
        ? "Product activated successfully"
        : "Product deactivated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product status",
      error: error.message,
    });
  }
};

/* =========================================================
   ORDERS
========================================================= */

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load orders",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`,
      });
    }

    order.status = status;

    // COD payment is collected on delivery.
    // Stripe payments must be confirmed by the payment verification flow.
    if (status === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

/* =========================================================
   RETURNS / REFUNDS
========================================================= */

const getReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find()
      .populate("user", "name email phone")
      .populate({
        path: "order",
        populate: {
          path: "items.product",
          select: "name seller",
          populate: {
            path: "seller",
            select: "shop_name status user",
            populate: { path: "user", select: "name email" },
          },
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    returns.forEach((returnRequest) => {
      const items = returnRequest.order?.items || [];

      const itemWithSeller = items.find(
        (item) => item.product && item.product.seller
      );

      const sellerDoc = itemWithSeller?.product?.seller;

      if (sellerDoc) {
        returnRequest.seller = {
          _id: sellerDoc._id,
          name: sellerDoc.user?.name || "",
          email: sellerDoc.user?.email || "",
          shop_name: sellerDoc.shop_name,
          status: sellerDoc.status,
        };
      } else {
        returnRequest.seller = null;
      }
    });

    res.json({
      success: true,
      returns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load returns",
      error: error.message,
    });
  }
};

/* =========================================================
   SUPPORT TICKETS
========================================================= */

const getSupportTickets = async (req, res) => {
  try {
    if (!SupportTicket) {
      return res.json({
        success: true,
        tickets: [],
        message: "Support ticket model is not available",
      });
    }

    const tickets = await SupportTicket.find()
      .populate("user", "name email phone")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load support tickets",
      error: error.message,
    });
  }
};

const updateSupportTicketStatus = async (req, res) => {
  try {
    if (!SupportTicket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket model is not available",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "pending",
      "resolved",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    ticket.status = status;

    await ticket.save();

    res.json({
      success: true,
      message: "Support ticket status updated",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update support ticket",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  updateUserStatus,

  getSellers,
  updateSellerApproval,

  getProducts,
  updateProductStatus,

  getOrders,
  updateOrderStatus,

  getReturns,

  getSupportTickets,
  updateSupportTicketStatus,
};

