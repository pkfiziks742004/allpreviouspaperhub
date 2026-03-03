import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const ALIGN_OPTIONS = ["left", "center", "right", "justify"];
const VARIANT_OPTIONS = ["span", "p", "h1", "h2", "h3", "h4", "h5", "h6"];

const defaultTextStyle = {
  color: "#000000",
  bold: false,
  italic: false,
  align: "left",
  variant: "p"
};

export default function HeaderSettings() {
  const [siteName, setSiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoHeight, setLogoHeight] = useState(32);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [headerColor, setHeaderColor] = useState("#0d6efd");
  const [adminHeaderColor, setAdminHeaderColor] = useState("#1d2327");
  const [siteNameStyle, setSiteNameStyle] = useState({ ...defaultTextStyle, color: "#ffffff", variant: "span" });
  const [useSplitColor, setUseSplitColor] = useState(false);
  const [siteNamePart1, setSiteNamePart1] = useState("");
  const [siteNamePart1Color, setSiteNamePart1Color] = useState("#ffffff");
  const [siteNamePart2, setSiteNamePart2] = useState("");
  const [siteNamePart2Color, setSiteNamePart2Color] = useState("#fbbf24");
  const [headerLinks, setHeaderLinks] = useState([]);
  const [headerLinkColor, setHeaderLinkColor] = useState("#ffffff");
  const [headerLinkHoverColor, setHeaderLinkHoverColor] = useState("#fbbf24");
  const [headerMenuIconColor, setHeaderMenuIconColor] = useState("#ffffff");
  const [pages, setPages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ headers: { Authorization: token } }),
    [token]
  );

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setSiteName(res.data.siteName || "");
      setLogoUrl(res.data.logoUrl || "");
      setLogoHeight(res.data.logoHeight || 32);
      setHeaderHeight(res.data.headerHeight || 56);
      setHeaderColor(res.data.headerColor || "#0d6efd");
      setAdminHeaderColor(res.data.adminHeaderColor || "#1d2327");
      setSiteNameStyle(res.data.siteNameStyle || { ...defaultTextStyle, color: "#ffffff", variant: "span" });
      setUseSplitColor(res.data.useSplitColor || false);
      setSiteNamePart1(res.data.siteNamePart1 || "");
      setSiteNamePart1Color(res.data.siteNamePart1Color || "#ffffff");
      setSiteNamePart2(res.data.siteNamePart2 || "");
      setSiteNamePart2Color(res.data.siteNamePart2Color || "#fbbf24");
      setHeaderLinks(Array.isArray(res.data.headerLinks) ? res.data.headerLinks : []);
      setHeaderLinkColor(res.data.headerLinkColor || "#ffffff");
      setHeaderLinkHoverColor(res.data.headerLinkHoverColor || "#fbbf24");
      setHeaderMenuIconColor(res.data.headerMenuIconColor || "#ffffff");
    });
    axios
      .get(`${API}/api/pages`, headers)
      .then(res => setPages(res.data || []))
      .catch(() => setPages([]));
  }, [headers]);

  const updateStyle = (style, setStyle, key, value) => {
    setStyle({ ...style, [key]: value });
  };

  const uploadLogo = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await axios.post(`${API}/api/settings/logo`, fd, headers);
      setLogoUrl(res.data.logoUrl || "");
      alert("Logo uploaded");
    } catch (err) {
      alert("Logo upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const addHeaderLink = () => {
    setHeaderLinks([...headerLinks, { label: "New Link", url: "/", newTab: false }]);
  };

  const updateHeaderLink = (idx, key, value) => {
    setHeaderLinks(headerLinks.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };

  const removeHeaderLink = idx => {
    setHeaderLinks(headerLinks.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          siteName,
          logoUrl,
          logoHeight,
          headerHeight,
          headerColor,
          adminHeaderColor,
          siteNameStyle,
          useSplitColor,
          siteNamePart1,
          siteNamePart1Color,
          siteNamePart2,
          siteNamePart2Color,
          headerLinks,
          headerLinkColor,
          headerLinkHoverColor,
          headerMenuIconColor
        },
        headers
      );
      alert("Header settings saved");
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
          <label className="form-label">Site Name {useSplitColor ? "(ignored in split color mode)" : ""}</label>
          <input
            className="form-control"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="Site name"
            disabled={useSplitColor}
          />
          {useSplitColor && <small className="text-muted d-block mt-1">In split color mode, use the text fields in Site Name Style section below</small>}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-3">Site Name Style</div>
          
          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="split-color-mode"
                checked={useSplitColor}
                onChange={e => setUseSplitColor(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="split-color-mode">
                Use Split Color Mode (Two Colors)
              </label>
            </div>
          </div>
          
          {!useSplitColor ? (
            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label">Text Color</label>
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={siteNameStyle.color || "#ffffff"}
                  onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "color", e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">Align</label>
                <select
                  className="form-select"
                  value={siteNameStyle.align || "left"}
                  onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "align", e.target.value)}
                >
                  {ALIGN_OPTIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-2">
                <label className="form-label">Variant</label>
                <select
                  className="form-select"
                  value={siteNameStyle.variant || "span"}
                  onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "variant", e.target.value)}
                >
                  {VARIANT_OPTIONS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-2 d-flex align-items-end">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="site-name-bold"
                    checked={!!siteNameStyle.bold}
                    onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "bold", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="site-name-bold">Bold</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="site-name-italic"
                    checked={!!siteNameStyle.italic}
                    onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "italic", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="site-name-italic">Italic</label>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="row mb-3">
                <div className="col-md-6 mb-2">
                  <label className="form-label">First Part Text</label>
                  <input
                    className="form-control"
                    value={siteNamePart1}
                    onChange={e => setSiteNamePart1(e.target.value)}
                    placeholder="e.g., My"
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label">First Part Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={siteNamePart1Color}
                    onChange={e => setSiteNamePart1Color(e.target.value)}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6 mb-2">
                  <label className="form-label">Second Part Text</label>
                  <input
                    className="form-control"
                    value={siteNamePart2}
                    onChange={e => setSiteNamePart2(e.target.value)}
                    placeholder="e.g., Website"
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label">Second Part Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={siteNamePart2Color}
                    onChange={e => setSiteNamePart2Color(e.target.value)}
                  />
                </div>
              </div>
              <div className="alert alert-info mb-3">
                <strong>Preview: </strong>
                <span style={{ color: siteNamePart1Color, fontWeight: siteNameStyle.bold ? "bold" : "normal", fontStyle: siteNameStyle.italic ? "italic" : "normal" }}>
                  {siteNamePart1}
                </span>
                <span style={{ color: siteNamePart2Color, fontWeight: siteNameStyle.bold ? "bold" : "normal", fontStyle: siteNameStyle.italic ? "italic" : "normal" }}>
                  {siteNamePart2}
                </span>
              </div>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <label className="form-label">Align</label>
                  <select
                    className="form-select"
                    value={siteNameStyle.align || "left"}
                    onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "align", e.target.value)}
                  >
                    {ALIGN_OPTIONS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-2 d-flex align-items-end">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="site-name-bold-split"
                      checked={!!siteNameStyle.bold}
                      onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "bold", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="site-name-bold-split">Bold</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="site-name-italic-split"
                      checked={!!siteNameStyle.italic}
                      onChange={e => updateStyle(siteNameStyle, setSiteNameStyle, "italic", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="site-name-italic-split">Italic</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Logo Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadLogo}
            disabled={uploadingLogo}
          />
          {logoUrl && (
            <div className="mt-2">
              <img src={resolveUrl(logoUrl)} alt="Logo" style={{ height: `${logoHeight}px` }} />
            </div>
          )}
          {logoUrl && (
            <div className="mt-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setLogoUrl("")}
              >
                Remove Logo
              </button>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Logo Height (px)</label>
          <input
            type="number"
            className="form-control"
            value={logoHeight}
            onChange={e => setLogoHeight(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Header Height (px)</label>
          <input
            type="number"
            className="form-control"
            value={headerHeight}
            onChange={e => setHeaderHeight(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Header Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={headerColor}
            onChange={e => setHeaderColor(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Admin Header Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={adminHeaderColor}
            onChange={e => setAdminHeaderColor(e.target.value)}
          />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Header Links</div>
            <button className="btn btn-sm btn-outline-primary" onClick={addHeaderLink}>
              Add Link
            </button>
          </div>
          <div className="row mb-2">
            <div className="col-md-3">
              <label className="form-label">Link Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={headerLinkColor}
                onChange={e => setHeaderLinkColor(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Hover Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={headerLinkHoverColor}
                onChange={e => setHeaderLinkHoverColor(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Three-Line Color (mobile)</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={headerMenuIconColor}
                onChange={e => setHeaderMenuIconColor(e.target.value)}
              />
            </div>
          </div>
          {headerLinks.length === 0 && (
            <div className="text-muted">No links added.</div>
          )}
          {headerLinks.map((link, idx) => {
            const matched = pages.find(p => link.url === `/page/${p.slug}`);
            return (
            <div key={`link-${idx}`} className="row align-items-center mb-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Label"
                  value={link.label || ""}
                  onChange={e => updateHeaderLink(idx, "label", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="/path or https://..."
                  value={link.url || ""}
                  onChange={e => updateHeaderLink(idx, "url", e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={matched ? matched.slug : ""}
                  onChange={e => {
                    const slug = e.target.value;
                    const page = pages.find(p => p.slug === slug);
                    if (!page) return;
                    updateHeaderLink(idx, "label", page.title || "Page");
                    updateHeaderLink(idx, "url", `/page/${page.slug}`);
                  }}
                >
                  <option value="">Select Page</option>
                  {pages.map(p => (
                    <option key={p._id} value={p.slug}>
                      {p.title} {p.published ? "" : "(Draft)"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`header-link-newtab-${idx}`}
                    checked={!!link.newTab}
                    onChange={e => updateHeaderLink(idx, "newTab", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={`header-link-newtab-${idx}`}>
                    New tab
                  </label>
                </div>
              </div>
              <div className="col-md-1">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeHeaderLink(idx)}
                >
                  X
                </button>
              </div>
            </div>
          );
          })}
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Header Settings"}
        </button>
      </div>
    </Layout>
  );
}

