const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const browserBackendUrl = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : "http://localhost:8000";
const BACKEND_URL = (configuredUrl || browserBackendUrl).replace(/\/$/, "");

export const SOCKET_URL = BACKEND_URL;
export const API_URL = `${BACKEND_URL}/api`;
