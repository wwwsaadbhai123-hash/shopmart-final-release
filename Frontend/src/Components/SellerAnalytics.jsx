// =========================================================
// PHASE 20 - SELLER ANALYTICS
// =========================================================

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


const SellerAnalytics = ({ refreshKey = 0 }) => {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // =========================================================
  // FETCH ANALYTICS
  // =========================================================

  const fetchAnalytics = async () => {
    const token = getToken();

    if (!token) {
      setAnalytics(null);
      setLoading(false);
      setError("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/sellers/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load seller analytics"
        );
      }

      setAnalytics(data.analytics || null);
    } catch (err) {
      console.error(
        "SELLER ANALYTICS ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (value) => {
    return `Rs. ${Number(
      value || 0
    ).toLocaleString("en-PK")}`;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="seller-analytics-panel">
        <div className="seller-empty-state">
          Loading seller analytics...
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="seller-analytics-panel">
        <div className="seller-support-error">
          {error}
        </div>

        <button
          type="button"
          className="seller-primary-btn"
          onClick={fetchAnalytics}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="seller-analytics-panel">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="seller-analytics-header">
        <div>
          <span className="seller-section-kicker">
            Analytics
          </span>

          <h2>Seller Analytics & Reports</h2>

          <p>
            Track your store sales, orders,
            products and inventory.
          </p>
        </div>

        <button
          type="button"
          className="seller-refresh-btn"
          onClick={fetchAnalytics}
        >
          Refresh
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="seller-analytics-grid">

        <div className="seller-analytics-card">
          <span>💰</span>

          <div>
            <small>Total Sales</small>

            <strong>
              {formatPrice(
                analytics.totalSales
              )}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>📦</span>

          <div>
            <small>Total Orders</small>

            <strong>
              {analytics.totalOrders || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>🚚</span>

          <div>
            <small>Delivered Orders</small>

            <strong>
              {analytics.deliveredOrders || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>⏳</span>

          <div>
            <small>Pending Orders</small>

            <strong>
              {analytics.pendingOrders || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>❌</span>

          <div>
            <small>Cancelled Orders</small>

            <strong>
              {analytics.cancelledOrders || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>🛍️</span>

          <div>
            <small>Total Products</small>

            <strong>
              {analytics.totalProducts || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>📊</span>

          <div>
            <small>Items Sold</small>

            <strong>
              {analytics.totalItemsSold || 0}
            </strong>
          </div>
        </div>

        <div className="seller-analytics-card">
          <span>🧾</span>

          <div>
            <small>Average Order</small>

            <strong>
              {formatPrice(
                analytics.averageOrderValue
              )}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          SALES SUMMARY
      ===================================================== */}

      <div className="seller-report-grid">

        <div className="seller-report-card">
          <h3>Sales Summary</h3>

          <div className="seller-report-row">
            <span>Delivered Sales</span>

            <strong>
              {formatPrice(
                analytics.deliveredSales
              )}
            </strong>
          </div>

          <div className="seller-report-row">
            <span>Pending Sales</span>

            <strong>
              {formatPrice(
                analytics.pendingSales
              )}
            </strong>
          </div>

          <div className="seller-report-row">
            <span>Cancelled Sales</span>

            <strong>
              {formatPrice(
                analytics.cancelledSales
              )}
            </strong>
          </div>
        </div>

        {/* ===================================================
            INVENTORY
        =================================================== */}

        <div className="seller-report-card">
          <h3>Inventory Alert</h3>

          <div className="seller-report-highlight">
            <strong>
              {analytics.lowStockCount || 0}
            </strong>

            <span>
              products have low stock
            </span>
          </div>

          {analytics.lowStockProducts?.length >
          0 ? (
            <div className="seller-low-stock-list">
              {analytics.lowStockProducts.map(
                (product) => (
                  <div
                    key={product._id}
                    className="seller-report-row"
                  >
                    <span>
                      {product.name}
                    </span>

                    <strong>
                      {product.stock}
                    </strong>
                  </div>
                )
              )}
            </div>
          ) : (
            <p>
              No low-stock products.
            </p>
          )}
        </div>
      </div>

      {/* =====================================================
          TOP PRODUCTS
      ===================================================== */}

      <div className="seller-report-card">
        <h3>Top Selling Products</h3>

        {analytics.topProducts?.length >
        0 ? (
          <div className="seller-report-table-wrapper">
            <table className="seller-report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Sales</th>
                </tr>
              </thead>

              <tbody>
                {analytics.topProducts.map(
                  (product, index) => (
                    <tr key={product.productId}>
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {product.name}
                      </td>

                      <td>
                        {product.quantity}
                      </td>

                      <td>
                        {formatPrice(
                          product.sales
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            No sales data available yet.
          </p>
        )}
      </div>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <div className="seller-report-card">
        <h3>Recent Orders</h3>

        {analytics.recentOrders?.length >
        0 ? (
          <div className="seller-report-table-wrapper">
            <table className="seller-report-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {analytics.recentOrders.map(
                  (order) => (
                    <tr key={order._id}>
                      <td>
                        #{String(
                          order._id
                        ).slice(-6)}
                      </td>

                      <td>
                        {order.itemCount}
                      </td>

                      <td>
                        {formatPrice(
                          order.amount
                        )}
                      </td>

                      <td>
                        {order.status}
                      </td>

                      <td>
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            No recent orders.
          </p>
        )}
      </div>

    </div>
  );
};

export default SellerAnalytics;