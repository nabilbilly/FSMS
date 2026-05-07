const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Robustly determine the base URL
export const API_BASE_URL = (() => {

  // If it's already a full URL
  if (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')) {
    // If it's not localhost, force https
    if (!rawApiUrl.includes('localhost') && rawApiUrl.startsWith('http://')) {
      return rawApiUrl.replace('http://', 'https://');
    }
    return rawApiUrl;
  }
  
  // If it's just a domain
  const isLocal = rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1');
  return isLocal ? `http://${rawApiUrl}` : `https://${rawApiUrl}`;
})();


