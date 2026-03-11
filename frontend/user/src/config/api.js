const host = typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
const protocol = typeof window !== "undefined" ? window.location.protocol || "http:" : "http:";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const defaultPort =
  import.meta.env.VITE_API_PORT || import.meta.env.REACT_APP_API_PORT || "5000";
const productionApiBase = "https://api.allpreviouspaperhub.in";

const fallbackBase = localHosts.has(host)
  ? `${protocol}//${host}:${defaultPort}`
  : productionApiBase;

export const API_BASE =
  import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || fallbackBase;
export const PRODUCTION_API_BASE = productionApiBase;
export const IS_LOCAL_HOST = localHosts.has(host);

export const resolveApiUrl = url => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
};

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

export const resolveImageUrl = (url, options = {}) => {
  const resolved = resolveApiUrl(url);
  if (!resolved || !resolved.includes("res.cloudinary.com") || !resolved.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return resolved;
  }

  const {
    width,
    height,
    fit = "limit",
    quality = "auto",
    format = "auto",
    dpr = "auto"
  } = options;

  const transforms = [`f_${format}`, `q_${quality}`, `dpr_${dpr}`];
  if (Number.isFinite(Number(width)) && Number(width) > 0) {
    transforms.push(`w_${Math.round(Number(width))}`);
  }
  if (Number.isFinite(Number(height)) && Number(height) > 0) {
    transforms.push(`h_${Math.round(Number(height))}`);
  }
  if (transforms.length > 0) {
    transforms.push(`c_${fit}`);
  }

  const marker = `${CLOUDINARY_UPLOAD_SEGMENT}${transforms.join(",")}/`;
  return resolved.replace(CLOUDINARY_UPLOAD_SEGMENT, marker);
};
