import { useEffect, useState } from "react";
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

const getCurrentUser = () => {
  try {
    const saved =
      localStorage.getItem("user");

    return saved
      ? JSON.parse(saved)
      : null;
  } catch {
    return null;
  }
};

const formatDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default function LiveChat({
  refreshKey = 0,
  adminMode = false,
}) {
  const [conversations, setConversations] =
    useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentUser =
    getCurrentUser();

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  const apiRequest = async (
    endpoint,
    options = {}
  ) => {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers: {
          ...getHeaders(),
          ...(options.headers || {}),
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      handleAuthResponse(response);
      throw new Error(
        data.message ||
          "Request failed"
      );
    }

    return data;
  };

  const loadConversations =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await apiRequest(adminMode ? "/api/chat/admin/all" : "/api/chat");

        setConversations(
          data.conversations || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

  const loadMessages =
    async (conversationId) => {
      try {
        setMessagesLoading(true);
        setError("");

        const data =
          await apiRequest(
            `/api/chat/${conversationId}/messages`
          );

        setMessages(
          data.messages || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setMessagesLoading(false);
      }
    };


useEffect(() => {
  if (!getToken()) {
    setLoading(false);
    setError("Please login to use chat.");
    return;
  }

  loadConversations();

  const refreshInterval = setInterval(() => {
    loadConversations();
  }, 5000);

  return () => {
    clearInterval(refreshInterval);
  };
}, [refreshKey, adminMode]);


  useEffect(() => {
    if (
      selectedConversation?._id
    ) {
      loadMessages(
        selectedConversation._id
      );
    }
  }, [
    selectedConversation?._id,
  ]);

  const sendMessage =
    async (event) => {
      event.preventDefault();

      if (!message.trim()) {
        return;
      }

      if (!selectedConversation) {
        return;
      }

      try {
        setSending(true);
        setError("");

        const data =
          await apiRequest(
            `/api/chat/${selectedConversation._id}/messages`,
            {
              method: "POST",
              body: JSON.stringify({
                message:
                  message.trim(),
              }),
            }
          );

        setMessages((prev) => [
          ...prev,
          data.data,
        ]);

        setMessage("");

        await loadConversations();
      } catch (err) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    };

  const closeChat =
    async () => {
      if (!selectedConversation) {
        return;
      }

      try {
        await apiRequest(
          `/api/chat/${selectedConversation._id}/close`,
          {
            method: "PATCH",
          }
        );

        setSelectedConversation(
          null
        );

        setMessages([]);

        await loadConversations();
      } catch (err) {
        setError(err.message);
      }
    };

  // SHOPMART_CUSTOMER_START_CHAT_FIX
  const [startingChat, setStartingChat] = useState(false);

  const startSupportChat = async () => {
    try {
      setStartingChat(true);
      setError("");

      const data = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          subject: "General Support",
          type: "general",
        }),
      });

      const conversation = data?.conversation;
      if (!conversation?._id) {
        throw new Error("Support conversation create nahi hui.");
      }

      await loadConversations();
      setSelectedConversation(conversation);
    } catch (err) {
      setError(err.message || "Support chat start nahi ho saki.");
    } finally {
      setStartingChat(false);
    }
  };
  const getOtherParticipant =
    (conversation) => {
      const participants =
        conversation?.participants ||
        [];

      return (
        participants.find(
          (participant) =>
            String(
              participant._id
            ) !==
            String(
              currentUser?._id ||
                currentUser?.id
            )
        ) || participants[0]
      );
    };

  return (
<div className={`live-chat ${adminMode ? "admin-live-chat" : "customer-live-chat"}`}>

      

      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}

      <div className="live-chat-layout">

        {/* =================
            CONVERSATIONS
        ================= */}

        <div className="chat-conversations">

          <div className="chat-panel-title">
            Conversations
          </div>
          {!adminMode && currentUser?.role !== "admin" && (
            <button
              type="button"
              className="chat-start-support-button"
              onClick={startSupportChat}
              disabled={startingChat}
            >
              {startingChat ? "Starting..." : "Start Support Chat"}
            </button>
          )}

          {loading ? (
            <div className="chat-empty">
              Loading...
            </div>
          ) : conversations.length ===
            0 ? (
            <div className="chat-empty">
              No conversations yet.
            </div>
          ) : (
            conversations.map(
              (conversation) => {
                const other =
                  getOtherParticipant(
                    conversation
                  );

                return (
                  <button
                    type="button"
                    key={
                      conversation._id
                    }
                    className={`chat-conversation-item ${
                      selectedConversation?._id ===
                      conversation._id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedConversation(
                        conversation
                      )
                    }
                  >
                    <strong>
                      {other?.name ||
                        other?.email ||
                        "User"}
                    </strong>

                    <span>
                      {conversation.lastMessage ||
                        "No messages yet"}
                    </span>

                    <small>
                      {conversation.status}
                    </small>
                  </button>
                );
              }
            )
          )}
        </div>

        {/* =================
            CHAT WINDOW
        ================= */}

        <div className="chat-window">

          {!selectedConversation ? (
            <div className="chat-empty-large">
              <h3>
                Select a conversation
              </h3>

              <p>
                Choose a conversation
                from the left side.
              </p>
            </div>
          ) : (
            <>
              <div className="chat-window-header">
                <div>
                  <strong>
                    {getOtherParticipant(
                      selectedConversation
                    )?.name ||
                      "Conversation"}
                  </strong>

                  <span>
                    {selectedConversation
                      .subject ||
                      "General Support"}
                  </span>
                </div>

                {selectedConversation.status !==
                  "closed" && (
                  <button
                    type="button"
                    onClick={closeChat}
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="chat-messages">

                {messagesLoading ? (
                  <div className="chat-empty">
                    Loading messages...
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="chat-empty">
                    No messages yet.
                  </div>
                ) : (
                  messages.map(
                    (item) => {
                      const isMine =
                        String(
                          item.sender?._id
                        ) ===
                        String(
                          currentUser?._id ||
                            currentUser?.id
                        );

                      return (
                        <div
                          key={item._id}
                          className={`chat-message ${
                            isMine
                              ? "mine"
                              : "other"
                          }`}
                        >
                          <div className="chat-message-bubble">
                            <p>
                              {
                                item.message
                              }
                            </p>

                            <small>
                              {formatDate(
                                item.createdAt
                              )}
                            </small>
                          </div>
                        </div>
                      );
                    }
                  )
                )}

              </div>

              {selectedConversation.status !==
              "closed" ? (
                <form
                  className="chat-input-area"
                  onSubmit={sendMessage}
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    placeholder="Type your message..."
                    maxLength={3000}
                  />

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !message.trim()
                    }
                  >
                    {sending
                      ? "Sending..."
                      : "Send"}
                  </button>
                </form>
              ) : (
                <div className="chat-closed">
                  This conversation is
                  closed.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

