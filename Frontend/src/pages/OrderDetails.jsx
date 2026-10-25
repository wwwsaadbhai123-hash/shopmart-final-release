import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getOrderById,
  cancelOrder,
} from "../services/orderService";

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const data = await getOrderById(id);

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || "Order not found");
      }
    } catch (err) {
      setError("Unable to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const data = await cancelOrder(id);

      if (data.success) {
        setOrder(data.order);
        alert("Order cancelled successfully");
      } else {
        alert(data.message || "Unable to cancel order");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const currentIndex = statuses.indexOf(order?.status);

  const isCancelled = order?.status === "cancelled";

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="orders-loading">
            Loading order details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="orders-error">
            {error || "Order not found"}
          </div>

          <Link to="/orders">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="order-details-container">

        <Link to="/orders" className="back-orders">
          ← Back to My Orders
        </Link>

        <div className="order-details-header">

          <div>
            <p className="orders-label">SHOPMART ORDER</p>

            <h1>
              #{order._id.slice(-8).toUpperCase()}
            </h1>

            <p>
              Placed on{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <span className={`order-status ${order.status}`}>
            {order.status}
          </span>

        </div>

        {/* TRACKING */}
        <div className="tracking-card">

          <h2>Order Tracking</h2>

          {isCancelled ? (
            <div className="cancelled-message">
              <span>✕</span>
              <div>
                <strong>Order Cancelled</strong>
                <p>
                  This order has been cancelled.
                </p>
              </div>
            </div>
          ) : (
            <div className="tracking-timeline">

              {statuses.map((status, index) => {
                const completed = index <= currentIndex;

                return (
                  <div
                    className={`tracking-step ${
                      completed ? "completed" : ""
                    }`}
                    key={status}
                  >
                    <div className="tracking-dot">
                      {completed ? "✓" : index + 1}
                    </div>

                    <div className="tracking-info">
                      <strong>
                        {status.charAt(0).toUpperCase() +
                          status.slice(1)}
                      </strong>

                      <span>
                        {index === 0 && "Order received"}
                        {index === 1 && "Order confirmed"}
                        {index === 2 && "Order is being prepared"}
                        {index === 3 && "Order is on the way"}
                        {index === 4 && "Order delivered"}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* PRODUCTS */}
        <div className="order-info-grid">

          <div className="order-items-card">

            <h2>Order Items</h2>

            {order.items?.map((item) => (
              <div className="order-detail-item" key={item._id}>

                <div className="order-detail-image">
                  {item.product?.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                    />
                  ) : (
                    <span>🛍️</span>
                  )}
                </div>

                <div className="order-detail-product">
                  <h3>
                    {item.product?.name || "Product"}
                  </h3>

                  <p>
                    Quantity: {item.quantity}
                  </p>
                </div>

                <strong>
                  Rs.{" "}
                  {(
                    item.price * item.quantity
                  ).toLocaleString()}
                </strong>

              </div>
            ))}

            <div className="order-summary-total">
              <span>Total Amount</span>

              <strong>
                Rs.{" "}
                {Number(order.totalAmount).toLocaleString()}
              </strong>
            </div>

          </div>

          {/* SHIPPING */}
          <div className="shipping-card">

            <h2>Shipping Address</h2>

            <div className="shipping-content">

              <strong>
                {order.shippingAddress?.fullName}
              </strong>

              <p>
                {order.shippingAddress?.address}
              </p>

              <p>
                {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.province}
              </p>

              <p>
                {order.shippingAddress?.postalCode}
              </p>

              <p>
                {order.shippingAddress?.countryCode}{" "}
                {order.shippingAddress?.phone}
              </p>

            </div>

            <div className="payment-info">

              <span>Payment Method</span>

              <strong>
                {order.paymentMethod?.toUpperCase()}
              </strong>

            </div>

            <div className="payment-info">

              <span>Payment Status</span>

              <strong>
                {order.paymentStatus}
              </strong>

            </div>

            {[
              "pending",
              "confirmed",
              "processing",
            ].includes(order.status) && (
              <button
                className="cancel-order-button"
                onClick={handleCancel}
              >
                Cancel Order
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;