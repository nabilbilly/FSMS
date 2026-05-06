const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Ensure the URL has a protocol; default to https if missing (unless it's localhost)
export const API_BASE_URL = rawApiUrl.startsWith('http') 
  ? rawApiUrl 
  : (rawApiUrl.includes('localhost') ? `http://${rawApiUrl}` : `https://${rawApiUrl}`);

