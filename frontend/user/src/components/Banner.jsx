import { useEffect, useRef, useState } from "react";
import { resolveImageUrl } from "../config/api";
import { getSettings, peekSettings } from "../utils/siteData";
import { useDeviceProfile } from "../utils/useDeviceProfile";
const SIMPLE_BADGE_SHAPES = new Set(["custom", "pill", "square", "rounded-square", "soft-rounded"]);

const initialSettings = peekSettings() || {};
const initialBannerItems = Array.isArray(initialSettings.bannerItems) && initialSettings.bannerItems.length > 0
  ? initialSettings.bannerItems
  : (Array.isArray(initialSettings.bannerImages) ? initialSettings.bannerImages.map(src => ({ imageUrl: src })) : []);

const getSimpleBadgeShapeStyle = (shape, radius) => {
  if (shape === "pill") return { borderRadius: "999px" };
  if (shape === "square") return { borderRadius: "4px" };
  if (shape === "rounded-square") return { borderRadius: "16px" };
  if (shape === "soft-rounded") return { borderRadius: "24px" };
  return { borderRadius: `${Number(radius || 8)}px` };
};

const normalizeBannerItems = rawItems =>
  (rawItems || [])
    .map(item => {
      const imageUrl = String(item?.imageUrl || item?.src || item || "").trim();
      if (!imageUrl) return null;
      return {
        imageUrl,
        linkUrl: String(item?.linkUrl || "").trim(),
        openInNewTab: !!item?.openInNewTab,
        fitMode: ["cover", "contain", "fill"].includes(String(item?.fitMode || "").toLowerCase())
          ? String(item.fitMode).toLowerCase()
          : "cover",
        badgeEnabled: item?.badgeEnabled !== undefined ? !!item.badgeEnabled : !!String(item?.badgeText || "").trim(),
        badgeText: String(item?.badgeText || "").trim(),
        badgeTop: Number.isFinite(Number(item?.badgeTop)) ? Number(item.badgeTop) : 16,
        badgeLeft: Number.isFinite(Number(item?.badgeLeft)) ? Number(item.badgeLeft) : 16,
        mobileBadgeTop: Number.isFinite(Number(item?.mobileBadgeTop)) ? Number(item.mobileBadgeTop) : 12,
        mobileBadgeLeft: Number.isFinite(Number(item?.mobileBadgeLeft)) ? Number(item.mobileBadgeLeft) : 12,
        badgeBgColor: item?.badgeBgColor || "#ef4444",
        badgeTextColor: item?.badgeTextColor || "#ffffff",
        badgeFontSize: Number.isFinite(Number(item?.badgeFontSize)) ? Number(item.badgeFontSize) : 14,
        badgeRadius: Number.isFinite(Number(item?.badgeRadius)) ? Number(item.badgeRadius) : 8,
        badgePaddingX: Number.isFinite(Number(item?.badgePaddingX)) ? Number(item.badgePaddingX) : 10,
        badgePaddingY: Number.isFinite(Number(item?.badgePaddingY)) ? Number(item.badgePaddingY) : 6,
        badgeShape: String(item?.badgeShape || "custom").toLowerCase().trim() || "custom",
        badgeWidth: Number.isFinite(Number(item?.badgeWidth)) ? Number(item.badgeWidth) : 0,
        badgeHeight: Number.isFinite(Number(item?.badgeHeight)) ? Number(item.badgeHeight) : 0,
        badgeUseImage: !!item?.badgeUseImage,
        badgeImageUrl: String(item?.badgeImageUrl || "").trim(),
        badgeImageSize: Number.isFinite(Number(item?.badgeImageSize)) ? Number(item.badgeImageSize) : 18,
        badgeBorderWidth: Number.isFinite(Number(item?.badgeBorderWidth)) ? Number(item.badgeBorderWidth) : 0,
        badgeBorderColor: item?.badgeBorderColor || "#ffffff",
        badgeOutlineWidth: Number.isFinite(Number(item?.badgeOutlineWidth)) ? Number(item.badgeOutlineWidth) : 0,
        badgeOutlineColor: item?.badgeOutlineColor || "#1e293b",
        badgeShadowX: Number.isFinite(Number(item?.badgeShadowX)) ? Number(item.badgeShadowX) : 0,
        badgeShadowY: Number.isFinite(Number(item?.badgeShadowY)) ? Number(item.badgeShadowY) : 6,
        badgeShadowBlur: Number.isFinite(Number(item?.badgeShadowBlur)) ? Number(item.badgeShadowBlur) : 14,
        badgeShadowColor: item?.badgeShadowColor || "#0f172a66"
      };
    })
    .filter(Boolean);

