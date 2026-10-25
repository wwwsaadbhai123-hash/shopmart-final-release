// ============================================================
// SHOPMART FRONTEND
// IMAGE URL HELPER
// FILE: imageUrl.js
//
// Normalizes a product/category image value into a URL the
// browser can actually load:
// - absolute http(s)/data URIs pass through unchanged
// - a path already rooted at "/uploads/..." or "uploads/..."
//   gets the backend origin prefixed on (so it resolves against
//   the backend, not the Vite dev server serving the frontend)
// - a bare filename is assumed to live in the backend's
//   /uploads directory
// Falls back to a placeholder when no image is set.
// ============================================================

import { API_BASE_URL } from "../config";

export const getImageUrl = (image) => {
  if (!image) {
    return "https://via.placeholder.com/600x450?text=ShopMart";
  }

  if (typeof image !== "string") {
    return "https://via.placeholder.com/600x450?text=ShopMart";
  }

  if (
    image.startsWith("data:") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/uploads/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("uploads/")) {
    return `${API_BASE_URL}/${image}`;
  }

  return `${API_BASE_URL}/uploads/${image}`;
};
