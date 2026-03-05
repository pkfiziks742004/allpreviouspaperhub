import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Carousel } from "react-bootstrap";
import { API_BASE, resolveApiUrl } from "../config/api";

const BADGE_SHAPE_SET = new Set([
  "custom", "pill", "square", "rounded-square", "soft-rounded", "notch",
  "chevron-right", "chevron-left", "diamond", "hexagon", "octagon", "triangle-up",
  "triangle-down", "triangle-left", "triangle-right", "parallelogram-right",
  "parallelogram-left", "tag-right", "tag-left", "message", "bookmark", "ticket",
  "ribbon", "star-5", "star-6", "star-8", "burst-12", "burst-16", "circle",
  "ellipse", "leaf", "egg", "cloud", "heart", "shield", "drop", "arrow-right",
  "arrow-left", "arrow-up", "arrow-down", "house", "pentagon", "cross", "plus",
  "x-shape", "trapezoid", "frame", "bevel", "cut-corners", "slant-top",
  "slant-bottom", "wave-top", "wave-bottom", "blob-1", "blob-2"
]);
const SHAPE_3D_BASES = new Set([
  "pill", "square", "diamond", "hexagon", "octagon", "tag-right", "tag-left", "message", "shield", "star-5"
]);

const BADGE_SHAPE_CLIP_PATH = {
  notch: "polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%, 8% 50%)",
  "chevron-right": "polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%, 10% 50%)",
  "chevron-left": "polygon(18% 0, 100% 0, 90% 50%, 100% 100%, 18% 100%, 0 50%)",
  diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
  hexagon: "polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%)",
  octagon: "polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)",
  "triangle-up": "polygon(50% 0, 100% 100%, 0 100%)",
  "triangle-down": "polygon(0 0, 100% 0, 50% 100%)",
  "triangle-left": "polygon(0 50%, 100% 0, 100% 100%)",
  "triangle-right": "polygon(0 0, 100% 50%, 0 100%)",
  "parallelogram-right": "polygon(12% 0, 100% 0, 88% 100%, 0 100%)",
  "parallelogram-left": "polygon(0 0, 88% 0, 100% 100%, 12% 100%)",
  "tag-right": "polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%)",
  "tag-left": "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)",
  message: "polygon(0 0, 100% 0, 100% 75%, 60% 75%, 50% 100%, 40% 75%, 0 75%)",
  bookmark: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
  ticket: "polygon(0 18%, 8% 18%, 8% 0, 92% 0, 92% 18%, 100% 18%, 100% 82%, 92% 82%, 92% 100%, 8% 100%, 8% 82%, 0 82%)",
  ribbon: "polygon(0 0, 100% 0, 92% 100%, 50% 80%, 8% 100%)",
  "star-5": "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  "star-6": "polygon(50% 0, 62% 25%, 88% 25%, 75% 50%, 88% 75%, 62% 75%, 50% 100%, 38% 75%, 12% 75%, 25% 50%, 12% 25%, 38% 25%)",
  "star-8": "polygon(50% 0, 60% 22%, 82% 18%, 78% 40%, 100% 50%, 78% 60%, 82% 82%, 60% 78%, 50% 100%, 40% 78%, 18% 82%, 22% 60%, 0 50%, 22% 40%, 18% 18%, 40% 22%)",
  "burst-12": "polygon(50% 0, 60% 15%, 75% 6%, 78% 24%, 94% 25%, 85% 40%, 100% 50%, 85% 60%, 94% 75%, 78% 76%, 75% 94%, 60% 85%, 50% 100%, 40% 85%, 25% 94%, 22% 76%, 6% 75%, 15% 60%, 0 50%, 15% 40%, 6% 25%, 22% 24%, 25% 6%, 40% 15%)",
  "burst-16": "polygon(50% 0, 57% 12%, 67% 3%, 71% 16%, 84% 9%, 84% 24%, 97% 21%, 91% 34%, 100% 43%, 88% 50%, 100% 57%, 91% 66%, 97% 79%, 84% 76%, 84% 91%, 71% 84%, 67% 97%, 57% 88%, 50% 100%, 43% 88%, 33% 97%, 29% 84%, 16% 91%, 16% 76%, 3% 79%, 9% 66%, 0 57%, 12% 50%, 0 43%, 9% 34%, 3% 21%, 16% 24%, 16% 9%, 29% 16%, 33% 3%, 43% 12%)",
  circle: "circle(50% at 50% 50%)",
  ellipse: "ellipse(48% 38% at 50% 50%)",
  leaf: "polygon(50% 0, 80% 12%, 100% 40%, 86% 78%, 50% 100%, 14% 78%, 0 40%, 20% 12%)",
  egg: "ellipse(44% 48% at 50% 52%)",
  cloud: "polygon(12% 68%, 10% 48%, 24% 36%, 38% 38%, 46% 24%, 62% 20%, 76% 30%, 88% 28%, 98% 44%, 94% 66%, 82% 78%, 18% 82%)",
  heart: "polygon(50% 92%, 8% 52%, 8% 28%, 24% 10%, 40% 12%, 50% 26%, 60% 12%, 76% 10%, 92% 28%, 92% 52%)",
  shield: "polygon(50% 0, 90% 12%, 90% 55%, 50% 100%, 10% 55%, 10% 12%)",
  drop: "polygon(50% 0, 80% 24%, 92% 50%, 82% 76%, 50% 100%, 18% 76%, 8% 50%, 20% 24%)",
  "arrow-right": "polygon(0 20%, 66% 20%, 66% 0, 100% 50%, 66% 100%, 66% 80%, 0 80%)",
  "arrow-left": "polygon(34% 0, 34% 20%, 100% 20%, 100% 80%, 34% 80%, 34% 100%, 0 50%)",
  "arrow-up": "polygon(50% 0, 100% 34%, 80% 34%, 80% 100%, 20% 100%, 20% 34%, 0 34%)",
  "arrow-down": "polygon(20% 0, 80% 0, 80% 66%, 100% 66%, 50% 100%, 0 66%, 20% 66%)",
  house: "polygon(50% 0, 100% 40%, 88% 40%, 88% 100%, 12% 100%, 12% 40%, 0 40%)",
  pentagon: "polygon(50% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%)",
  cross: "polygon(30% 0, 70% 0, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0 70%, 0 30%, 30% 30%)",
  plus: "polygon(42% 0, 58% 0, 58% 42%, 100% 42%, 100% 58%, 58% 58%, 58% 100%, 42% 100%, 42% 58%, 0 58%, 0 42%, 42% 42%)",
  "x-shape": "polygon(12% 0, 50% 30%, 88% 0, 100% 12%, 70% 50%, 100% 88%, 88% 100%, 50% 70%, 12% 100%, 0 88%, 30% 50%, 0 12%)",
  trapezoid: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)",
  frame: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 84%, 84% 84%, 84% 16%, 16% 16%, 16% 84%, 0 84%)",
  bevel: "polygon(10% 0, 90% 0, 100% 12%, 100% 88%, 90% 100%, 10% 100%, 0 88%, 0 12%)",
  "cut-corners": "polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)",
  "slant-top": "polygon(0 12%, 100% 0, 100% 100%, 0 100%)",
  "slant-bottom": "polygon(0 0, 100% 0, 100% 88%, 0 100%)",
  "wave-top": "polygon(0 20%, 14% 10%, 28% 20%, 42% 10%, 57% 20%, 71% 10%, 85% 20%, 100% 10%, 100% 100%, 0 100%)",
  "wave-bottom": "polygon(0 0, 100% 0, 100% 80%, 86% 90%, 72% 80%, 58% 90%, 43% 80%, 29% 90%, 15% 80%, 0 90%)",
  "blob-1": "polygon(18% 8%, 48% 2%, 78% 10%, 96% 34%, 90% 68%, 68% 92%, 34% 98%, 8% 78%, 4% 42%)",
  "blob-2": "polygon(10% 26%, 30% 6%, 64% 2%, 90% 20%, 98% 54%, 82% 84%, 50% 98%, 20% 90%, 2% 62%)"
};

