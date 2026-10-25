const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ReturnRequest = require("../models/ReturnRequest");

let SupportTicket = null;

try {
  SupportTicket = require("../models/SupportTicket");
} catch (error) {
  SupportTicket = null;
}

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalVendors = await User.countDocuments({
      role: { $in: ["vendor", "seller"] },
    });

    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const totalProducts = await Product.countDocuments();

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      status: "pending",
    });

    const confirmedOrders = await Order.countDocuments({
      status: "confirmed",
    });

    const processingOrders = await Order.countDocuments({
      status: "processing",
    });

    const shippedOrders = await Order.countDocuments({
      status: "shipped",
    });

    const deliveredOrders = await Order.countDocuments({
      status: "delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      status: "cancelled",
    });

    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    let pendingSellerApprovals = 0;

    try {
      pendingSellerApprovals = await User.countDocuments({
        role: { $in: ["vendor", "seller"] },
        sellerStatus: "pending",
      });
    } catch (error) {
      pendingSellerApprovals = 0;
    }

    let pendingReturns = 0;

    try {
      pendingReturns = await ReturnRequest.countDocuments({
        status: "pending",
      });
    } catch (error) {
      pendingReturns = 0;
    }

    let pendingSupportTickets = 0;

    if (SupportTicket) {
      try {
        pendingSupportTickets = await SupportTicket.countDocuments({
          status: { $in: ["open", "pending"] },
        });
      } catch (error) {
        pendingSupportTickets = 0;
      }
    }

    const recentOrders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentUsers = await User.find()
      .select("name email phone role createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const orderStats = {
      pending: pendingOrders,
      confirmed: confirmedOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    };

    res.status(200).json({
      success: true,

      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          vendors: totalVendors,
          admins: totalAdmins,
        },

        products: {
          total: totalProducts,
        },

        orders: {
          total: totalOrders,
          ...orderStats,
        },

        revenue: {
          total: totalRevenue,
        },

        pending: {
          sellerApprovals: pendingSellerApprovals,
          returns: pendingReturns,
          supportTickets: pendingSupportTickets,
        },

        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};