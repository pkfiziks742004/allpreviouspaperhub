import { API_BASE, IS_LOCAL_HOST, PRODUCTION_API_BASE } from "../config/api";
import { getJson } from "./http";

const cache = new Map();
const inflight = new Map();

const DEFAULT_TTL_MS = 60 * 1000;
const STORAGE_PREFIX = "site-data-cache:v2:";
const BOOTSTRAP_DATA_KEY = "__APP_BOOTSTRAP_DATA__";
const BOOTSTRAP_PROMISES_KEY = "__APP_BOOTSTRAP_PROMISES__";

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;
const canUseWindow = () => typeof window !== "undefined";

const readBootstrapValue = key => {
  if (!canUseWindow()) return null;
  const source = window[BOOTSTRAP_DATA_KEY];
  if (!source || typeof source !== "object") return null;
  return key in source ? source[key] : null;
};

const readBootstrapPromise = key => {
  if (!canUseWindow()) return null;
  const source = window[BOOTSTRAP_PROMISES_KEY];
  if (!source || typeof source !== "object") return null;
  return source[key] instanceof Promise ? source[key] : null;
};

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

const isMeaningfulValue = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value != null && value !== "";
};

const shouldUseProductionFallback = (key, value) => {
  if (!IS_LOCAL_HOST || API_BASE === PRODUCTION_API_BASE) return false;
  if (key === "universities") return !Array.isArray(value) || value.length === 0;
  if (key === "settings") return !isMeaningfulValue(value);
  return false;
};

const storeResolvedValue = (key, value) => {
  cache.set(key, { value, at: Date.now() });
  writePersistent(key, value);
  return value;
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

    const bootstrapValue = readBootstrapValue(key);
    if (isMeaningfulValue(bootstrapValue) || Array.isArray(bootstrapValue)) {
      return storeResolvedValue(key, bootstrapValue);
    }
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const loadFromNetwork = () =>
    getJson(url, { timeoutMs: 12_000 }).catch(error => {
      if (!IS_LOCAL_HOST || API_BASE === PRODUCTION_API_BASE) {
        throw error;
      }
      const fallbackUrl = url.replace(API_BASE, PRODUCTION_API_BASE);
      return getJson(fallbackUrl, { timeoutMs: 12_000 });
    });

  const bootstrapPromise = !force ? readBootstrapPromise(key) : null;

  const request = Promise.resolve(
    bootstrapPromise
      ? bootstrapPromise.then(value => {
          if (isMeaningfulValue(value) || Array.isArray(value)) {
            return value;
          }
          return loadFromNetwork();
        })
      : loadFromNetwork()
  )
    .then(async value => {
      if (shouldUseProductionFallback(key, value)) {
        const fallbackUrl = url.replace(API_BASE, PRODUCTION_API_BASE);
        value = await getJson(fallbackUrl, { timeoutMs: 12_000 });
      }
      return storeResolvedValue(key, value);
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
export const peekCachedValue = key => {
  const existing = cache.get(key);
  if (existing) return existing.value;

  const bootstrapValue = readBootstrapValue(key);
  if (isMeaningfulValue(bootstrapValue) || Array.isArray(bootstrapValue)) {
    return bootstrapValue;
  }

  const persistent = readPersistent(key);
  return persistent?.value ?? null;
};
export const peekSettings = () => peekCachedValue("settings");
export const peekUniversities = () => peekCachedValue("universities");

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
