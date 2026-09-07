const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const SOCKET_URL = BACKEND_URL;
export const API_URL = `${BACKEND_URL}/api`;
