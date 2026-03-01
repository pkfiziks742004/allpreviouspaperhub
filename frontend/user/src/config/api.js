const host = window.location.hostname || "localhost";
const protocol = window.location.protocol || "http:";
const port = process.env.REACT_APP_API_PORT || "5000";

export const API_BASE =
  process.env.REACT_APP_API_BASE || `${protocol}//${host}:${port}`;

export const resolveApiUrl = url => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
};
