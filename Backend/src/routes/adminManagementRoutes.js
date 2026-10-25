const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/adminManagementController");

const { protect } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

/* USERS */

router.get("/users", protect, adminOnly, getUsers);

router.patch(
  "/users/:id/status",
  protect,
  adminOnly,
  updateUserStatus
);

/* SELLERS */

router.get("/sellers", protect, adminOnly, getSellers);

router.patch(
  "/sellers/:id/status",
  protect,
  adminOnly,
  updateSellerApproval
);

/* PRODUCTS */

router.get("/products", protect, adminOnly, getProducts);

router.patch(
  "/products/:id/status",
  protect,
  adminOnly,
  updateProductStatus
);

/* ORDERS */

router.get("/orders", protect, adminOnly, getOrders);

router.patch(
  "/orders/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

/* RETURNS */

router.get("/returns", protect, adminOnly, getReturns);

/* SUPPORT */

router.get(
  "/support-tickets",
  protect,
  adminOnly,
  getSupportTickets
);

router.patch(
  "/support-tickets/:id/status",
  protect,
  adminOnly,
  updateSupportTicketStatus
);

module.exports = router;