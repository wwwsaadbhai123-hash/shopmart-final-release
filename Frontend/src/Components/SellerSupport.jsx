// =========================================================
// PHASE 19 - SELLER SUPPORT
// =========================================================

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


const SellerSupport = ({ refreshKey = 0 }) => {
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "other",
    priority: "medium",
  });

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // =========================================================
  // FETCH TICKETS
  // =========================================================

  const fetchTickets = async () => {
    const token = getToken();

    if (!token) {
      setTickets([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/support-tickets/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load tickets");
      }

      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshKey]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE TICKET
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Please login first.");
      return;
    }

    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/support-tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create ticket");
      }

      setMessage("Support ticket created successfully.");

      setForm({
        subject: "",
        message: "",
        category: "other",
        priority: "medium",
      });

      fetchTickets();
    } catch (err) {
      setError(err.message || "Unable to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    return `seller-ticket-status status-${status || "open"}`;
  };

  return (
    <div className="seller-support-panel">
      <div className="seller-support-header">
        <div>
          <span className="seller-section-kicker">SELLER SUPPORT</span>

          <h2>Need Help?</h2>

          <p>
            Create a support ticket and contact the ShopMart admin team.
          </p>
        </div>
      </div>

      {message && (
        <div className="seller-support-success">
          {message}
        </div>
      )}

      {error && (
        <div className="seller-support-error">
          {error}
        </div>
      )}

      <div className="seller-support-grid">
        {/* CREATE TICKET */}

        <div className="seller-support-card">
          <h3>Create Support Ticket</h3>

          <form onSubmit={handleSubmit}>
            <div className="seller-form-group">
              <label>Subject</label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter your issue"
                maxLength={200}
              />
            </div>

            <div className="seller-form-row">
              <div className="seller-form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="product">Product</option>
                  <option value="return">Return</option>
                  <option value="account">Account</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="seller-form-group">
                <label>Priority</label>

                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="seller-form-group">
              <label>Message</label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your issue..."
                rows="6"
                maxLength={5000}
              />
            </div>

            <button
              type="submit"
              className="seller-primary-btn"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Ticket"}
            </button>
          </form>
        </div>

        {/* TICKET LIST */}

        <div className="seller-support-card">
          <div className="seller-support-card-header">
            <h3>My Tickets</h3>

            <button
              type="button"
              className="seller-refresh-btn"
              onClick={fetchTickets}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="seller-empty-state">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="seller-empty-state">
              No support tickets yet.
            </div>
          ) : (
            <div className="seller-ticket-list">
              {tickets.map((ticket) => (
                <div
                  className="seller-ticket-item"
                  key={ticket._id}
                >
                  <div className="seller-ticket-top">
                    <h4>{ticket.subject}</h4>

                    <span className={getStatusClass(ticket.status)}>
                      {ticket.status}
                    </span>
                  </div>

                  <p>{ticket.message}</p>

                  <div className="seller-ticket-meta">
                    <span>
                      Category: {ticket.category}
                    </span>

                    <span>
                      Priority: {ticket.priority}
                    </span>

                    <span>
                      Replies: {ticket.replies?.length || 0}
                    </span>
                  </div>

                  <small>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString()
                      : ""}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSupport;