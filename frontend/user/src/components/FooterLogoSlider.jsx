import { useEffect, useMemo, useState } from "react";
import { resolveImageUrl } from "../config/api";
import { getSettings } from "../utils/siteData";

export default function FooterLogoSlider({ flush = false }) {
  const [ready, setReady] = useState(false);
  const [footerLogoSliderEnabled, setFooterLogoSliderEnabled] = useState(false);
  const [footerLogoSliderBgColor, setFooterLogoSliderBgColor] = useState("#06141f");
  const [footerLogoSliderTextColor, setFooterLogoSliderTextColor] = useState("#e2e8f0");
  const [footerLogoSliderTrackBgColor, setFooterLogoSliderTrackBgColor] = useState("rgba(255,255,255,0.06)");
  const [footerLogoSliderSpeed, setFooterLogoSliderSpeed] = useState(28);
  const [footerLogoSliderLogoHeight, setFooterLogoSliderLogoHeight] = useState(42);
  const [footerLogoSliderPauseOnHover, setFooterLogoSliderPauseOnHover] = useState(true);
  const [footerLogoSliderItems, setFooterLogoSliderItems] = useState([]);

  const resolveFooterSliderLogoUrl = url =>
    resolveImageUrl(url, { width: 320, height: 120, fit: "limit" });

  useEffect(() => {
    getSettings({ ttlMs: 45_000 })
      .then(data => {
        setFooterLogoSliderEnabled(!!data?.footerLogoSliderEnabled);
        setFooterLogoSliderBgColor(data?.footerLogoSliderBgColor || "#06141f");
        setFooterLogoSliderTextColor(data?.footerLogoSliderTextColor || "#e2e8f0");
        setFooterLogoSliderTrackBgColor(data?.footerLogoSliderTrackBgColor || "rgba(255,255,255,0.06)");
        setFooterLogoSliderSpeed(Number(data?.footerLogoSliderSpeed || 28));
        setFooterLogoSliderLogoHeight(Number(data?.footerLogoSliderLogoHeight || 42));
        setFooterLogoSliderPauseOnHover(
          data?.footerLogoSliderPauseOnHover !== undefined ? !!data.footerLogoSliderPauseOnHover : true
        );
        setFooterLogoSliderItems(Array.isArray(data?.footerLogoSliderItems) ? data.footerLogoSliderItems : []);
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  const activeFooterLogoSliderItems = Array.isArray(footerLogoSliderItems)
    ? footerLogoSliderItems.filter(item => String(item?.imageUrl || "").trim())
    : [];

  const marqueeFooterLogoSliderItems = useMemo(() => {
    if (activeFooterLogoSliderItems.length === 0) {
      return [];
    }

    const minimumTrackItems = 14;
    const copiesNeeded =
      activeFooterLogoSliderItems.length === 1
        ? minimumTrackItems
        : Math.max(2, Math.ceil(minimumTrackItems / activeFooterLogoSliderItems.length));

    return Array.from({ length: activeFooterLogoSliderItems.length * copiesNeeded }, (_, idx) => {
      const item = activeFooterLogoSliderItems[idx % activeFooterLogoSliderItems.length];
      return {
        ...item,
        __marqueeKey: `${idx}-${item?._id || item?.id || item?.imageUrl || "logo"}`
      };
    });
  }, [activeFooterLogoSliderItems]);

  const renderFooterLogoSliderItem = (item, idx, groupIndex) => {
    const content = (
      <span
        className="footer-logo-slider-item-logo"
        style={{ height: `${Math.max(24, Number(footerLogoSliderLogoHeight || 42))}px` }}
      >
        <img
          src={resolveFooterSliderLogoUrl(item.imageUrl)}
          alt={item.name || `Footer slider item ${idx + 1}`}
          loading="lazy"
          decoding="async"
        />
      </span>
    );

    if (!item.linkUrl) {
      return (
        <div key={`footer-logo-slider-item-${groupIndex}-${item.__marqueeKey || idx}`} className="footer-logo-slider-item">
          {content}
        </div>
      );
    }

    return (
      <a
        key={`footer-logo-slider-item-${groupIndex}-${item.__marqueeKey || idx}`}
        className="footer-logo-slider-item footer-logo-slider-item--link"
        href={item.linkUrl}
        target={item.openInNewTab === false ? "_self" : "_blank"}
        rel={item.openInNewTab === false ? undefined : "noopener noreferrer"}
      >
        {content}
      </a>
    );
  };

  if (!ready || !footerLogoSliderEnabled || activeFooterLogoSliderItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`footer-logo-slider-shell${flush ? " footer-logo-slider-shell--flush" : ""}`}
      style={{
        background: footerLogoSliderBgColor || "#06141f",
        color: footerLogoSliderTextColor || "#e2e8f0",
        "--footer-logo-slider-track-bg": footerLogoSliderTrackBgColor || "rgba(255,255,255,0.06)",
        "--footer-logo-slider-duration": `${Math.max(8, Number(footerLogoSliderSpeed || 28))}s`
      }}
    >
      <div
        className={`footer-logo-slider-marquee${footerLogoSliderPauseOnHover ? " footer-logo-slider-marquee--pause" : ""}`}
      >
        <div className="footer-logo-slider-track">
          {[0, 1].map(groupIndex => (
            <div
              key={`footer-logo-slider-sequence-${groupIndex}`}
              className="footer-logo-slider-sequence"
              aria-hidden={groupIndex === 1 ? "true" : undefined}
            >
              {marqueeFooterLogoSliderItems.map((item, idx) => renderFooterLogoSliderItem(item, idx, groupIndex))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
