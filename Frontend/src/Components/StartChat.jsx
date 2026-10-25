import { useState } from "react";
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

export default function StartChat({
  participantId,
  subject = "General Support",
  type = "general",
  orderId = null,
  supportTicketId = null,
  onCreated,
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const startChat = async () => {
    if (!participantId) {
      setError(
        "Chat participant is missing."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Please login to start a chat."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            participantId,
            subject,
            type,
            orderId,
            supportTicketId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        handleAuthResponse(response);
        throw new Error(
          data.message ||
            "Failed to start chat"
        );
      }

      if (onCreated) {
        onCreated(
          data.conversation
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-chat">
      <button
        type="button"
        onClick={startChat}
        disabled={loading}
      >
        {loading
          ? "Opening..."
          : "Start Chat"}
      </button>

      {error && (
        <small className="chat-error">
          {error}
        </small>
      )}
    </div>
  );
}