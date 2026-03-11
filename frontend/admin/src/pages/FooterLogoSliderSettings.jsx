import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

const createFooterLogoSliderItem = url => ({
  imageUrl: url || "",
  name: "",
  linkUrl: "",
  openInNewTab: true
});

export default function FooterLogoSliderSettings() {
  const [footerLogoSliderEnabled, setFooterLogoSliderEnabled] = useState(false);
  const [footerLogoSliderTitle, setFooterLogoSliderTitle] = useState("Featured Universities & Partners");
  const [footerLogoSliderBgColor, setFooterLogoSliderBgColor] = useState("#06141f");
  const [footerLogoSliderTextColor, setFooterLogoSliderTextColor] = useState("#e2e8f0");
  const [footerLogoSliderTrackBgColor, setFooterLogoSliderTrackBgColor] = useState("rgba(255,255,255,0.06)");
  const [footerLogoSliderSpeed, setFooterLogoSliderSpeed] = useState(28);
  const [footerLogoSliderLogoHeight, setFooterLogoSliderLogoHeight] = useState(42);
  const [footerLogoSliderPauseOnHover, setFooterLogoSliderPauseOnHover] = useState(true);
  const [footerLogoSliderItems, setFooterLogoSliderItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({
      headers: {
        Authorization: token
      }
    }),
    [token]
  );

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setFooterLogoSliderEnabled(!!res.data.footerLogoSliderEnabled);
      setFooterLogoSliderTitle(res.data.footerLogoSliderTitle || "Featured Universities & Partners");
      setFooterLogoSliderBgColor(res.data.footerLogoSliderBgColor || "#06141f");
      setFooterLogoSliderTextColor(res.data.footerLogoSliderTextColor || "#e2e8f0");
      setFooterLogoSliderTrackBgColor(res.data.footerLogoSliderTrackBgColor || "rgba(255,255,255,0.06)");
      setFooterLogoSliderSpeed(Number(res.data.footerLogoSliderSpeed || 28));
      setFooterLogoSliderLogoHeight(Number(res.data.footerLogoSliderLogoHeight || 42));
      setFooterLogoSliderPauseOnHover(
        res.data.footerLogoSliderPauseOnHover !== undefined
          ? !!res.data.footerLogoSliderPauseOnHover
          : true
      );
      setFooterLogoSliderItems(
        Array.isArray(res.data.footerLogoSliderItems)
          ? res.data.footerLogoSliderItems.map(item => ({
              ...createFooterLogoSliderItem(item?.imageUrl || ""),
              ...(item || {})
            }))
          : []
      );
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          footerLogoSliderEnabled,
          footerLogoSliderTitle,
          footerLogoSliderBgColor,
          footerLogoSliderTextColor,
          footerLogoSliderTrackBgColor,
          footerLogoSliderSpeed,
          footerLogoSliderLogoHeight,
          footerLogoSliderPauseOnHover,
          footerLogoSliderItems
        },
        headers
      );
      alert("Footer running logo slider saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const uploadFooterLogoSliderItems = async e => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(file => fd.append("footerSliderItems", file));
      const res = await axios.post(`${API}/api/settings/footer-slider-items`, fd, headers);
      setFooterLogoSliderItems(
        Array.isArray(res.data.footerLogoSliderItems)
          ? res.data.footerLogoSliderItems.map(item => ({
              ...createFooterLogoSliderItem(item?.imageUrl || ""),
              ...(item || {})
            }))
          : []
      );
      setFooterLogoSliderEnabled(true);
      alert("Slider images uploaded");
    } catch (err) {
      alert("Slider upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addFooterLogoSliderItem = () => {
    setFooterLogoSliderItems([...footerLogoSliderItems, createFooterLogoSliderItem("")]);
  };

  const updateFooterLogoSliderItem = (idx, key, value) => {
    setFooterLogoSliderItems(
      footerLogoSliderItems.map((item, itemIdx) =>
        itemIdx === idx ? { ...item, [key]: value } : item
      )
    );
  };

  const removeFooterLogoSliderItem = idx => {
    setFooterLogoSliderItems(footerLogoSliderItems.filter((_, itemIdx) => itemIdx !== idx));
  };

  const moveFooterLogoSliderItem = (idx, direction) => {
    const nextIndex = idx + direction;
    if (nextIndex < 0 || nextIndex >= footerLogoSliderItems.length) return;
    const nextItems = [...footerLogoSliderItems];
    const [current] = nextItems.splice(idx, 1);
    nextItems.splice(nextIndex, 0, current);
    setFooterLogoSliderItems(nextItems);
  };

  return (
    <Layout>
      <div className="card p-4 shadow" style={{ maxWidth: "960px" }}>
        <div className="mb-3">
          <div className="fw-bold mb-1">Footer Running Logo Slider</div>
          <div className="text-muted">
            Ye slider website ke footer ke upar company, university ya partner logos ko continuous strip me dikhayega.
          </div>
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="footer-logo-slider-enabled"
            checked={footerLogoSliderEnabled}
            onChange={e => setFooterLogoSliderEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="footer-logo-slider-enabled">
            Enable running logo slider
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Slider Title</label>
          <input
            className="form-control"
            value={footerLogoSliderTitle}
            onChange={e => setFooterLogoSliderTitle(e.target.value)}
            placeholder="Featured Universities & Partners"
          />
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Section Background</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={footerLogoSliderBgColor}
              onChange={e => setFooterLogoSliderBgColor(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Text Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={footerLogoSliderTextColor}
              onChange={e => setFooterLogoSliderTextColor(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Track Background</label>
            <input
              className="form-control"
              value={footerLogoSliderTrackBgColor}
              onChange={e => setFooterLogoSliderTrackBgColor(e.target.value)}
              placeholder="rgba(255,255,255,0.06)"
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Speed (seconds per loop)</label>
            <input
              type="number"
              min="8"
              max="120"
              className="form-control"
              value={footerLogoSliderSpeed}
              onChange={e => setFooterLogoSliderSpeed(Number(e.target.value || 0))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Logo Height (px)</label>
            <input
              type="number"
              min="24"
              max="96"
              className="form-control"
              value={footerLogoSliderLogoHeight}
              onChange={e => setFooterLogoSliderLogoHeight(Number(e.target.value || 0))}
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="footer-logo-slider-pause"
                checked={footerLogoSliderPauseOnHover}
                onChange={e => setFooterLogoSliderPauseOnHover(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="footer-logo-slider-pause">
                Pause on hover
              </label>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="fw-bold">Slider Items</div>
            <button className="btn btn-sm btn-outline-primary" onClick={addFooterLogoSliderItem}>
              Add Empty Item
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Logo Images</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={uploadFooterLogoSliderItems}
              disabled={uploading}
            />
            <div className="form-text">
              Aap company, university, board ya partner logos yahan upload kar sakte ho.
            </div>
          </div>

          {footerLogoSliderItems.length === 0 && (
            <div className="text-muted">Abhi koi slider item add nahi hai.</div>
          )}

          {footerLogoSliderItems.map((item, idx) => (
            <div key={`footer-logo-slider-item-${idx}`} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">Slider Item #{idx + 1}</div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => moveFooterLogoSliderItem(idx, -1)}
                    disabled={idx === 0}
                  >
                    Up
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => moveFooterLogoSliderItem(idx, 1)}
                    disabled={idx === footerLogoSliderItems.length - 1}
                  >
                    Down
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeFooterLogoSliderItem(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-2">
                  <label className="form-label">Image URL</label>
                  <input
                    className="form-control"
                    value={item.imageUrl || ""}
                    onChange={e => updateFooterLogoSliderItem(idx, "imageUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-md-3 mb-2">
                  <label className="form-label">Display Name</label>
                  <input
                    className="form-control"
                    value={item.name || ""}
                    onChange={e => updateFooterLogoSliderItem(idx, "name", e.target.value)}
                    placeholder="e.g. UMANG"
                  />
                </div>
                <div className="col-md-4 mb-2">
                  <label className="form-label">Clickable Link</label>
                  <input
                    className="form-control"
                    value={item.linkUrl || ""}
                    onChange={e => updateFooterLogoSliderItem(idx, "linkUrl", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="col-md-1 mb-2 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={item.openInNewTab !== false}
                      onChange={e => updateFooterLogoSliderItem(idx, "openInNewTab", e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-text mb-2">Last checkbox = open link in new tab.</div>

              {item.imageUrl && (
                <div className="mt-2">
                  <img
                    src={resolveUrl(item.imageUrl)}
                    alt={item.name || `slider-item-${idx + 1}`}
                    style={{ height: `${Math.max(28, Number(footerLogoSliderLogoHeight || 42))}px`, width: "auto" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Footer Running Logo Slider"}
        </button>
      </div>
    </Layout>
  );
}
