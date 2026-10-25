// =========================================================
// PHASE 18 - SELLER RETURNS
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

const SellerReturns = ({
  refreshKey = 0,
}) => {
  const [returns, setReturns] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);

  const loadReturns = async () => {
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
          `${API_BASE_URL}/api/sellers/returns`,
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
            "Failed to load returns."
        );
      }

      setReturns(
        Array.isArray(
          data.returns
        )
          ? data.returns
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load returns."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [refreshKey]);

  const updateReturnStatus =
    async (
      returnId,
      status
    ) => {
      try {
        setUpdatingId(
          returnId
        );

        setError("");
        setMessage("");

        const token =
          getAuthToken();

        const response =
          await fetch(
            `${API_BASE_URL}/api/sellers/returns/${returnId}/status`,
            {
              method:
                "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify(
                {
                  status,
                }
              ),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update return."
          );
        }

        setMessage(
          "Return request updated successfully."
        );

        await loadReturns();
      } catch (err) {
        setError(
          err.message ||
            "Failed to update return."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  return (
    <section className="seller-returns-section">
      <div className="seller-returns-header">
        <div>
          <span className="section-label">
            Returns
          </span>

          <h2>
            Return Requests
          </h2>

          <p>
            Review customer return
            requests for your products.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadReturns
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
        <div>
          Loading return requests...
        </div>
      ) : returns.length === 0 ? (
        <div className="seller-returns-empty">
          <h3>
            No Return Requests
          </h3>

          <p>
            Customer return requests
            will appear here.
          </p>
        </div>
      ) : (
        <div className="seller-returns-list">
          {returns.map(
            (item) => (
              <div
                className="seller-return-card"
                key={
                  item._id
                }
              >
                <div className="seller-return-header">
                  <strong>
                    Return #
                    {String(
                      item._id
                    ).slice(
                      -8
                    )}
                  </strong>

                  <span>
                    {item.status ||
                      "pending"}
                  </span>
                </div>

                <div>
                  <strong>
                    Product:
                  </strong>{" "}
                  {item.product
                    ?.title ||
                    item.product
                      ?.name ||
                    "Product"}
                </div>

                <div>
                  <strong>
                    Customer:
                  </strong>{" "}
                  {item.user
                    ?.name ||
                    "Customer"}
                </div>

                <div>
                  <strong>
                    Reason:
                  </strong>{" "}
                  {item.reason ||
                    item.returnReason ||
                    item.description ||
                    "No reason provided"}
                </div>

                <div className="seller-return-actions">
                  <button
                    type="button"
                    disabled={
                      updatingId ===
                      item._id
                    }
                    onClick={() =>
                      updateReturnStatus(
                        item._id,
                        "approved"
                      )
                    }
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingId ===
                      item._id
                    }
                    onClick={() =>
                      updateReturnStatus(
                        item._id,
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>

                  <select
                    value={
                      item.status ||
                      "pending"
                    }
                    disabled={
                      updatingId ===
                      item._id
                    }
                    onChange={(
                      event
                    ) =>
                      updateReturnStatus(
                        item._id,
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="approved">
                      Approved
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="refunded">
                      Refunded
                    </option>
                  </select>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};

export default SellerReturns;