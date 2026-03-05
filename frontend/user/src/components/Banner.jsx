import { useEffect, useState } from "react";
import axios from "axios";
import { Carousel } from "react-bootstrap";
import { API_BASE, resolveApiUrl } from "../config/api";

export default function Banner() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
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
              badgeShape: ["custom", "pill", "square"].includes(String(item?.badgeShape || "").toLowerCase())
                ? String(item.badgeShape).toLowerCase()
                : "custom",
              badgeWidth: Number.isFinite(Number(item?.badgeWidth)) ? Number(item.badgeWidth) : 0,
              badgeHeight: Number.isFinite(Number(item?.badgeHeight)) ? Number(item.badgeHeight) : 0
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
    const image = (
      <>
        <img
          className="d-block w-100 banner-img"
          src={resolveUrl(item.imageUrl)}
          alt={`Banner ${index + 1}`}
          loading="lazy"
          style={{ objectFit: item.fitMode || "cover" }}
        />
        {item.badgeEnabled && item.badgeText && (
          <span
            className="banner-badge"
            style={{
              top: `${item.badgeTop}px`,
              left: `${item.badgeLeft}px`,
              background: item.badgeBgColor,
              color: item.badgeTextColor,
              fontSize: `${item.badgeFontSize}px`,
              borderRadius:
                item.badgeShape === "pill" ? "999px" :
                  item.badgeShape === "square" ? "4px" :
                    `${item.badgeRadius}px`,
              padding: `${item.badgePaddingY}px ${item.badgePaddingX}px`,
              width: item.badgeWidth > 0 ? `${item.badgeWidth}px` : "auto",
              minHeight: item.badgeHeight > 0 ? `${item.badgeHeight}px` : "auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
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
