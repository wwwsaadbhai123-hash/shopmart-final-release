// ============================================================
// SHOPMART FRONTEND
// AUTH SESSION HELPERS
// FILE: authSession.js
//
// Centralizes the "the stored token is dead" handling so that
// a 401 from a protected endpoint doesn't just get logged and
// silently retried forever on every mount/refresh with the
// same stale token. All three historical token keys are kept
// for backward compatibility; "token" remains the canonical
// key written on login.
// ============================================================

const TOKEN_KEYS = ["token", "authToken", "accessToken"];

export const getStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
};

// Call this once the server has confirmed (via a 401 response
// from a protected endpoint) that the stored token is missing,
// invalid, or expired. Clearing it here means the next mount of
// any protected component sees "no token" and skips the request
// entirely, instead of re-sending the same dead token forever.
export const clearAuthSession = () => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("user");
};

// Inspects a fetch Response from a `protect`-guarded endpoint.
// Only a 401 means "not actually authenticated" (missing/invalid/
// expired token or user no longer exists) - a 403 means the
// token is valid but the action/role isn't allowed, so it must
// NOT clear the session.
export const handleAuthResponse = (response) => {
  if (response && response.status === 401) {
    clearAuthSession();
  }
};
