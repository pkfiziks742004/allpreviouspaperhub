import { API_BASE } from "../config/api";
import { getJson } from "./http";

const cache = new Map();
const inflight = new Map();

const DEFAULT_TTL_MS = 60 * 1000;
const STORAGE_PREFIX = "site-data-cache:v2:";

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const readPersistent = key => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!("value" in parsed) || !Number.isFinite(Number(parsed.at))) return null;
    return {
      value: parsed.value,
      at: Number(parsed.at)
    };
  } catch (error) {
    return null;
  }
};

const writePersistent = (key, value) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify({ value, at: Date.now() })
    );
  } catch (error) {
    // ignore storage errors
  }
};

const fetchCached = async (key, url, { ttlMs = DEFAULT_TTL_MS, force = false } = {}) => {
  const now = Date.now();
  const existing = cache.get(key);
  if (!force && existing && now - existing.at < ttlMs) {
    return existing.value;
  }

  if (!force && !existing) {
    const persistent = readPersistent(key);
    if (persistent && now - persistent.at < ttlMs) {
      cache.set(key, persistent);
      return persistent.value;
    }
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const request = getJson(url, { timeoutMs: 12_000 })
    .then(value => {
      cache.set(key, { value, at: Date.now() });
      writePersistent(key, value);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
};

export const getSettings = options => fetchCached("settings", `${API_BASE}/api/settings`, options);
export const getRatingSummary = options =>
  fetchCached("rating-summary", `${API_BASE}/api/site-rating`, options);
export const getUniversities = options => fetchCached("universities", `${API_BASE}/api/universities`, options);
export const getCourses = options => fetchCached("courses", `${API_BASE}/api/courses`, options);
export const getSemesters = options => fetchCached("semesters", `${API_BASE}/api/semesters`, options);
export const getPapers = options => fetchCached("papers", `${API_BASE}/api/papers`, options);

export const clearSiteDataCache = key => {
  if (!key) {
    cache.clear();
    inflight.clear();
    return;
  }
  cache.delete(key);
  inflight.delete(key);
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      // ignore storage errors
    }
  }
};
