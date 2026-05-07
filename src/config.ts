const rawApiUrl = (import.meta.env.VITE_API_URL || "localhost:8000").trim();

// If the URL already includes a protocol, use it as-is.
// Otherwise, prepend http:// for localhost/development and https:// for production.
export const API_BASE_URL = /^https?:\/\//i.test(rawApiUrl)
  ? rawApiUrl
  : rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1')
    ? `http://${rawApiUrl}`
    : `https://${rawApiUrl}`;