const BADGE_3D_STYLE_PRESETS = {
  "1": { backgroundImage: "linear-gradient(165deg, #ffffff55, #00000020)", filter: "saturate(1.06)" },
  "2": { backgroundImage: "linear-gradient(160deg, #ffffff88, #ffffff22 35%, #00000038)", filter: "contrast(1.05)" },
  "3": { backgroundImage: "linear-gradient(170deg, #f8fafc66, #94a3b833 46%, #0f172a55)", filter: "saturate(0.92)" },
  "4": { backgroundImage: "linear-gradient(170deg, #ffffff66, #67e8f933 45%, #0ea5e94d)", filter: "brightness(1.05)" },
  "5": { backgroundImage: "linear-gradient(175deg, #00000000, #0000004f 68%, #00000077)", filter: "contrast(1.06)" }
};

const parse3dShape = shape => {
  const match = String(shape || "").match(/^3d-([a-z0-9-]+)-([1-5])$/);
  if (!match) return null;
  if (!SHAPE_3D_BASES.has(match[1])) return null;
  return { baseShape: match[1], variant: match[2] };
};

const isValidBadgeShape = shape => {
  const normalized = String(shape || "").toLowerCase().trim();
  return BADGE_SHAPE_SET.has(normalized) || !!parse3dShape(normalized);
};

