const rawApiUrl = (import.meta.env.VITE_API_URL || "localhost:8000").trim();

// Remove any existing protocol from the environment variable to avoid "https://http://..."
const cleanApiUrl = rawApiUrl.replace(/^https?:\/\//i, '');

// Force HTTPS for production domains, and HTTP for localhost/development
export const API_BASE_URL = cleanApiUrl.includes('localhost') || cleanApiUrl.includes('127.0.0.1')
  ? `http://${cleanApiUrl}`
  : `https://${cleanApiUrl}`;
