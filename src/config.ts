const apiUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiUrl) {
    throw new Error("VITE_API_URL is not defined");
}

export const API_BASE_URL = apiUrl.replace(/\/+$/, "");