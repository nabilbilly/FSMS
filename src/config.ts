const rawApiUrl =
    import.meta.env.VITE_API_URL?.trim() ||
    "http://localhost:8000";

export const API_BASE_URL = rawApiUrl;