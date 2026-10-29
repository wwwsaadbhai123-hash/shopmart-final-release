import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "delivered":
      return "status-success";
    case "cancelled":
      return "status-danger";
    case "pending":
      return "status-warning";
    case "processing":
    case "confirmed":
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);

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

  const exportOrders = () => {
    const rows = dashboard?.recentOrders || [];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      ["Order ID", "Customer", "Email", "Amount", "Status", "Date"]
        .map(escapeCSV)
        .join(","),
      ...rows.map((order) =>
        [
          order._id,
          order.user?.name || "Customer",
          order.user?.email || "",
          order.totalAmount,
          order.status,
          order.createdAt,
        ]
          .map(escapeCSV)
          .join(",")
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "shopmart-orders.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`admin-dashboard ${darkMode ? "admin-dashboard-dark" : ""}`}>
        <div className="admin-dashboard-header">
          <div>
            <h2>ShopMart Dashboard</h2>
            <p>Loading your marketplace data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`admin-dashboard ${darkMode ? "admin-dashboard-dark" : ""}`}>
        <div className="admin-dashboard-header">
          <div>
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="admin-refresh-btn"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const users = dashboard.users || {};
  const products = dashboard.products || {};
  const orders = dashboard.orders || {};
  const revenue = dashboard.revenue || {};
  const pending = dashboard.pending || {};

  const recentOrders = dashboard.recentOrders || [];
  const recentUsers = dashboard.recentUsers || [];

  const filteredOrders = recentOrders.filter((order) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      order._id,
      order.user?.name,
      order.user?.email,
      order.status,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );

    const matchesStatus =
      statusFilter === "all" ||
      String(order.status || "").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className={`admin-dashboard ${
        darkMode ? "admin-dashboard-dark" : ""
      }`}
    >
      <div className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-label">
            SHOPMART ADMIN
          </span>
          <h2>Store Overview</h2>
          <p>
            Monitor your marketplace, orders, revenue and customers.
          </p>
        </div>

        <div className="admin-dashboard-actions">
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? "Light mode" : "Dark mode"}
          </button>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={exportOrders}
          >
            Export orders
          </button>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={fetchDashboard}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-dashboard-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders, customers, email..."
          aria-label="Search orders"
        />

        <span className="admin-dashboard-live">
          ● Live dashboard data
        </span>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-icon">Rs</span>
          <div>
            <p>Total Revenue</p>
            <h3>{formatPrice(revenue.total)}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">#</span>
          <div>
            <p>Total Orders</p>
            <h3>{orders.total || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">U</span>
          <div>
            <p>Total Users</p>
            <h3>{users.total || 0}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon">P</span>
          <div>
            <p>Total Products</p>
            <h3>{products.total || 0}</h3>
          </div>
        </div>
      </div>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Needs Your Attention</h3>
            <p>Marketplace overview and outstanding items.</p>
          </div>
        </div>

        <div className="admin-pending-grid">
          <div className="admin-pending-card">
            <h3>{users.vendors || 0}</h3>
            <p>Vendors</p>
            <small>Seller accounts</small>
          </div>

          <div className="admin-pending-card">
            <h3>{pending.returns || 0}</h3>
            <p>Returns and Refunds</p>
            <small>Requests to review</small>
          </div>

          <div className="admin-pending-card">
            <h3>{pending.supportTickets || 0}</h3>
            <p>Support Tickets</p>
            <small>Customer assistance</small>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Order Status</h3>
            <p>Current order distribution.</p>
          </div>
        </div>

        <div className="admin-order-stats">
          <div className="admin-pending-card">
            <p>Pending</p>
            <h3>{orders.pending || 0}</h3>
          </div>
          <div className="admin-pending-card">
            <p>Processing</p>
            <h3>{orders.processing || 0}</h3>
          </div>
          <div className="admin-pending-card">
            <p>Shipped</p>
            <h3>{orders.shipped || 0}</h3>
          </div>
          <div className="admin-pending-card">
            <p>Delivered</p>
            <h3>{orders.delivered || 0}</h3>
          </div>
          <div className="admin-pending-card">
            <p>Cancelled</p>
            <h3>{orders.cancelled || 0}</h3>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Recent Orders</h3>
            <p>Search and filter your latest transactions.</p>
          </div>
          <strong>{filteredOrders.length} orders</strong>
        </div>

        <div className="admin-dashboard-filters">
          {[
            "all",
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((status) => (
            <button
              type="button"
              key={status}
              className={
                statusFilter === status ? "active" : ""
              }
              onClick={() => setStatusFilter(status)}
            >
              {status === "all"
                ? "All orders"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      #{String(order._id || "").slice(-8).toUpperCase()}
                    </td>

                    <td>
                      <strong>
                        {order.user?.name || "Customer"}
                      </strong>
                      <br />
                      <small>
                        {order.user?.email || "-"}
                      </small>
                    </td>

                    <td>{formatPrice(order.totalAmount)}</td>

                    <td>
                      <span
                        className={`admin-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "Unknown"}
                      </span>
                    </td>

                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            No orders match your search or filter.
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Recently Registered Users</h3>
            <p>Latest members in your marketplace.</p>
          </div>
        </div>

        {recentUsers.length > 0 ? (
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
                {recentUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || "Unnamed user"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <span className="admin-role">
                        {user.role || "customer"}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
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
      </section>
    </div>
  );
}