export default function Banner() {
  const deviceProfile = useDeviceProfile();
  const [items, setItems] = useState(() => normalizeBannerItems(initialBannerItems));
  const [ready, setReady] = useState(initialBannerItems.length > 0);
  const [bannerMargin, setBannerMargin] = useState(Number(initialSettings.bannerMargin || 0));
  const [bannerRadius, setBannerRadius] = useState(Number(initialSettings.bannerRadius || 0));
  const [badgeScaleMap, setBadgeScaleMap] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [badgeShapeHelpers, setBadgeShapeHelpers] = useState(null);
  const bannerImageRefs = useRef({});
  const isMobileView = deviceProfile.isMobile;
  const isConstrainedMobile = deviceProfile.isMobile && deviceProfile.isConstrained;
  const safeMargin = Math.max(0, Number(bannerMargin || 0));
  const mobileStaticItem = items[0] || null;

  const resolveBannerUrl = url =>
    resolveImageUrl(url, {
      width: isConstrainedMobile ? 480 : isMobileView ? 640 : 1280,
      fit: "limit",
      quality: isConstrainedMobile ? "auto:low" : isMobileView ? "auto:eco" : "auto:eco"
    });
  const resolveBadgeUrl = url =>
    resolveImageUrl(url, {
      width: isMobileView ? 72 : 96,
      height: isMobileView ? 72 : 96,
      fit: "limit",
      quality: isConstrainedMobile ? "auto:low" : "auto"
    });

  useEffect(() => {
    if (!initialBannerItems.length) return;
    setItems(normalizeBannerItems(initialBannerItems));
  }, []);

  useEffect(() => {
    getSettings({ ttlMs: 45_000 })
      .then(data => {
        const rawItems =
          Array.isArray(data?.bannerItems) && data.bannerItems.length > 0
            ? data.bannerItems
            : (Array.isArray(data?.bannerImages) ? data.bannerImages.map(src => ({ imageUrl: src })) : []);
        const normalized = normalizeBannerItems(rawItems);
        setItems(normalized);
        if (data && data.bannerMargin !== undefined) {
          setBannerMargin(Number(data.bannerMargin || 0));
        }
        if (data && data.bannerRadius !== undefined) {
          setBannerRadius(Number(data.bannerRadius || 0));
        }
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (isMobileView) return undefined;

    const updateScaleMap = () => {
      setBadgeScaleMap(prev => {
        const next = { ...prev };
        items.forEach((_, idx) => {
          const img = bannerImageRefs.current[idx];
          if (!img) return;
          const naturalWidth = Number(img.naturalWidth || 0);
          const renderedWidth = Number(img.clientWidth || 0);
          if (!naturalWidth || !renderedWidth) return;
          next[idx] = Math.min(1.25, Math.max(0.42, renderedWidth / naturalWidth));
        });
        return next;
      });
    };

    updateScaleMap();
    window.addEventListener("resize", updateScaleMap);
    return () => window.removeEventListener("resize", updateScaleMap);
  }, [isMobileView, items]);

  useEffect(() => {
    if (isMobileView || !items.length) return undefined;
    const needsComplexShapes = items.some(item => !SIMPLE_BADGE_SHAPES.has(item.badgeShape || "custom"));
    if (!needsComplexShapes || badgeShapeHelpers) return undefined;

    let active = true;
    import("./bannerBadgeShape")
      .then(mod => {
        if (active) {
          setBadgeShapeHelpers({ getBadgeShapeStyle: mod.getBadgeShapeStyle });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [badgeShapeHelpers, isMobileView, items]);

  useEffect(() => {
    if (isMobileView || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, isMobileView ? 4200 : 3600);

    return () => window.clearInterval(timer);
  }, [isMobileView, items.length]);

  if (!ready && items.length === 0) {
    return (
      <div className="banner-shell" style={{ margin: "0 auto", width: "100%" }}>
        <div className="banner-frame" style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }} />
      </div>
    );
  }

  if (items.length === 0) return null;

  const bannerShellStyle =
    safeMargin > 0
      ? {
          margin: `${safeMargin}px`,
          width: `calc(100% - ${safeMargin * 2}px)`
        }
      : {
          margin: "0 auto",
          width: "100%"
        };

  const renderBannerItem = (item, index) => {
    const scale = Number(badgeScaleMap[index] || 1);
    const isComplexShape =
      item.badgeShape &&
      !["custom", "pill", "square", "rounded-square", "soft-rounded"].includes(item.badgeShape);
    const fallbackWidth = isComplexShape ? 88 : 0;
    const fallbackHeight = isComplexShape ? 44 : 0;
    const computedFont = Math.max(10, Math.round(Math.max(10, Number(item.badgeFontSize || 14)) * scale));
    const computedPadY = Math.max(4, Math.round(Math.max(4, Number(item.badgePaddingY || 6)) * scale));
    const computedPadX = Math.max(6, Math.round(Math.max(6, Number(item.badgePaddingX || 10)) * scale));
    const computedWidth = item.badgeWidth > 0 ? Math.max(18, Number(item.badgeWidth)) : fallbackWidth;
    const computedHeight = item.badgeHeight > 0 ? Math.max(14, Number(item.badgeHeight)) : fallbackHeight;
    const estimatedBadgeHeight = Math.max(
      20,
      computedHeight > 0 ? Math.round(computedHeight * scale) : computedFont + computedPadY * 2 + 6
    );
    const estimatedBadgeWidth = Math.max(
      42,
      computedWidth > 0 ? Math.round(computedWidth * scale) : 96
    );
    const desktopTop = Math.round(Math.max(0, Number(item.badgeTop || 0)) * scale);
    const desktopLeft = Math.round(Math.max(0, Number(item.badgeLeft || 0)) * scale);
    const mobileTopFromData = Number(item.mobileBadgeTop);
    const mobileLeftFromData = Number(item.mobileBadgeLeft);
    const mobileTop = Number.isFinite(mobileTopFromData) ? Math.max(4, mobileTopFromData) : Math.min(desktopTop, 12);
    const mobileLeft = Number.isFinite(mobileLeftFromData) ? Math.max(4, mobileLeftFromData) : Math.min(desktopLeft, 12);
    const effectiveTop = isMobileView ? mobileTop : desktopTop;
    const effectiveLeft = isMobileView ? mobileLeft : desktopLeft;
    const image = (
      <>
        <img
          ref={el => {
            bannerImageRefs.current[index] = el;
          }}
          className="d-block w-100 banner-img"
          src={resolveBannerUrl(item.imageUrl)}
          alt={`Banner ${index + 1}`}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding={index === 0 && !isMobileView ? "sync" : "async"}
          style={{ objectFit: item.fitMode || "cover" }}
          onLoad={event => {
            const img = event.currentTarget;
            const naturalWidth = Number(img.naturalWidth || 0);
            const renderedWidth = Number(img.clientWidth || 0);
            if (!naturalWidth || !renderedWidth) return;
            setBadgeScaleMap(prev => ({
              ...prev,
              [index]: Math.min(1.25, Math.max(0.42, renderedWidth / naturalWidth))
            }));
          }}
        />
        {item.badgeEnabled && (item.badgeText || (item.badgeUseImage && item.badgeImageUrl)) && (
          <span
            className="banner-badge"
            style={{
              "--badge-top": `${Math.max(0, Number(item.badgeTop || 0))}px`,
              "--badge-left": `${Math.max(0, Number(item.badgeLeft || 0))}px`,
              top: `clamp(4px, ${effectiveTop}px, calc(100% - ${estimatedBadgeHeight + 4}px))`,
              left: `clamp(4px, ${effectiveLeft}px, calc(100% - ${estimatedBadgeWidth + 4}px))`,
              fontSize: `${computedFont}px`,
              padding: `${computedPadY}px ${computedPadX}px`,
              background: item.badgeBgColor,
              color: item.badgeTextColor,
              ...(badgeShapeHelpers?.getBadgeShapeStyle
                ? badgeShapeHelpers.getBadgeShapeStyle(item.badgeShape || "custom", item.badgeRadius)
                : getSimpleBadgeShapeStyle(item.badgeShape || "custom", item.badgeRadius)),
              width:
                item.badgeWidth > 0
                  ? `${Math.max(18, Number(item.badgeWidth))}px`
                  : fallbackWidth > 0
                    ? `${fallbackWidth}px`
                    : "auto",
              minHeight:
                item.badgeHeight > 0
                  ? `${Math.max(14, Number(item.badgeHeight))}px`
                  : fallbackHeight > 0
                    ? `${fallbackHeight}px`
                    : "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              border: `${Number(item.badgeBorderWidth || 0)}px solid ${item.badgeBorderColor || "#ffffff"}`,
              outline: `${Number(item.badgeOutlineWidth || 0)}px solid ${item.badgeOutlineColor || "#1e293b"}`,
              boxShadow: `${Number(item.badgeShadowX || 0)}px ${Number(item.badgeShadowY || 0)}px ${Number(item.badgeShadowBlur || 0)}px ${item.badgeShadowColor || "#0f172a66"}`
            }}
          >
            {item.badgeUseImage && item.badgeImageUrl ? (
              <img
                src={resolveBadgeUrl(item.badgeImageUrl)}
                alt="badge"
                style={{
                  width: `${Math.max(
                    10,
                    Math.round(Math.max(10, Number(item.badgeImageSize || 18) * scale))
                  )}px`,
                  height: `${Math.max(
                    10,
                    Math.round(Math.max(10, Number(item.badgeImageSize || 18) * scale))
                  )}px`,
                  objectFit: "contain",
                  marginRight: item.badgeText ? "6px" : "0"
                }}
              />
            ) : null}
            {item.badgeText}
          </span>
        )}
      </>
    );

    if (!item.linkUrl) return image;

    return (
      <a
        href={item.linkUrl}
        target={item.openInNewTab ? "_blank" : "_self"}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className="banner-link-wrap"
      >
        {image}
      </a>
    );
  };

  if (items.length === 1) {
    return (
      <div className="banner-shell" style={bannerShellStyle}>
        <div className="banner-frame" style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }}>
          <div className="banner-item">
            {renderBannerItem(items[0], 0)}
          </div>
        </div>
      </div>
    );
  }

  if (isMobileView && mobileStaticItem) {
    return (
      <div className="banner-shell" style={bannerShellStyle}>
        <div className="banner-frame" style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }}>
          <div className="banner-item banner-item--mobile-static">
            {renderBannerItem(mobileStaticItem, 0)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="banner-shell" style={bannerShellStyle}>
      <div className="banner-frame" style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }}>
        <div className="banner-carousel">
          <div
            className="banner-track"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          >
            {items.map((item, i) => (
              <div className="banner-slide" key={`${item.imageUrl}-${i}`} aria-hidden={i !== activeIndex}>
                <div className="banner-item">
                  {renderBannerItem(item, i)}
                </div>
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <>
              <button
                type="button"
                className="banner-nav banner-nav--prev"
                aria-label="Previous banner"
                onClick={() => setActiveIndex(prev => (prev - 1 + items.length) % items.length)}
              >
                &#8249;
              </button>
              <button
                type="button"
                className="banner-nav banner-nav--next"
                aria-label="Next banner"
                onClick={() => setActiveIndex(prev => (prev + 1) % items.length)}
              >
                &#8250;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
