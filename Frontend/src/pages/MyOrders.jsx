import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../services/orderService";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const data = await getMyOrders();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Unable to load orders");
      }
    } catch (err) {
      setError("Something went wrong while loading orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    return `order-status ${status}`;
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-loading">Loading your orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">

        <div className="orders-header">
          <div>
            <p className="orders-label">SHOPMART</p>
            <h1>My Orders</h1>
            <p>Track and manage your ShopMart orders.</p>
          </div>

          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-orders-icon">📦</div>
            <h2>No orders yet</h2>
            <p>
              Your placed orders will appear here.
            </p>

            <Link to="/" className="shop-now-button">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">

            {orders.map((order) => (
              <div className="order-card" key={order._id}>

                <div className="order-card-top">

                  <div>
                    <span className="order-number">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>

                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className={getStatusClass(order.status)}>
                    {order.status}
                  </span>

                </div>

                <div className="order-card-middle">

                  <div className="order-products">
                    {order.items?.slice(0, 3).map((item) => (
                      <div
                        className="order-product-mini"
                        key={item._id}
                      >
                        <div className="order-product-image">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                            />
                          ) : (
                            <span>🛍️</span>
                          )}
                        </div>

                        <div>
                          <strong>
                            {item.product?.name || "Product"}
                          </strong>

                          <p>
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-total">
                    <span>Total</span>
                    <strong>
                      Rs. {Number(order.totalAmount).toLocaleString()}
                    </strong>
                  </div>

                </div>

                <div className="order-card-bottom">

                  <span>
                    Payment:{" "}
                    <strong>
                      {order.paymentMethod?.toUpperCase() || "COD"}
                    </strong>
                  </span>

                  <Link
                    to={`/orders/${order._id}`}
                    className="view-order-button"
                  >
                    View Details →
                  </Link>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrders;