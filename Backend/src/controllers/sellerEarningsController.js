// =========================================================
// PHASE 21 - SELLER EARNINGS CONTROLLER
// =========================================================

const Order = require("../models/Order");
const Product = require("../models/Product");
const SellerPayout = require("../models/SellerPayout");
const Seller = require("../models/Seller");

// =========================================================
// GET SELLER EARNINGS
// =========================================================

exports.getSellerEarnings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const sellerDoc = await Seller.findOne({ user: userId });

    if (!sellerDoc) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const sellerId = sellerDoc._id;

    const products = await Product.find({
      seller: sellerId,
    }).lean();

    const productIds = products.map(
      (product) => product._id.toString()
    );

    const orders = await Order.find({
      "items.product": {
        $in: productIds,
      },
    }).lean();

    let grossEarnings = 0;
    let pendingEarnings = 0;
    let cancelledAmount = 0;

    orders.forEach((order) => {
      const status = String(
        order.status || "pending"
      ).toLowerCase();

      const sellerItems = (order.items || []).filter(
        (item) => {
          const productId =
            item.product?._id?.toString() ||
            item.product?.toString();

          return productIds.includes(productId);
        }
      );

      const sellerOrderAmount =
        sellerItems.reduce(
          (sum, item) =>
            sum +
            Number(item.price || 0) *
              Number(item.quantity || 0),
          0
        );

      if (status === "delivered") {
        grossEarnings += sellerOrderAmount;
      } else if (
        status !== "cancelled" &&
        status !== "canceled"
      ) {
        pendingEarnings += sellerOrderAmount;
      } else {
        cancelledAmount += sellerOrderAmount;
      }
    });

    const paidPayouts = await SellerPayout.find({
      seller: userId,
      status: "paid",
    }).lean();

    const pendingPayouts = await SellerPayout.find({
      seller: userId,
      status: {
        $in: ["pending", "approved"],
      },
    }).lean();

    const totalPaid = paidPayouts.reduce(
      (sum, payout) =>
        sum + Number(payout.amount || 0),
      0
    );

    const requestedPayoutAmount =
      pendingPayouts.reduce(
        (sum, payout) =>
          sum + Number(payout.amount || 0),
        0
      );

    const availableBalance = Math.max(
      grossEarnings -
        totalPaid -
        requestedPayoutAmount,
      0
    );

    return res.json({
      success: true,

      earnings: {
        grossEarnings,
        pendingEarnings,
        cancelledAmount,
        totalPaid,
        requestedPayoutAmount,
        availableBalance,
      },
    });
  } catch (error) {
    console.error(
      "SELLER EARNINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load seller earnings",
    });
  }
};

// =========================================================
// CREATE PAYOUT REQUEST
// =========================================================

exports.createPayoutRequest = async (
  req,
  res
) => {
  try {
    const userId =
      req.user._id || req.user.id;

    const sellerDoc = await Seller.findOne({ user: userId });

    if (!sellerDoc) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const sellerId = sellerDoc._id;

    const {
      amount,
      paymentMethod,
      accountName,
      accountNumber,
    } = req.body;

    const payoutAmount = Number(amount);

    if (
      !payoutAmount ||
      payoutAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payout amount.",
      });
    }

    if (
      !paymentMethod ||
      !accountName ||
      !accountNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment details are required.",
      });
    }

    // -----------------------------------------------------
    // CALCULATE AVAILABLE BALANCE
    // -----------------------------------------------------

    const products = await Product.find({
      seller: sellerId,
    }).lean();

    const productIds = products.map(
      (product) => product._id.toString()
    );

    const orders = await Order.find({
      "items.product": {
        $in: productIds,
      },
    }).lean();

    let grossEarnings = 0;

    orders.forEach((order) => {
      if (
        String(order.status).toLowerCase() !==
        "delivered"
      ) {
        return;
      }

      const sellerItems = (
        order.items || []
      ).filter((item) => {
        const productId =
          item.product?._id?.toString() ||
          item.product?.toString();

        return productIds.includes(productId);
      });

      sellerItems.forEach((item) => {
        grossEarnings +=
          Number(item.price || 0) *
          Number(item.quantity || 0);
      });
    });

    const paidPayouts =
      await SellerPayout.find({
        seller: userId,
        status: "paid",
      }).lean();

    const requestedPayouts =
      await SellerPayout.find({
        seller: userId,
        status: {
          $in: ["pending", "approved"],
        },
      }).lean();

    const totalPaid =
      paidPayouts.reduce(
        (sum, payout) =>
          sum + Number(payout.amount || 0),
        0
      );

    const totalRequested =
      requestedPayouts.reduce(
        (sum, payout) =>
          sum + Number(payout.amount || 0),
        0
      );

    const availableBalance = Math.max(
      grossEarnings -
        totalPaid -
        totalRequested,
      0
    );

    if (
      payoutAmount >
      availableBalance
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Requested amount is greater than your available balance.",
      });
    }

    // -----------------------------------------------------
    // CREATE PAYOUT
    // -----------------------------------------------------

    const payout =
      await SellerPayout.create({
        seller: userId,
        amount: payoutAmount,
        paymentMethod,
        accountName,
        accountNumber,
        status: "pending",
      });

    return res.status(201).json({
      success: true,
      message:
        "Payout request submitted successfully.",
      payout,
    });
  } catch (error) {
    console.error(
      "CREATE PAYOUT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create payout request.",
    });
  }
};

// =========================================================
// GET SELLER PAYOUT HISTORY
// =========================================================

exports.getPayoutHistory = async (
  req,
  res
) => {
  try {
    const sellerId =
      req.user._id || req.user.id;

    const payouts =
      await SellerPayout.find({
        seller: sellerId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json({
      success: true,
      payouts,
    });
  } catch (error) {
    console.error(
      "PAYOUT HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load payout history.",
    });
  }
};