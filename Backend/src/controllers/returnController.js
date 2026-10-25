/* =========================================================
   SHOPMART - PHASE 13
   RETURN / REFUND CONTROLLER
========================================================= */

const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

/* =========================================================
   CREATE RETURN REQUEST
========================================================= */

const createReturnRequest = async (req, res) => {
  try {
    const {
      orderId,
      reason,
      description,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Return reason is required.",
      });
    }

    /* =========================
       FIND ORDER
    ========================= */

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    /* =========================
       ORDER STATUS CHECK
    ========================= */

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message:
          "Return request can only be submitted for a delivered order.",
      });
    }

    /* =========================
       EXISTING REQUEST CHECK
    ========================= */

    const existingRequest =
      await ReturnRequest.findOne({
        user: req.user.id,
        order: order._id,
        status: {
          $in: [
            "pending",
            "approved",
            "refunded",
          ],
        },
      });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "A return/refund request already exists for this order.",
        returnRequest: existingRequest,
      });
    }

    /* =========================
       REFUND AMOUNT
    ========================= */

    const refundAmount = Number(
      order.totalAmount || 0
    );

    /* =========================
       CREATE REQUEST
    ========================= */

    const returnRequest =
      await ReturnRequest.create({
        user: req.user.id,
        order: order._id,
        reason,
        description:
          description?.trim() || "",
        refundAmount,
        status: "pending",
      });

    /* =========================
       CUSTOMER NOTIFICATION
    ========================= */

    try {
      await Notification.create({
        user: req.user.id,
        type: "system",
        title: "Return Request Submitted",
        message:
          "Your return/refund request has been submitted successfully.",
        order: order._id,
        isRead: false,
      });
    } catch (notificationError) {
      console.error(
        "Return notification error:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      message:
        "Return/refund request submitted successfully.",
      returnRequest,
    });
  } catch (error) {
    console.error(
      "Create return request error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create return/refund request.",
    });
  }
};

/* =========================================================
   GET MY RETURN REQUESTS
========================================================= */

const getMyReturnRequests = async (
  req,
  res
) => {
  try {
    const requests =
      await ReturnRequest.find({
        user: req.user.id,
      })
        .populate(
          "order",
          "_id status totalAmount paymentStatus createdAt"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: requests.length,
      returnRequests: requests,
    });
  } catch (error) {
    console.error(
      "Get return requests error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch return/refund requests.",
    });
  }
};

/* =========================================================
   GET SINGLE RETURN REQUEST
========================================================= */

const getReturnRequestById = async (
  req,
  res
) => {
  try {
    const request =
      await ReturnRequest.findOne({
        _id: req.params.id,
        user: req.user.id,
      }).populate(
        "order",
        "_id status totalAmount paymentStatus createdAt"
      );

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Return/refund request not found.",
      });
    }

    res.status(200).json({
      success: true,
      returnRequest: request,
    });
  } catch (error) {
    console.error(
      "Get return request error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch return/refund request.",
    });
  }
};

/* =========================================================
   CANCEL RETURN REQUEST
========================================================= */

const cancelReturnRequest = async (
  req,
  res
) => {
  try {
    const request =
      await ReturnRequest.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Return/refund request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending return requests can be cancelled.",
      });
    }

    request.status = "cancelled";
    request.processedAt = new Date();

    await request.save();

    res.status(200).json({
      success: true,
      message:
        "Return/refund request cancelled successfully.",
      returnRequest: request,
    });
  } catch (error) {
    console.error(
      "Cancel return request error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to cancel return/refund request.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelReturnRequest,
};