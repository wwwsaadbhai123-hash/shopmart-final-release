/* =========================================================
   SHOPMART - PHASE 13
   RETURN / REFUND REQUEST COMPONENT
========================================================= */

import {
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config";


const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const reasonLabels = {
  wrong_item: "Wrong item received",
  damaged_item: "Item arrived damaged",
  defective_item: "Product is defective",
  not_as_described:
    "Product is not as described",
  missing_item: "Item is missing",
  changed_mind: "Changed my mind",
  other: "Other reason",
};

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

function ReturnRequest({
  order,
  onClose,
  onSubmitted,
}) {
  const [reason, setReason] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [existingRequest, setExistingRequest] =
    useState(null);

  const [checkingRequest, setCheckingRequest] =
    useState(true);

  /* =========================
     CHECK EXISTING REQUEST
  ========================= */

  useEffect(() => {
    let active = true;

    const checkRequest = async () => {
      const token = getToken();

      if (!token || !order?._id) {
        if (active) {
          setCheckingRequest(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/returns`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!active) return;

        if (response.ok && data.success) {
          const match =
            data.returnRequests?.find(
              (item) =>
                String(
                  item?.order?._id ||
                    item?.order
                ) ===
                String(order._id)
            );

          setExistingRequest(
            match || null
          );
        }
      } catch (requestError) {
        console.error(
          "RETURN REQUEST CHECK ERROR:",
          requestError
        );
      } finally {
        if (active) {
          setCheckingRequest(false);
        }
      }
    };

    checkRequest();

    return () => {
      active = false;
    };
  }, [order]);

  /* =========================
     SUBMIT REQUEST
  ========================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError(
        "Please login before submitting a return request."
      );

      return;
    }

    if (!reason) {
      setError(
        "Please select a return reason."
      );

      return;
    }

    if (!order?._id) {
      setError(
        "Order information is missing."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/returns`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order._id,
            reason,
            description:
              description.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit return request."
        );
      }

      setSuccess(
        "Return/refund request submitted successfully."
      );

      setExistingRequest(
        data.returnRequest
      );

      setReason("");
      setDescription("");

      if (onSubmitted) {
        onSubmitted(
          data.returnRequest
        );
      }
    } catch (submitError) {
      console.error(
        "RETURN REQUEST ERROR:",
        submitError
      );

      setError(
        submitError.message ||
          "Unable to submit return request."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (checkingRequest) {
    return (
      <div className="return-modal-overlay">
        <div className="return-modal">
          <div className="return-loading">
            Checking return eligibility...
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     EXISTING REQUEST
  ========================= */

  if (existingRequest) {
    return (
      <div className="return-modal-overlay">
        <div className="return-modal">
          <div className="return-modal-header">
            <div>
              <span className="section-label">
                Returns
              </span>

              <h2>
                Return / Refund
              </h2>
            </div>

            <button
              type="button"
              className="return-close-button"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="return-existing-card">
            <div className="return-status-icon">
              {existingRequest.status ===
              "refunded"
                ? "💰"
                : existingRequest.status ===
                    "approved"
                  ? "✅"
                  : existingRequest.status ===
                      "rejected"
                    ? "❌"
                    : "⏳"}
            </div>

            <h3>
              Return request already exists
            </h3>

            <p>
              Status:{" "}
              <strong>
                {statusLabels[
                  existingRequest.status
                ] ||
                  existingRequest.status}
              </strong>
            </p>

            <p>
              Reason:{" "}
              {reasonLabels[
                existingRequest.reason
              ] ||
                existingRequest.reason}
            </p>

            {existingRequest.refundAmount >
              0 && (
              <p>
                Refund amount:{" "}
                <strong>
                  Rs.{" "}
                  {Number(
                    existingRequest.refundAmount
                  ).toLocaleString(
                    "en-PK"
                  )}
                </strong>
              </p>
            )}

            {existingRequest.responseNote && (
              <div className="return-response-note">
                <strong>
                  Response:
                </strong>

                <p>
                  {
                    existingRequest.responseNote
                  }
                </p>
              </div>
            )}
          </div>

          <div className="return-modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     REQUEST FORM
  ========================= */

  return (
    <div className="return-modal-overlay">
      <div className="return-modal">
        <div className="return-modal-header">
          <div>
            <span className="section-label">
              Returns
            </span>

            <h2>
              Request Return / Refund
            </h2>

            <p>
              Order #
              {order?._id
                ?.slice(-8)
                .toUpperCase()}
            </p>
          </div>

          <button
            type="button"
            className="return-close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="return-alert return-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="return-alert return-alert-success">
            {success}
          </div>
        )}

        <form
          className="return-form"
          onSubmit={handleSubmit}
        >
          <div className="return-order-summary">
            <div>
              <span>
                Order total
              </span>

              <strong>
                Rs.{" "}
                {Number(
                  order?.totalAmount || 0
                ).toLocaleString(
                  "en-PK"
                )}
              </strong>
            </div>

            <div>
              <span>
                Order status
              </span>

              <strong>
                {order?.status ||
                  "Unknown"}
              </strong>
            </div>
          </div>

          <div className="return-field">
            <label htmlFor="return-reason">
              Why do you want to return
              this order?
            </label>

            <select
              id="return-reason"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              disabled={loading}
            >
              <option value="">
                Select a reason
              </option>

              {Object.entries(
                reasonLabels
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="return-field">
            <label htmlFor="return-description">
              Additional details
            </label>

            <textarea
              id="return-description"
              rows="5"
              maxLength="1000"
              placeholder="Please explain the issue with your order..."
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              disabled={loading}
            />

            <small>
              {description.length}/1000
            </small>
          </div>

          <div className="return-info-box">
            <span>ℹ️</span>

            <p>
              Your request will be reviewed
              before the refund is processed.
              The final refund amount may be
              confirmed after review.
            </p>
          </div>

          <div className="return-form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReturnRequest;