// ============================================================
// SHOPMART FRONTEND — CENTRALIZED CONFIG
// ============================================================
// Single source of truth for the backend API base URL.
// Falls back to localhost for local development so nothing
// breaks if VITE_API_URL isn't set.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
