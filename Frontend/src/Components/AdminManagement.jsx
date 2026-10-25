
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AdminManagement({
  refreshKey = 0,
  activeTab: controlledTab,
  hideTabs = false,
}) {
  const [internalTab, setActiveTab] = useState("users");
  const activeTab = controlledTab || internalTab;

  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loadUsers = async () => {
    const data = await apiRequest("/api/admin/management/users");
    setUsers(data.users || []);
  };

  const loadSellers = async () => {
    const data = await apiRequest("/api/admin/management/sellers");
    setSellers(data.sellers || []);
  };

  const loadProducts = async () => {
    const data = await apiRequest("/api/admin/management/products");
    setProducts(data.products || []);
  };

  const loadOrders = async () => {
    const data = await apiRequest("/api/admin/management/orders");
    setOrders(data.orders || []);
  };

  const loadReturns = async () => {
    const data = await apiRequest("/api/admin/management/returns");
    setReturns(data.returns || []);
  };

  const loadTickets = async () => {
    const data = await apiRequest(
      "/api/admin/management/support-tickets"
    );
    setTickets(data.tickets || []);
  };

  const loadCurrentTab = async () => {
    try {
      setLoading(true);
      setError("");

      if (!getToken()) {
        throw new Error("Please login as admin.");
      }

      if (activeTab === "users") await loadUsers();
      if (activeTab === "sellers") await loadSellers();
      if (activeTab === "products") await loadProducts();
      if (activeTab === "orders") await loadOrders();
      if (activeTab === "returns") await loadReturns();
      if (activeTab === "support") await loadTickets();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab, refreshKey]);

  // Activate or block a customer account.
  const updateUser = async (id, isActive) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/users/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        }
      );

      setMessage(
        isActive
          ? "User unblocked successfully."
          : "User blocked successfully."
      );

      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Change seller approval without changing account access.
  const updateSeller = async (id, status) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/sellers/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setMessage(`Seller ${status} successfully.`);
      await loadSellers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Block or unblock a seller independently of approval status.
  const updateSellerAccount = async (id, isActive) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/users/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        }
      );

      setMessage(
        isActive
          ? "Seller unblocked successfully."
          : "Seller blocked successfully."
      );

      await loadSellers();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateProduct = async (id, isActive) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/products/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        }
      );

      setMessage(
        isActive
          ? "Product activated."
          : "Product deactivated."
      );

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrder = async (id, status) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/orders/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setMessage("Order status updated.");
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTicket = async (id, status) => {
    try {
      setMessage("");
      setError("");

      await apiRequest(
        `/api/admin/management/support-tickets/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setMessage("Support ticket updated.");
      await loadTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-management">
      {/* HEADER */}
      <div className="admin-management-header">
        <div>
          <span className="admin-dashboard-label">
            Management
          </span>

          <h2>Admin Management</h2>

          <p>
            Manage ShopMart users, sellers, products,
            orders and support.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadCurrentTab}
        >
          Refresh
        </button>
      </div>

      {/* MESSAGES */}
      {message && (
        <div className="admin-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      {/* TABS */}
      {!hideTabs && (
        <div className="admin-management-tabs">
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>

          <button
            className={activeTab === "sellers" ? "active" : ""}
            onClick={() => setActiveTab("sellers")}
          >
            Sellers
          </button>

          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>

          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>

          <button
            className={activeTab === "returns" ? "active" : ""}
            onClick={() => setActiveTab("returns")}
          >
            Returns
          </button>

          <button
            className={activeTab === "support" ? "active" : ""}
            onClick={() => setActiveTab("support")}
          >
            Support
          </button>
        </div>
      )}

      {loading && (
        <div className="admin-empty">Loading...</div>
      )}

      {/* USERS */}
      {!loading && activeTab === "users" && (
        <div className="admin-management-table">
          <h3>All Users</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.phone || "-"}</td>
                    <td>{user.role || "-"}</td>

                    <td>
                      {user.isActive ? "Active" : "Blocked"}
                    </td>

                    <td>{formatDate(user.createdAt)}</td>

                    <td>
                      {user.role === "admin" ? (
                        <span>Admin</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateUser(user._id, !user.isActive)
                          }
                        >
                          {user.isActive ? "Block User" : "Unblock User"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SELLERS */}
      {!loading && activeTab === "sellers" && (
        <div className="admin-management-table">
          <h3>Seller Management</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Approval Status</th>
                  <th>Account</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td>{seller.name || "-"}</td>
                    <td>{seller.email || "-"}</td>

                    <td>{seller.sellerStatus || "pending"}</td>

                    <td>
                      {seller.isActive ? "Active" : "Blocked"}
                    </td>

                    <td>
                      <div className="admin-action-group">
                        <button
                          type="button"
                          onClick={() =>
                            updateSeller(seller._id, "approved")
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSeller(seller._id, "rejected")
                          }
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSeller(seller._id, "pending")
                          }
                        >
                          Pending
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSellerAccount(
                              seller._id,
                              !seller.isActive
                            )
                          }
                        >
                          {seller.isActive
                            ? "Block Seller"
                            : "Unblock Seller"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {!loading && activeTab === "products" && (
        <div className="admin-management-table">
          <h3>Product Management</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name || "-"}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.stock ?? 0}</td>

                    <td>
                      {product.seller?.name ||
                        product.seller?.email ||
                        "-"}
                    </td>

                    <td>
                      {product.isActive ? "Active" : "Inactive"}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          updateProduct(
                            product._id,
                            !product.isActive
                          )
                        }
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {!loading && activeTab === "orders" && (
        <div className="admin-management-table">
          <h3>Order Management</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{String(order._id).slice(-8)}</td>

                    <td>
                      {order.user?.name ||
                        order.user?.email ||
                        "-"}
                    </td>

                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>{order.status || "-"}</td>
                    <td>{order.paymentStatus || "-"}</td>

                    <td>
                      <select
                        value={order.status || "pending"}
                        onChange={(event) =>
                          updateOrder(order._id, event.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETURNS */}
      {!loading && activeTab === "returns" && (
        <div className="admin-management-table">
          <h3>Returns / Refund Requests</h3>

          {returns.length === 0 ? (
            <div className="admin-empty">
              No return requests found.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Seller</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {returns.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.user?.name || item.user?.email || "-"}
                      </td>

                      <td>
                        {item.seller?.name ||
                          item.seller?.email ||
                          "-"}
                      </td>

                      <td>{item.reason || "-"}</td>
                      <td>{item.status || "-"}</td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUPPORT */}
      {!loading && activeTab === "support" && (
        <div className="admin-management-table">
          <h3>Support Tickets</h3>

          {tickets.length === 0 ? (
            <div className="admin-empty">
              No support tickets found.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>
                        {ticket.user?.name ||
                          ticket.user?.email ||
                          "-"}
                      </td>

                      <td>{ticket.subject || "-"}</td>
                      <td>{ticket.priority || "-"}</td>
                      <td>{ticket.status || "-"}</td>

                      <td>
                        <select
                          value={ticket.status || "open"}
                          onChange={(event) =>
                            updateTicket(
                              ticket._id,
                              event.target.value
                            )
                          }
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
