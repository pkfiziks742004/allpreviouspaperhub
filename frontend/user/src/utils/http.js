const DEFAULT_TIMEOUT_MS = 12_000;

const withTimeout = async (promiseFactory, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promiseFactory(controller.signal);
  } finally {
    window.clearTimeout(timer);
  }
};

const request = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) =>
  withTimeout(async signal => {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response;
  }, timeoutMs);

export const getJson = async (url, options) => {
  const response = await request(url, { method: "GET", ...(options || {}) }, options?.timeoutMs);
  return response.json();
};

export const postJson = async (url, body, options) => {
  const response = await request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      },
      body: JSON.stringify(body ?? {})
    },
    options?.timeoutMs
  );
  return response.json().catch(() => ({}));
};

export const getBlob = async (url, options) => {
  const response = await request(url, { method: "GET", ...(options || {}) }, options?.timeoutMs);
  return response.blob();
};

export const getArrayBuffer = async (url, options) => {
  const response = await request(url, { method: "GET", ...(options || {}) }, options?.timeoutMs);
  return response.arrayBuffer();
};

export const ping = async (url, options) => {
  await request(url, { method: "GET", ...(options || {}) }, options?.timeoutMs);
};
