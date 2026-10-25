import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};

const formatPrice = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "delivered":
      return "status-success";

    case "cancelled":
      return "status-danger";

    case "pending":
      return "status-warning";

    case "processing":
      return "status-info";

    case "shipped":
      return "status-primary";

    default:
      return "";
  }
};

export default function AdminDashboard({ refreshKey = 0 }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login as admin first.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load admin dashboard"
        );
      }

      setDashboard(data.data);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="admin-refresh-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const users = dashboard.users || {};
  const products = dashboard.products || {};
  const orders = dashboard.orders || {};
  const revenue = dashboard.revenue || {};
  const pending = dashboard.pending || {};

  return (
    <div className="admin-dashboard">
      {/* ================= HEADER ================= */}

      <div className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-label">
            Overview
          </span>

          <h2>Admin Dashboard</h2>

          <p>
            Manage and monitor your ShopMart marketplace.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          className="admin-refresh-btn"
        >
          Refresh
        </button>
      </div>

      {/* ================= MAIN STATS ================= */}

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-icon">👥</span>

          <div>
            <p>Total Users</p>
            <h3>{users.total || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">🏪</span>

          <div>
            <p>Vendors</p>
            <h3>{users.vendors || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">📦</span>

          <div>
            <p>Products</p>
            <h3>{products.total || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">🛒</span>

          <div>
            <p>Total Orders</p>
            <h3>{orders.total || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">💰</span>

          <div>
            <p>Total Revenue</p>
            <h3>{formatPrice(revenue.total)}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">👤</span>

          <div>
            <p>Customers</p>
            <h3>{users.customers || 0}</h3>
          </div>
        </div>
      </div>

      {/* ================= PENDING ACTIONS ================= */}

      <div className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Pending Actions</h3>
            <p>Items that may need admin attention.</p>
          </div>
        </div>

        <div className="admin-pending-grid">
          <div className="admin-pending-card">
            <span>🏪</span>
            <div>
              <strong>
                {pending.sellerApprovals || 0}
              </strong>
              <p>Seller Approvals</p>
            </div>
          </div>

          <div className="admin-pending-card">
            <span>↩️</span>
            <div>
              <strong>
                {pending.returns || 0}
              </strong>
              <p>Returns / Refunds</p>
            </div>
          </div>

          <div className="admin-pending-card">
            <span>🎫</span>
            <div>
              <strong>
                {pending.supportTickets || 0}
              </strong>
              <p>Support Tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ORDER STATISTICS ================= */}

      <div className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Order Statistics</h3>
            <p>Current order status overview.</p>
          </div>
        </div>

        <div className="admin-order-stats">
          <div>
            <span>Pending</span>
            <strong>{orders.pending || 0}</strong>
          </div>

          <div>
            <span>Confirmed</span>
            <strong>{orders.confirmed || 0}</strong>
          </div>

          <div>
            <span>Processing</span>
            <strong>{orders.processing || 0}</strong>
          </div>

          <div>
            <span>Shipped</span>
            <strong>{orders.shipped || 0}</strong>
          </div>

          <div>
            <span>Delivered</span>
            <strong>{orders.delivered || 0}</strong>
          </div>

          <div>
            <span>Cancelled</span>
            <strong>{orders.cancelled || 0}</strong>
          </div>
        </div>
      </div>

      {/* ================= RECENT ORDERS ================= */}

      <div className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Recent Orders</h3>
            <p>Latest orders placed on ShopMart.</p>
          </div>
        </div>

        {dashboard.recentOrders?.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      #{String(order._id).slice(-8)}
                    </td>

                    <td>
                      {order.user?.name ||
                        order.user?.email ||
                        "Unknown"}
                    </td>

                    <td>
                      {formatPrice(order.totalAmount)}
                    </td>

                    <td>
                      <span
                        className={`admin-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "unknown"}
                      </span>
                    </td>

                    <td>
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            No orders found.
          </div>
        )}
      </div>

      {/* ================= RECENT USERS ================= */}

      <div className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Recent Users</h3>
            <p>Recently registered ShopMart users.</p>
          </div>
        </div>

        {dashboard.recentUsers?.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>
                {dashboard.recentUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || "-"}</td>

                    <td>{user.email || "-"}</td>

                    <td>{user.phone || "-"}</td>

                    <td>
                      <span className="admin-role">
                        {user.role || "customer"}
                      </span>
                    </td>

                    <td>
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}