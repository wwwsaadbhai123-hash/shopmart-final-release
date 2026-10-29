import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { handleAuthResponse } from "../utils/authSession";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export default function FloatingChat({ refreshKey = 0 }) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const user = getUser();

  const request = async (path, options = {}) => {
    const token = getToken();
    if (!token) throw new Error("Please log in to chat with ShopMart support.");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      handleAuthResponse(response);
      throw new Error(data.message || "Chat request failed. Please try again.");
    }

    return data;
  };

  const loadConversations = async () => {
    const data = await request("/api/chat");
    const list = data.conversations || [];
    setConversations(list);

    if (conversation?._id) {
      const updated = list.find((item) => item._id === conversation._id);
      if (updated) setConversation(updated);
    }

    return list;
  };

  const loadMessages = async (id) => {
    const data = await request(`/api/chat/${id}/messages`);
    setMessages(data.messages || []);
  };

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    const refresh = async () => {
      try {
        const data = await request("/api/chat");
        if (cancelled) return;

        const list = data.conversations || [];
        setConversations(list);

        setConversation((current) => {
          if (current?._id) {
            return list.find((item) => item._id === current._id) || current;
          }
          return list.find((item) => item.status !== "closed") || null;
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 7000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, refreshKey]);

  useEffect(() => {
    if (!open || !conversation?._id) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    const refreshMessages = async () => {
      try {
        const data = await request(`/api/chat/${conversation._id}/messages`);
        if (!cancelled) setMessages(data.messages || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    refreshMessages();
    const timer = window.setInterval(refreshMessages, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, conversation?._id]);

  const startConversation = async () => {
    try {
      setStarting(true);
      setError("");
      const data = await request("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          subject: "General Support",
          type: "general",
        }),
      });

      if (!data.conversation?._id) {
        throw new Error("Support conversation was not created.");
      }

      setConversation(data.conversation);
      await loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !conversation?._id || sending) return;

    try {
      setSending(true);
      setError("");

      const data = await request(
        `/api/chat/${conversation._id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: draft.trim() }),
        }
      );

      if (data.data) setMessages((previous) => [...previous, data.data]);
      setDraft("");
      await loadMessages(conversation._id);
      await loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentId = String(user?._id || user?.id || "");

  return (
    <div className="sm-floating-chat">
      {open && (
        <section className="sm-chat-popup" aria-label="ShopMart customer support chat">
          <header className="sm-chat-topbar">
            <div className="sm-chat-brand-icon" aria-hidden="true">S</div>
            <div className="sm-chat-brand">
              <strong>ShopMart Support</strong>
              <span><i /> We're here to help</span>
            </div>
            <button
              className="sm-chat-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="sm-chat-content">
            <div className="sm-chat-welcome">
              <strong>Hi{user?.name ? ` ${user.name}` : ""}! 👋</strong>
              <p>Welcome to ShopMart. How can we help you today?</p>
            </div>

            {conversations.length > 0 && (
              <div className="sm-chat-conversation-list">
                <span className="sm-chat-section-label">YOUR CONVERSATIONS</span>
                {conversations.map((item) => (
                  <button
                    type="button"
                    key={item._id}
                    className={`sm-chat-thread ${conversation?._id === item._id ? "selected" : ""}`}
                    onClick={() => {
                      setConversation(item);
                      setError("");
                    }}
                  >
                    <span className="sm-chat-thread-icon">↗</span>
                    <span className="sm-chat-thread-text">
                      <strong>{item.subject || "General Support"}</strong>
                      <small>{item.lastMessage || "Open conversation"}</small>
                    </span>
                    <span className="sm-chat-thread-status">
                      {item.status === "closed" ? "Closed" : "Open"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {conversation && (
              <div className="sm-chat-thread-messages" aria-live="polite">
                {messages.length === 0 ? (
                  <p className="sm-chat-no-messages">
                    Send us a message and our support team will help you.
                  </p>
                ) : messages.map((item, index) => {
                  const senderId = String(item.sender?._id || item.sender || "");
                  const mine = senderId && senderId === currentId;

                  return (
                    <div
                      key={item._id || `${item.createdAt || ""}-${index}`}
                      className={`sm-chat-message ${mine ? "mine" : "theirs"}`}
                    >
                      <p>{item.message}</p>
                      <small>{formatTime(item.createdAt)}</small>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p className="sm-chat-error" role="alert">{error}</p>}

            {!conversation || conversation.status === "closed" ? (
              <button
                type="button"
                className="sm-chat-start"
                onClick={startConversation}
                disabled={starting || !getToken()}
              >
                {starting ? "Starting chat…" : conversation ? "Start a new conversation" : "Chat with support"}
              </button>
            ) : (
              <form className="sm-chat-composer" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write your message…"
                  aria-label="Write your message"
                  maxLength={3000}
                />
                <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message">
                  {sending ? "…" : "➤"}
                </button>
              </form>
            )}

            {!getToken() && (
              <p className="sm-chat-login-note">Please log in to start a support conversation.</p>
            )}
          </div>
          <footer className="sm-chat-footer">Powered by <strong>ShopMart</strong></footer>
        </section>
      )}

      <button
        type="button"
        className={`sm-chat-launcher ${open ? "is-open" : ""}`}
        onClick={() => {
          setOpen((value) => !value);
          setError("");
        }}
        aria-label={open ? "Close ShopMart chat" : "Open ShopMart chat"}
        aria-expanded={open}
      >
        {open ? <span className="sm-chat-launcher-x">×</span> : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
              <path d="M8 10h8M8 13.5h5" />
            </svg>
            <span>Chat with us</span>
          </>
        )}
      </button>
    </div>
  );
}
