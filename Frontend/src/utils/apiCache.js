// ============================================================
// SHOPMART FRONTEND
// PHASE 26 — API CACHE
// FILE: apiCache.js
// ============================================================

const cache = new Map();

const DEFAULT_TTL = 30 * 1000;

export const getCachedData = (
  key
) => {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  const isExpired =
    Date.now() - item.timestamp >
    item.ttl;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return item.data;
};

export const setCachedData = (
  key,
  data,
  ttl = DEFAULT_TTL
) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

export const removeCachedData = (
  key
) => {
  cache.delete(key);
};

export const clearApiCache = () => {
  cache.clear();
};

export const cachedFetch = async (
  key,
  url,
  options = {},
  ttl = DEFAULT_TTL
) => {
  const cached = getCachedData(key);

  if (cached !== null) {
    return cached;
  }

  const response = await fetch(
    url,
    options
  );

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status}`
    );
  }

  const data = await response.json();

  setCachedData(
    key,
    data,
    ttl
  );

  return data;
};