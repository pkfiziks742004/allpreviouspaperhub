import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const createDefaultBannerItem = url => ({
  imageUrl: url || "",
  linkUrl: "",
  openInNewTab: false,
  fitMode: "cover",
  badgeEnabled: false,
  badgeText: "",
  badgeTop: 16,
  badgeLeft: 16,
  badgeBgColor: "#ef4444",
  badgeTextColor: "#ffffff",
  badgeFontSize: 14,
  badgeRadius: 8,
  badgePaddingX: 10,
  badgePaddingY: 6,
  badgeShape: "custom",
  badgeWidth: 0,
  badgeHeight: 0
});

const normalizeBannerItem = item => ({
  ...createDefaultBannerItem(item?.imageUrl || item?.src || ""),
  ...(item || {}),
  imageUrl: String(item?.imageUrl || item?.src || "").trim(),
  linkUrl: String(item?.linkUrl || "").trim(),
  fitMode: ["cover", "contain", "fill"].includes(String(item?.fitMode || "").toLowerCase())
    ? String(item.fitMode).toLowerCase()
    : "cover",
  badgeEnabled: item?.badgeEnabled !== undefined ? !!item.badgeEnabled : !!String(item?.badgeText || "").trim(),
  badgeText: String(item?.badgeText || ""),
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
});

