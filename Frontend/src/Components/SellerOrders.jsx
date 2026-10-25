// =========================================================
// PHASE 18 - SELLER ORDERS
// =========================================================

import {
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config";


const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const formatPrice = (value) => {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString("en-PK")}`;
};

const SellerOrders = ({
  refreshKey = 0,
}) => {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  // =======================================================
  // LOAD ORDERS
  // =======================================================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        getAuthToken();

      if (!token) {
        throw new Error(
          "Please login first."
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/orders`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load seller orders."
        );
      }

      setOrders(
        Array.isArray(
          data.orders
        )
          ? data.orders
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [refreshKey]);

  // =======================================================
  // UPDATE STATUS
  // =======================================================

  const updateStatus = async (
    orderId,
    status
  ) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setMessage("");

      const token =
        getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update order."
        );
      }

      setMessage(
        "Order status updated successfully."
      );

      await loadOrders();
    } catch (err) {
      setError(
        err.message ||
          "Failed to update order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="seller-orders-section">
      <div className="seller-orders-header">
        <div>
          <span className="section-label">
            Orders
          </span>

          <h2>
            Seller Orders
          </h2>

          <p>
            Manage orders containing
            your products.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadOrders
          }
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="seller-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="seller-error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="seller-orders-loading">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="seller-orders-empty">
          <h3>
            No Orders Yet
          </h3>

          <p>
            Orders containing
            your products will
            appear here.
          </p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {orders.map(
            (order) => (
              <div
                className="seller-order-card"
                key={
                  order._id
                }
              >
                <div className="seller-order-top">
                  <div>
                    <strong>
                      Order #
                      {String(
                        order._id
                      ).slice(
                        -8
                      )}
                    </strong>

                    <small>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleString()
                        : ""}
                    </small>
                  </div>

                  <span className="seller-order-status">
                    {order.status}
                  </span>
                </div>

                <div className="seller-order-customer">
                  <strong>
                    Customer
                  </strong>

                  <span>
                    {order.customer
                      ?.name ||
                      "Customer"}
                  </span>

                  <span>
                    {order.customer
                      ?.email ||
                      ""}
                  </span>

                  <span>
                    {order.customer
                      ?.phone ||
                      ""}
                  </span>
                </div>

                <div className="seller-order-items">
                  {(
                    order.items ||
                    []
                  ).map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="seller-order-item"
                        key={`${order._id}-${index}`}
                      >
                        <div>
                          <strong>
                            {item.product
                              ?.title ||
                              item.product
                                ?.name ||
                              "Product"}
                          </strong>

                          <span>
                            Qty:{" "}
                            {item.quantity ||
                              1}
                          </span>
                        </div>

                        <strong>
                          {formatPrice(
                            Number(
                              item.price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  1
                              )
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                <div className="seller-order-bottom">
                  <strong>
                    Total:{" "}
                    {formatPrice(
                      order.totalAmount
                    )}
                  </strong>

                  <span>
                    Payment:{" "}
                    {order.paymentStatus ||
                      "pending"}
                  </span>

                  <span>
                    Method:{" "}
                    {order.paymentMethod ||
                      "N/A"}
                  </span>
                </div>

                <div className="seller-order-actions">
                  <select
                    value={
                      order.status ||
                      "pending"
                    }
                    disabled={
                      updatingId ===
                      order._id
                    }
                    onChange={(
                      event
                    ) =>
                      updateStatus(
                        order._id,
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ===================================================
          ORDER DETAILS MODAL
      =================================================== */}

      {selectedOrder && (
        <div className="seller-order-modal">
          <div className="seller-order-modal-card">
            <div className="seller-order-modal-header">
              <h3>
                Order Details
              </h3>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                Close
              </button>
            </div>

            <p>
              <strong>
                Order:
              </strong>{" "}
              {selectedOrder._id}
            </p>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {selectedOrder.status}
            </p>

            <p>
              <strong>
                Payment:
              </strong>{" "}
              {
                selectedOrder.paymentStatus
              }
            </p>

            <h4>
              Customer
            </h4>

            <p>
              {
                selectedOrder
                  .customer
                  ?.name
              }
            </p>

            <p>
              {
                selectedOrder
                  .customer
                  ?.email
              }
            </p>

            <h4>
              Shipping Address
            </h4>

            <p>
              {selectedOrder
                .shippingAddress
                ?.fullName ||
                ""}
            </p>

            <p>
              {selectedOrder
                .shippingAddress
                ?.address ||
                ""}
            </p>

            <p>
              {selectedOrder
                .shippingAddress
                ?.city ||
                ""}{" "}
              {selectedOrder
                .shippingAddress
                ?.province ||
                ""}
            </p>

            <h4>
              Products
            </h4>

            {(
              selectedOrder.items ||
              []
            ).map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="seller-modal-item"
                >
                  <span>
                    {item.product
                      ?.title ||
                      item.product
                        ?.name ||
                      "Product"}
                    {" × "}
                    {item.quantity ||
                      1}
                  </span>

                  <strong>
                    {formatPrice(
                      Number(
                        item.price ||
                          0
                      ) *
                        Number(
                          item.quantity ||
                            1
                        )
                    )}
                  </strong>
                </div>
              )
            )}

            <h3>
              Total:{" "}
              {formatPrice(
                selectedOrder.totalAmount
              )}
            </h3>
          </div>
        </div>
      )}
    </section>
  );
};

export default SellerOrders;