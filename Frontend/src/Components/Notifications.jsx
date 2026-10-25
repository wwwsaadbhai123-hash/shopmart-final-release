import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { handleAuthResponse } from "../utils/authSession";


const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const formatNotificationDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "order_placed":
      return "🛍️";

    case "order_status":
      return "📦";

    case "payment":
      return "💳";

    case "system":
    default:
      return "🔔";
  }
};

const NotificationPanel = ({
  refreshKey = 0,
  onClose,
}) => {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  =========================================================
  FETCH NOTIFICATIONS
  =========================================================
  */
  const fetchNotifications = useCallback(
    async () => {
      const token = getToken();

      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/notifications`,
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
          handleAuthResponse(response);
          throw new Error(
            data.message ||
              "Failed to fetch notifications."
          );
        }

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      } catch (err) {
        console.error(
          "Notification fetch error:",
          err
        );

        setError(
          err.message ||
            "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  =========================================================
  LOAD NOTIFICATIONS
  =========================================================
  */
  useEffect(() => {
    fetchNotifications();
  }, [
    fetchNotifications,
    refreshKey,
  ]);

  /*
  =========================================================
  MARK ONE AS READ
  =========================================================
  */
  const markAsRead = async (id) => {
    const token = getToken();

    if (!token || !id) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        handleAuthResponse(response);
        throw new Error(
          data.message ||
            "Failed to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  =========================================================
  MARK ALL AS READ
  =========================================================
  */
  const markAllAsRead = async () => {
    const token = getToken();

    if (!token) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        handleAuthResponse(response);
        throw new Error(
          data.message ||
            "Failed to mark all notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  =========================================================
  DELETE NOTIFICATION
  =========================================================
  */
  const deleteNotification = async (id) => {
    const token = getToken();

    if (!token || !id) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        handleAuthResponse(response);
        throw new Error(
          data.message ||
            "Failed to delete notification."
        );
      }

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  return (
    <div className="notification-panel">
      {/* HEADER */}

      <div className="notification-panel-header">
        <div>
          <h3>Notifications</h3>

          <p>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1
                    ? "s"
                    : ""
                }`
              : "You're all caught up"}
          </p>
        </div>

        <button
          type="button"
          className="notification-close-button"
          onClick={onClose}
          aria-label="Close notifications"
        >
          ×
        </button>
      </div>

      {/* ACTIONS */}

      {notifications.length > 0 && (
        <div className="notification-panel-actions">
          <button
            type="button"
            className="notification-mark-all"
            onClick={markAllAsRead}
            disabled={
              actionLoading ||
              unreadCount === 0
            }
          >
            ✓ Mark all as read
          </button>

          <button
            type="button"
            className="notification-refresh"
            onClick={fetchNotifications}
            disabled={loading}
          >
            ↻
          </button>
        </div>
      )}

      {/* CONTENT */}

      <div className="notification-list">
        {loading ? (
          <div className="notification-empty">
            <div className="notification-loader">
              Loading...
            </div>
          </div>
        ) : error ? (
          <div className="notification-error">
            <span>⚠️</span>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchNotifications}
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              🔔
            </div>

            <h4>No notifications</h4>

            <p>
              Your notifications will appear
              here.
            </p>
          </div>
        ) : (
          notifications.map(
            (notification) => (
              <div
                key={notification._id}
                className={`notification-item ${
                  notification.isRead
                    ? "notification-read"
                    : "notification-unread"
                }`}
              >
                <div className="notification-item-icon">
                  {getNotificationIcon(
                    notification.type
                  )}
                </div>

                <div className="notification-item-content">
                  <div className="notification-item-title-row">
                    <h4>
                      {notification.title}
                    </h4>

                    {!notification.isRead && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>
                    {notification.message}
                  </p>

                  <span className="notification-date">
                    {formatNotificationDate(
                      notification.createdAt
                    )}
                  </span>

                  <div className="notification-item-actions">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() =>
                          markAsRead(
                            notification._id
                          )
                        }
                        disabled={actionLoading}
                      >
                        Mark as read
                      </button>
                    )}

                    <button
                      type="button"
                      className="notification-delete-button"
                      onClick={() =>
                        deleteNotification(
                          notification._id
                        )
                      }
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;