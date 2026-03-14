import { useEffect, useRef, useState } from "react";

export const useNearViewport = ({
  enabled = true,
  rootMargin = "320px 0px",
  once = true
} = {}) => {
  const targetRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsNearViewport(false);
      return undefined;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return undefined;
    }

    const node = targetRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          setIsNearViewport(true);
          if (once) {
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold: 0.01
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, once, rootMargin]);

  return { targetRef, isNearViewport };
};
