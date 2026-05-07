const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:8000";

// Export the API base URL with a safe fallback for local development
export const API_BASE_URL = rawApiUrl;