const getBadgeShapeStyle = (shape, radius) => {
  const parsed3d = parse3dShape(shape);
  if (parsed3d) {
    const baseStyle = getBadgeShapeStyle(parsed3d.baseShape, radius);
    return {
      ...baseStyle,
      ...(BADGE_3D_STYLE_PRESETS[parsed3d.variant] || BADGE_3D_STYLE_PRESETS["1"]),
      borderColor: "#ffffff55"
    };
  }
  if (shape === "pill") return { borderRadius: "999px" };
  if (shape === "square") return { borderRadius: "4px" };
  if (shape === "rounded-square") return { borderRadius: "16px" };
  if (shape === "soft-rounded") return { borderRadius: "24px" };
  if (shape === "custom") return { borderRadius: `${Number(radius || 8)}px` };
  return { borderRadius: "0", clipPath: BADGE_SHAPE_CLIP_PATH[shape] || "none" };
};

export default function Banner() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
  const [badgeScaleMap, setBadgeScaleMap] = useState({});
  const bannerImageRefs = useRef({});
  const safeMargin = Math.max(0, Number(bannerMargin || 0));

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/settings`)
      .then(res => {
        const rawItems =
          Array.isArray(res.data?.bannerItems) && res.data.bannerItems.length > 0
            ? res.data.bannerItems
            : (Array.isArray(res.data?.bannerImages) ? res.data.bannerImages.map(src => ({ imageUrl: src })) : []);
        const normalized = rawItems
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
              badgeBgColor: item?.badgeBgColor || "#ef4444",
              badgeTextColor: item?.badgeTextColor || "#ffffff",
              badgeFontSize: Number.isFinite(Number(item?.badgeFontSize)) ? Number(item.badgeFontSize) : 14,
              badgeRadius: Number.isFinite(Number(item?.badgeRadius)) ? Number(item.badgeRadius) : 8,
              badgePaddingX: Number.isFinite(Number(item?.badgePaddingX)) ? Number(item.badgePaddingX) : 10,
              badgePaddingY: Number.isFinite(Number(item?.badgePaddingY)) ? Number(item.badgePaddingY) : 6,
              badgeShape: isValidBadgeShape(String(item?.badgeShape || "").toLowerCase())
                ? String(item.badgeShape).toLowerCase()
                : "custom",
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
        setItems(normalized);
        if (res.data && res.data.bannerMargin !== undefined) {
          setBannerMargin(Number(res.data.bannerMargin || 0));
        }
        if (res.data && res.data.bannerRadius !== undefined) {
          setBannerRadius(Number(res.data.bannerRadius || 0));
        }
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
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
  }, [items]);

  if (!ready || items.length === 0) return null;

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
    const image = (
      <>
        <img
          ref={el => {
            bannerImageRefs.current[index] = el;
          }}
          className="d-block w-100 banner-img"
          src={resolveUrl(item.imageUrl)}
          alt={`Banner ${index + 1}`}
          loading="lazy"
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
              top: `clamp(4px, ${Math.round(Math.max(0, Number(item.badgeTop || 0)) * scale)}px, calc(100% - 24px))`,
              left: `clamp(4px, ${Math.round(Math.max(0, Number(item.badgeLeft || 0)) * scale)}px, calc(100% - 24px))`,
              fontSize: `${Math.max(10, Math.round(Math.max(10, Number(item.badgeFontSize || 14)) * scale))}px`,
              padding: `${Math.max(4, Math.round(Math.max(4, Number(item.badgePaddingY || 6)) * scale))}px ${Math.max(
                6,
                Math.round(Math.max(6, Number(item.badgePaddingX || 10)) * scale)
              )}px`,
              background: item.badgeBgColor,
              color: item.badgeTextColor,
              ...getBadgeShapeStyle(item.badgeShape || "custom", item.badgeRadius),
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
                src={resolveUrl(item.badgeImageUrl)}
                alt="badge"
                style={{
                  width: `${Math.max(
                    10,
                    Math.round(Math.max(10, Number(item.badgeImageSize || 18)) * scale)
                  )}px`,
                  height: `${Math.max(
                    10,
                    Math.round(Math.max(10, Number(item.badgeImageSize || 18)) * scale)
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
        rel={item.openInNewTab ? "noreferrer" : undefined}
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

  return (
    <div className="banner-shell" style={bannerShellStyle}>
      <div className="banner-frame" style={{ borderRadius: `${bannerRadius}px`, overflow: "hidden" }}>
        <Carousel interval={3000} pause={false} indicators={false} controls={items.length > 1}>
          {items.map((item, i) => (
            <Carousel.Item key={`${item.imageUrl}-${i}`}>
              <div className="banner-item">
                {renderBannerItem(item, i)}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
