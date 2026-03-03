const host = window.location.hostname || "localhost";
const protocol = window.location.protocol || "http:";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const defaultPort =
  import.meta.env.VITE_API_PORT || import.meta.env.REACT_APP_API_PORT || "5000";

const fallbackBase = localHosts.has(host)
  ? `${protocol}//${host}:${defaultPort}`
  : `${protocol}//${host}`;

export const API_BASE =
  import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || fallbackBase;

export const resolveApiUrl = url => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
};
