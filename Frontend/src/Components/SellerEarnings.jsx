// =========================================================
// PHASE 21 - SELLER EARNINGS + PAYOUT
// =========================================================

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


const SellerEarnings = ({
  refreshKey = 0,
}) => {
  const [earnings, setEarnings] =
    useState(null);

  const [payouts, setPayouts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "bank",
    accountName: "",
    accountNumber: "",
  });

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem(
        "accessToken"
      ) ||
      ""
    );
  };

  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (value) => {
    return `Rs. ${Number(
      value || 0
    ).toLocaleString("en-PK")}`;
  };

  // =========================================================
  // FETCH EARNINGS
  // =========================================================

  const fetchEarnings = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      setError("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/sellers/earnings`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to load earnings."
        );
      }

      setEarnings(
        data.earnings
      );

      await fetchPayouts();
    } catch (err) {
      setError(
        err.message ||
          "Unable to load earnings."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH PAYOUTS
  // =========================================================

  const fetchPayouts = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/earnings/payouts`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setPayouts(
          data.payouts || []
        );
      }
    } catch (err) {
      console.error(
        "PAYOUT FETCH ERROR:",
        err
      );
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [refreshKey]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // PAYOUT REQUEST
  // =========================================================

  const handlePayout = async (
    event
  ) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError(
        "Please login first."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Enter a valid amount."
      );
      return;
    }

    if (
      !form.accountName.trim() ||
      !form.accountNumber.trim()
    ) {
      setError(
        "Payment account details are required."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/earnings/payout`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              amount:
                Number(form.amount),

              paymentMethod:
                form.paymentMethod,

              accountName:
                form.accountName,

              accountNumber:
                form.accountNumber,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to submit payout."
        );
      }

      setMessage(
        "Payout request submitted successfully."
      );

      setForm({
        amount: "",
        paymentMethod: "bank",
        accountName: "",
        accountNumber: "",
      });

      await fetchEarnings();
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit payout."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="seller-earnings-panel">
        Loading earnings...
      </div>
    );
  }

  return (
    <div className="seller-earnings-panel">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="seller-earnings-header">
        <div>
          <span className="seller-section-kicker">
            Earnings
          </span>

          <h2>
            Earnings & Payouts
          </h2>

          <p>
            Track your earnings and
            request payouts.
          </p>
        </div>

        <button
          type="button"
          className="seller-refresh-btn"
          onClick={fetchEarnings}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="seller-support-error">
          {error}
        </div>
      )}

      {message && (
        <div className="seller-support-success">
          {message}
        </div>
      )}

      {/* =====================================================
          EARNING CARDS
      ===================================================== */}

      {earnings && (
        <div className="seller-earnings-grid">

          <div className="seller-earning-card">
            <span>
              Gross Earnings
            </span>

            <strong>
              {formatPrice(
                earnings.grossEarnings
              )}
            </strong>
          </div>

          <div className="seller-earning-card">
            <span>
              Pending Earnings
            </span>

            <strong>
              {formatPrice(
                earnings.pendingEarnings
              )}
            </strong>
          </div>

          <div className="seller-earning-card">
            <span>
              Paid
            </span>

            <strong>
              {formatPrice(
                earnings.totalPaid
              )}
            </strong>
          </div>

          <div className="seller-earning-card">
            <span>
              Available Balance
            </span>

            <strong>
              {formatPrice(
                earnings.availableBalance
              )}
            </strong>
          </div>

        </div>
      )}

      {/* =====================================================
          PAYOUT REQUEST
      ===================================================== */}

      <div className="seller-payout-grid">

        <div className="seller-report-card">
          <h3>
            Request Payout
          </h3>

          <form
            onSubmit={handlePayout}
          >
            <div className="seller-form-group">
              <label>
                Amount
              </label>

              <input
                type="number"
                name="amount"
                min="1"
                step="1"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter amount"
              />
            </div>

            <div className="seller-form-group">
              <label>
                Payment Method
              </label>

              <select
                name="paymentMethod"
                value={
                  form.paymentMethod
                }
                onChange={
                  handleChange
                }
              >
                <option value="bank">
                  Bank Account
                </option>

                <option value="easypaisa">
                  Easypaisa
                </option>

                <option value="jazzcash">
                  JazzCash
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div className="seller-form-group">
              <label>
                Account Name
              </label>

              <input
                type="text"
                name="accountName"
                value={
                  form.accountName
                }
                onChange={
                  handleChange
                }
                placeholder="Account holder name"
              />
            </div>

            <div className="seller-form-group">
              <label>
                Account Number
              </label>

              <input
                type="text"
                name="accountNumber"
                value={
                  form.accountNumber
                }
                onChange={
                  handleChange
                }
                placeholder="Account / wallet number"
              />
            </div>

            <button
              type="submit"
              className="seller-primary-btn"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Request Payout"}
            </button>
          </form>
        </div>

        {/* ===================================================
            PAYOUT HISTORY
        =================================================== */}

        <div className="seller-report-card">
          <h3>
            Payout History
          </h3>

          {payouts.length === 0 ? (
            <p>
              No payout requests yet.
            </p>
          ) : (
            <div className="seller-report-table-wrapper">
              <table className="seller-report-table">
                <thead>
                  <tr>
                    <th>
                      Amount
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payouts.map(
                    (payout) => (
                      <tr
                        key={
                          payout._id
                        }
                      >
                        <td>
                          {formatPrice(
                            payout.amount
                          )}
                        </td>

                        <td>
                          {
                            payout.paymentMethod
                          }
                        </td>

                        <td>
                          {
                            payout.status
                          }
                        </td>

                        <td>
                          {payout.createdAt
                            ? new Date(
                                payout.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SellerEarnings;