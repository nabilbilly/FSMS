const rawApiUrl = (import.meta.env.VITE_API_URL || "localhost:8000").trim();

// Use protocol if present, otherwise add it (HTTP for localhost, HTTPS for production)
export const API_BASE_URL = /^https?:\/\//i.test(rawApiUrl)
  ? rawApiUrl  // Use as-is if protocol exists
  : rawApiUrl.includes('localhost')
    ? `http://${rawApiUrl}`
    : `https://${rawApiUrl}`;