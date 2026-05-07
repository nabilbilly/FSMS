const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();

export const API_BASE_URL = (() => {
  // 1. If it's a full URL starting with http:// or https:// (case-insensitive)
  if (/^https?:\/\//i.test(rawApiUrl)) {
    // If it's NOT localhost/127.0.0.1, force it to be https://
    if (!rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1')) {
      return rawApiUrl.replace(/^http:\/\//i, 'https://');
    }
    return rawApiUrl;
  }
  
  // 2. If it's just a domain (no protocol)
  const isLocal = rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1');
  return isLocal ? `http://${rawApiUrl}` : `https://${rawApiUrl}`;
})();



