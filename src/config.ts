const rawApiUrl = (import.meta.env.VITE_API_URL || "localhost:8000").trim();

<<<<<<< HEAD
// Use protocol if present, otherwise add it (HTTP for localhost, HTTPS for production)
export const API_BASE_URL = /^https?:\/\//i.test(rawApiUrl)
  ? rawApiUrl  // Use as-is if protocol exists
  : rawApiUrl.includes('localhost')
    ? `http://${rawApiUrl}`
    : `https://${rawApiUrl}`;
=======
// If the URL already includes a protocol, use it as-is.
// Otherwise, prepend http:// for localhost/development and https:// for production.
export const API_BASE_URL = /^https?:\/\//i.test(rawApiUrl)
  ? rawApiUrl
  : rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1')
    ? `http://${rawApiUrl}`
    : `https://${rawApiUrl}`;
>>>>>>> abc1c7856e7fbdb0ae7545d664d228785c46cf16
