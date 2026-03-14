import { useEffect, useState } from "react";

export const scheduleDeferred = (task, timeout = 1500) => {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }

  const timer = window.setTimeout(task, timeout);
  return () => window.clearTimeout(timer);
};

export const useDeferredUiReady = (timeout = 1500, enabled = true) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return undefined;
    }

    setReady(false);
    return scheduleDeferred(() => {
      setReady(true);
    }, timeout);
  }, [enabled, timeout]);

  return ready;
};
