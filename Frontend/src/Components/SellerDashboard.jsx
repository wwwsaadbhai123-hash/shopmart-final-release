// =========================================================
// PHASE 16 - SELLER DASHBOARD
// =========================================================

import { useEffect, useState } from "react";
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
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-PK")}`;
};

const SellerDashboard = ({
  refreshKey = 0,
}) => {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  // =======================================================
  // LOAD DASHBOARD
  // =======================================================

  const loadDashboard = async () => {
    const token = getAuthToken();

    if (!token) {
      setDashboard(null);
      setError(
        "Please login first to open seller dashboard."
      );
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/sellers/dashboard`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load seller dashboard."
        );
      }

      setDashboard(
        data.dashboard || null
      );
    } catch (err) {
      console.error(
        "Seller dashboard:",
        err
      );

      setError(
        err.message ||
          "Failed to load seller dashboard."
      );

      setDashboard(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =======================================================
  // EFFECT
  // =======================================================

  useEffect(() => {
    loadDashboard();
  }, [refreshKey]);

  // =======================================================
  // MANUAL REFRESH
  // =======================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <section className="seller-dashboard-section">
        <div className="container">
          <div className="card">
            <h2>
              Seller Dashboard
            </h2>

            <p>
              Loading dashboard...
            </p>
          </div>
        </div>
      </section>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <section className="seller-dashboard-section">
        <div className="container">
          <div className="card">
            <h2>
              Seller Dashboard
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const shop =
    dashboard.shop || {};

  const recentOrders =
    dashboard.recentOrders || [];

  const lowStockItems =
    dashboard.lowStockItems || [];

  // =======================================================
  // DASHBOARD
  // =======================================================

  return (
    <section
      id="seller-dashboard"
      className="seller-dashboard-section section"
    >
      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="seller-dashboard-header">

          <div>
            <span className="section-label">
              Overview
            </span>

            <h2>
              Seller Dashboard
            </h2>

            <p>
              Welcome to{" "}
              <strong>
                {shop.shopName ||
                  "My Shop"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Dashboard"}
          </button>

        </div>

        {/* =================================================
            SHOP INFORMATION
        ================================================= */}

        <div className="card seller-shop-card">

          <div>
            <span className="section-label">
              Shop
            </span>

            <h3>
              {shop.shopName ||
                "My Shop"}
            </h3>

            <p>
              Seller:{" "}
              {shop.user?.name ||
                "Seller"}
            </p>

            <p>
              Email:{" "}
              {shop.user?.email ||
                "-"}
            </p>

            <p>
              Phone:{" "}
              {shop.user?.phone ||
                "-"}
            </p>
          </div>

          <div>
            <strong>
              Status
            </strong>

            <p>
              {shop.status ||
                "approved"}
            </p>
          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="seller-stats-grid">

          <div className="card seller-stat-card">
            <span>
              📦
            </span>

            <p>
              Total Products
            </p>

            <strong>
              {dashboard.totalProducts ||
                0}
            </strong>
          </div>

          <div className="card seller-stat-card">
            <span>
              🛒
            </span>

            <p>
              Total Orders
            </p>

            <strong>
              {dashboard.totalOrders ||
                0}
            </strong>
          </div>

          <div className="card seller-stat-card">
            <span>
              💰
            </span>

            <p>
              Total Sales
            </p>

            <strong>
              {formatPrice(
                dashboard.totalSales
              )}
            </strong>
          </div>

          <div className="card seller-stat-card">
            <span>
              ⏳
            </span>

            <p>
              Pending Orders
            </p>

            <strong>
              {dashboard.pendingOrders ||
                0}
            </strong>
          </div>

          <div className="card seller-stat-card">
            <span>
              ⚠️
            </span>

            <p>
              Low Stock
            </p>

            <strong>
              {dashboard.lowStockProducts ||
                0}
            </strong>
          </div>

          <div className="card seller-stat-card">
            <span>
              ❌
            </span>

            <p>
              Out of Stock
            </p>

            <strong>
              {dashboard.outOfStockProducts ||
                0}
            </strong>
          </div>

        </div>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <div className="card seller-dashboard-card">

          <div className="seller-card-heading">

            <div>
              <span className="section-label">
                Orders
              </span>

              <h3>
                Recent Orders
              </h3>
            </div>

            <span>
              {recentOrders.length} orders
            </span>

          </div>

          {recentOrders.length === 0 ? (
            <p>
              No seller orders yet.
            </p>
          ) : (
            <div className="seller-orders-list">

              {recentOrders.map(
                (order) => (
                  <div
                    className="seller-order-row"
                    key={order._id}
                  >

                    <div>
                      <strong>
                        Order #
                        {String(
                          order._id
                        ).slice(-8)}
                      </strong>

                      <p>
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <span>
                        Customer
                      </span>

                      <strong>
                        {order.customer
                          ?.name ||
                          "Customer"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {order.status ||
                          "pending"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Payment
                      </span>

                      <strong>
                        {order.paymentStatus ||
                          "pending"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total
                      </span>

                      <strong>
                        {formatPrice(
                          order.totalAmount
                        )}
                      </strong>
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* =================================================
            LOW STOCK
        ================================================= */}

        <div className="card seller-dashboard-card">

          <div className="seller-card-heading">

            <div>
              <span className="section-label">
                Inventory
              </span>

              <h3>
                Low Stock Products
              </h3>
            </div>

            <span>
              {lowStockItems.length}
            </span>

          </div>

          {lowStockItems.length === 0 ? (
            <p>
              No low-stock products.
            </p>
          ) : (
            <div className="seller-low-stock-list">

              {lowStockItems.map(
                (product) => (
                  <div
                    className="seller-low-stock-row"
                    key={product._id}
                  >

                    <div>
                      <strong>
                        {product.title}
                      </strong>

                      <p>
                        {formatPrice(
                          product.price
                        )}
                      </p>
                    </div>

                    <strong>
                      {product.stock} left
                    </strong>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>
    </section>
  );
};

export default SellerDashboard;