export default function BannerSettings() {
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
  const [bannerItems, setBannerItems] = useState([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingBadgeIndex, setDraggingBadgeIndex] = useState(null);
  const [flashIndexes, setFlashIndexes] = useState([]);
  const bannerPreviewRefs = useRef({});
  const badgeRefs = useRef({});
  const bannerListRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setBannerMargin(Number(res.data.bannerMargin || 0));
      setBannerRadius(Number(res.data.bannerRadius || 0));
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        setBannerItems(res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl));
      } else {
        const fallbackImages = Array.isArray(res.data.bannerImages) ? res.data.bannerImages : [];
        setBannerItems(fallbackImages.map(url => createDefaultBannerItem(url)));
      }
    });
  }, []);

  const isBannerRatioValid = file =>
    new Promise(resolve => {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        URL.revokeObjectURL(imageUrl);
        if (!w || !h) return resolve(false);
        const ratio = w / h;
        const is16by5 = Math.abs(ratio - 16 / 5) <= 0.02;
        const is16by9 = Math.abs(ratio - 16 / 9) <= 0.02;
        resolve(is16by5 || is16by9);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(false);
      };

      img.src = imageUrl;
    });

  const uploadBanners = async e => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const ratioResults = await Promise.all(files.map(file => isBannerRatioValid(file)));
    const invalidFiles = files.filter((_, index) => !ratioResults[index]);
    if (invalidFiles.length > 0) {
      alert(
        `Only 16:5 or 16:9 banner images are allowed. Invalid file(s): ${invalidFiles
          .map(file => file.name)
          .join(", ")}`
      );
      e.target.value = "";
      return;
    }

    setUploadingBanner(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("banners", f));
      const res = await axios.post(`${API}/api/settings/banners`, fd, headers);
      let nextItems = [];
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        nextItems = res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl);
      } else {
        nextItems = (Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []).map(url => createDefaultBannerItem(url));
      }
      setBannerItems(nextItems);
      const uploadedCount = files.length;
      const start = Math.max(0, nextItems.length - uploadedCount);
      const newIndexes = Array.from({ length: uploadedCount }, (_, idx) => start + idx);
      setFlashIndexes(newIndexes);
      window.setTimeout(() => {
        bannerListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      window.setTimeout(() => setFlashIndexes([]), 2200);
      alert("Banners uploaded");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Banner upload failed";
      alert(msg);
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const removeBanner = idx => {
    setBannerItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBannerItem = (idx, key, value) => {
    setBannerItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const replaceBannerImage = async (idx, event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const isValid = await isBannerRatioValid(file);
    if (!isValid) {
      alert("Only 16:5 or 16:9 banner image is allowed.");
      event.target.value = "";
      return;
    }
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("banners", file);
      fd.append("replaceIndex", String(idx));
      const res = await axios.post(`${API}/api/settings/banners`, fd, headers);
      let nextItems = [];
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        nextItems = res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl);
      } else {
        nextItems = (Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []).map(url => createDefaultBannerItem(url));
      }
      setBannerItems(nextItems);
      setFlashIndexes([idx]);
      window.setTimeout(() => {
        bannerPreviewRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      window.setTimeout(() => setFlashIndexes([]), 1800);
      alert("Banner image updated");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Banner replace failed";
      alert(msg);
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const startBadgeDrag = (idx, event) => {
    if (!bannerItems[idx]?.badgeEnabled) return;
    event.preventDefault();

    const previewEl = bannerPreviewRefs.current[idx];
    const badgeEl = badgeRefs.current[idx];
    if (!previewEl || !badgeEl) return;

    const previewRect = previewEl.getBoundingClientRect();
    const badgeRect = badgeEl.getBoundingClientRect();
    const offsetX = event.clientX - badgeRect.left;
    const offsetY = event.clientY - badgeRect.top;

    setDraggingBadgeIndex(idx);

    const onMove = moveEvent => {
      const maxLeft = Math.max(0, previewRect.width - badgeRect.width);
      const maxTop = Math.max(0, previewRect.height - badgeRect.height);

      const nextLeft = clamp(moveEvent.clientX - previewRect.left - offsetX, 0, maxLeft);
      const nextTop = clamp(moveEvent.clientY - previewRect.top - offsetY, 0, maxTop);

      setBannerItems(prev =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                badgeLeft: Math.round(nextLeft),
                badgeTop: Math.round(nextTop)
              }
            : item
        )
      );
    };

    const onUp = () => {
      setDraggingBadgeIndex(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          bannerMargin,
          bannerRadius,
          bannerItems
        },
        headers
      );
      alert("Banner settings saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      <div className="card p-4 shadow banner-settings-card" style={{ maxWidth: "980px" }}>
        <div className="mb-3">
          <label className="form-label">Banner Margin (px)</label>
          <input
            type="number"
            className="form-control"
            value={bannerMargin}
            onChange={e => setBannerMargin(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Banner Border Radius (px)</label>
          <input
            type="number"
            className="form-control"
            value={bannerRadius}
            onChange={e => setBannerRadius(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Banner Images Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={uploadBanners}
            disabled={uploadingBanner}
          />
          <div className="form-text">
            Allowed ratios: 16:5 or 16:9 (examples: 1600x500, 1920x600, 1280x400, 1280x720, 1920x1080).
          </div>
          {bannerItems.length > 0 && (
            <div className="mt-3" ref={bannerListRef}>
              <div className="row">
                {bannerItems.map((item, i) => (
                  <div key={`${item.imageUrl}-${i}`} className="col-xl-6 col-lg-12 mb-3">
                    <div className={`card banner-item-card ${flashIndexes.includes(i) ? "banner-item-card-flash" : ""}`}>
                      <div
                        ref={el => {
                          if (el) bannerPreviewRefs.current[i] = el;
                        }}
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "220px",
                          overflow: "hidden",
                          borderTopLeftRadius: "inherit",
                          borderTopRightRadius: "inherit",
                          background: "#f6f7fb"
                        }}
                      >
                        <img
                          src={resolveUrl(item.imageUrl)}
                          className="card-img-top"
                          alt={`Banner ${i + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: item.fitMode || "cover",
                            objectPosition: "center"
                          }}
                        />
                        {item.badgeEnabled && item.badgeText && (
                          <span
                            ref={el => {
                              if (el) badgeRefs.current[i] = el;
                            }}
                            onPointerDown={e => startBadgeDrag(i, e)}
                            style={{
                              position: "absolute",
                              top: Number(item.badgeTop || 0),
                              left: Number(item.badgeLeft || 0),
                              background: item.badgeBgColor || "#ef4444",
                              color: item.badgeTextColor || "#ffffff",
                              fontSize: Number(item.badgeFontSize || 14),
                              borderRadius:
                                item.badgeShape === "pill" ? 999 :
                                  item.badgeShape === "square" ? 4 :
                                    Number(item.badgeRadius || 8),
                              padding: `${Number(item.badgePaddingY || 6)}px ${Number(item.badgePaddingX || 10)}px`,
                              lineHeight: 1.2,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: Number(item.badgeWidth || 0) > 0 ? `${Number(item.badgeWidth)}px` : "auto",
                              minHeight: Number(item.badgeHeight || 0) > 0 ? `${Number(item.badgeHeight)}px` : "auto",
                              cursor: draggingBadgeIndex === i ? "grabbing" : "grab",
                              userSelect: "none",
                              touchAction: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.22)"
                            }}
                            title="Drag to move badge"
                          >
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="card-body p-3 text-center">
                        <div className="small fw-semibold text-start mb-2">Banner #{i + 1}</div>
                        <div className="mb-2">
                          <label className="form-label small">Link URL</label>
                          <input
                            className="form-control form-control-sm"
                            value={item.linkUrl || ""}
                            onChange={e => updateBannerItem(i, "linkUrl", e.target.value)}
                            placeholder="https://example.com or /about"
                          />
                        </div>
                        <div className="form-check form-switch mb-2 text-start">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`openInNewTab-${i}`}
                            checked={!!item.openInNewTab}
                            onChange={e => updateBannerItem(i, "openInNewTab", e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor={`openInNewTab-${i}`}>
                            Open link in new tab
                          </label>
                        </div>
                        <div className="mb-2 text-start">
                          <label className="form-label small">Image Fit</label>
                          <select
                            className="form-select form-select-sm"
                            value={item.fitMode || "cover"}
                            onChange={e => updateBannerItem(i, "fitMode", e.target.value)}
                          >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="fill">Fill</option>
                          </select>
                        </div>
                        <div className="border rounded p-2 mb-2 text-start">
                          <div className="small fw-bold mb-2">Badge Overlay</div>
                          <div className="form-check form-switch mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`badgeEnabled-${i}`}
                              checked={!!item.badgeEnabled}
                              onChange={e => updateBannerItem(i, "badgeEnabled", e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor={`badgeEnabled-${i}`}>
                              Enable badge
                            </label>
                          </div>
                          <input
                            className="form-control form-control-sm mb-2"
                            value={item.badgeText || ""}
                            onChange={e => updateBannerItem(i, "badgeText", e.target.value)}
                            placeholder="Badge text"
                          />
                          <div className="form-text mb-2">Tip: Preview badge ko drag karke exact position set karein.</div>
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">Top(px)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeTop || 0)}
                                onChange={e => updateBannerItem(i, "badgeTop", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Left(px)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeLeft || 0)}
                                onChange={e => updateBannerItem(i, "badgeLeft", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Text Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeTextColor || "#ffffff"}
                                onChange={e => updateBannerItem(i, "badgeTextColor", e.target.value)}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Badge Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeBgColor || "#ef4444"}
                                onChange={e => updateBannerItem(i, "badgeBgColor", e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Font</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeFontSize || 14)}
                                onChange={e => updateBannerItem(i, "badgeFontSize", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Radius</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeRadius || 8)}
                                onChange={e => updateBannerItem(i, "badgeRadius", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Pad X</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgePaddingX || 10)}
                                onChange={e => updateBannerItem(i, "badgePaddingX", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Pad Y</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgePaddingY || 6)}
                                onChange={e => updateBannerItem(i, "badgePaddingY", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Shape</label>
                              <select
                                className="form-select form-select-sm"
                                value={item.badgeShape || "custom"}
                                onChange={e => updateBannerItem(i, "badgeShape", e.target.value)}
                              >
                                <option value="custom">Custom Radius</option>
                                <option value="pill">Pill</option>
                                <option value="square">Square</option>
                              </select>
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Width</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeWidth || 0)}
                                onChange={e => updateBannerItem(i, "badgeWidth", Number(e.target.value || 0))}
                                placeholder="Auto"
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Height</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeHeight || 0)}
                                onChange={e => updateBannerItem(i, "badgeHeight", Number(e.target.value || 0))}
                                placeholder="Auto"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                          <label className="btn btn-sm btn-outline-primary mb-0">
                            Update
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => replaceBannerImage(i, e)}
                              disabled={uploadingBanner}
                            />
                          </label>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeBanner(i)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-text">Remove applies after Save Settings.</div>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Banner Settings"}
        </button>
      </div>
    </Layout>
  );
}

