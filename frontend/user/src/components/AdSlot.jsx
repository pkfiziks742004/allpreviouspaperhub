import { useEffect, useRef } from "react";
import { useAds } from "../context/AdsContext";

export default function AdSlot({ className = "", label = "Advertisement" }) {
  const ads = useAds();
  const slotRef = useRef(null);
  const html = (ads && ads.bodyScript) || "";
  const shouldRenderSnippet = html.includes("<ins") || html.includes("adsbygoogle");

  useEffect(() => {
    if (!ads?.enabled || !shouldRenderSnippet || !slotRef.current) return;
    const root = slotRef.current;
    const scripts = root.querySelectorAll("script");

    scripts.forEach(script => {
      const next = document.createElement("script");
      Array.from(script.attributes).forEach(attr => {
        next.setAttribute(attr.name, attr.value);
      });
      next.text = script.text || script.textContent || "";
      script.parentNode && script.parentNode.replaceChild(next, script);
    });
  }, [ads?.enabled, shouldRenderSnippet, html]);

  if (!ads?.enabled) return null;

  return (
    <div className={`ad-slot-wrap ${className}`.trim()}>
      <div className="ad-slot-label">{label}</div>
      <div className="ad-slot-box" ref={slotRef}>
        {shouldRenderSnippet ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="ad-slot-fallback">
            Google Ads enabled. Add ad unit code in `Body Script` to display live ad block.
          </div>
        )}
      </div>
    </div>
  );
}

