import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function BannerSettings() {
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
  const [bannerItems, setBannerItems] = useState([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingBadgeIndex, setDraggingBadgeIndex] = useState(null);
  const bannerPreviewRefs = useRef({});
  const badgeRefs = useRef({});

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
        setBannerItems(
          res.data.bannerItems.map(item => ({
            imageUrl: item.imageUrl || "",
            linkUrl: item.linkUrl || "",
            openInNewTab: !!item.openInNewTab,
            fitMode: item.fitMode || "cover",
            badgeEnabled: item.badgeEnabled !== false,
            badgeText: item.badgeText || "",
            badgeTop: Number(item.badgeTop || 16),
            badgeLeft: Number(item.badgeLeft || 16),
            badgeBgColor: item.badgeBgColor || "#ef4444",
            badgeTextColor: item.badgeTextColor || "#ffffff",
            badgeFontSize: Number(item.badgeFontSize || 14),
            badgeRadius: Number(item.badgeRadius || 8),
            badgePaddingX: Number(item.badgePaddingX || 10),
            badgePaddingY: Number(item.badgePaddingY || 6)
          }))
        );
      } else {
        const fallbackImages = Array.isArray(res.data.bannerImages) ? res.data.bannerImages : [];
        setBannerItems(
          fallbackImages.map(url => ({
            imageUrl: url,
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
            badgePaddingY: 6
          }))
        );
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
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        setBannerItems(res.data.bannerItems);
      } else {
        setBannerItems(
          (Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []).map(url => ({
            imageUrl: url,
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
            badgePaddingY: 6
          }))
        );
      }
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

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
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
            <div className="mt-3">
              <div className="row">
                {bannerItems.map((item, i) => (
                  <div key={`${item.imageUrl}-${i}`} className="col-md-6 mb-3">
                    <div className="card">
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
                              borderRadius: Number(item.badgeRadius || 8),
                              padding: `${Number(item.badgePaddingY || 6)}px ${Number(item.badgePaddingX || 10)}px`,
                              lineHeight: 1.2,
                              fontWeight: 600,
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
                      <div className="card-body p-2 text-center">
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
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeBanner(i)}
                        >
                          Remove
                        </button>
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

