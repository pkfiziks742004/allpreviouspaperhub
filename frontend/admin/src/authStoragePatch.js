const AUTH_KEYS = new Set(["token", "role", "permissions"]);

const originalGetItem = Storage.prototype.getItem;
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;

Storage.prototype.getItem = function patchedGetItem(key) {
  const keyStr = String(key || "");
  if (this === window.localStorage && AUTH_KEYS.has(keyStr)) {
    const fromSession = originalGetItem.call(window.sessionStorage, keyStr);
    if (fromSession !== null) return fromSession;

    const legacy = originalGetItem.call(window.localStorage, keyStr);
    if (legacy !== null) {
      originalSetItem.call(window.sessionStorage, keyStr, legacy);
      originalRemoveItem.call(window.localStorage, keyStr);
      return legacy;
    }

    return null;
  }

  return originalGetItem.call(this, key);
};

Storage.prototype.setItem = function patchedSetItem(key, value) {
  const keyStr = String(key || "");
  if (this === window.localStorage && AUTH_KEYS.has(keyStr)) {
    originalSetItem.call(window.sessionStorage, keyStr, value);
    originalRemoveItem.call(window.localStorage, keyStr);
    return;
  }

  originalSetItem.call(this, key, value);
};

Storage.prototype.removeItem = function patchedRemoveItem(key) {
  const keyStr = String(key || "");
  if (this === window.localStorage && AUTH_KEYS.has(keyStr)) {
    originalRemoveItem.call(window.sessionStorage, keyStr);
    originalRemoveItem.call(window.localStorage, keyStr);
    return;
  }

  originalRemoveItem.call(this, key);
};
