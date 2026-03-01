import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const defaultTextStyle = {
  color: "#000000",
  bold: false,
  italic: false,
  align: "left",
  variant: "p"
};

export default function FooterSettings() {
  const [footerText, setFooterText] = useState("");
  const [footerStyle, setFooterStyle] = useState({ ...defaultTextStyle, color: "#ffffff", align: "center" });
  const [footerUseSplitColor, setFooterUseSplitColor] = useState(false);
  const [footerNamePart1, setFooterNamePart1] = useState("");
  const [footerNamePart1Color, setFooterNamePart1Color] = useState("#ffffff");
  const [footerNamePart2, setFooterNamePart2] = useState("");
  const [footerNamePart2Color, setFooterNamePart2Color] = useState("#fbbf24");
  const [footerBgColor, setFooterBgColor] = useState("#212529");
  const [footerBgImage, setFooterBgImage] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerLogoHeight, setFooterLogoHeight] = useState(32);
  const [footerLogoAlign, setFooterLogoAlign] = useState("left");
  const [footerSocialIcons, setFooterSocialIcons] = useState([]);
  const [footerSocialIconSize, setFooterSocialIconSize] = useState(36);
  const [footerSocialIconRadius, setFooterSocialIconRadius] = useState(10);
  const [footerSocialIconBgColor, setFooterSocialIconBgColor] = useState("#ffffff");
  const [footerSocialIconBorderColor, setFooterSocialIconBorderColor] = useState("#ffffff00");
  const [footerSocialIconBorderWidth, setFooterSocialIconBorderWidth] = useState(0);
  const [footerColumns, setFooterColumns] = useState([]);
  const [footerLinkFontSize, setFooterLinkFontSize] = useState(14);
  const [footerContactTitle, setFooterContactTitle] = useState("Contact");
  const [footerContactLines, setFooterContactLines] = useState("");
  const [footerContactTextStyle, setFooterContactTextStyle] = useState({ color: "#ffffff", bold: false, italic: false, size: 14 });
  const [footerRatingNoteTitle, setFooterRatingNoteTitle] = useState("");
  const [footerRatingNoteText, setFooterRatingNoteText] = useState("");
  const [footerRatingNoteLink, setFooterRatingNoteLink] = useState("");
  const [footerRatingNoteBgColor, setFooterRatingNoteBgColor] = useState("rgba(255,255,255,0.08)");
  const [footerRatingNoteTextColor, setFooterRatingNoteTextColor] = useState("#ffffff");
  const [copyrightEnabled, setCopyrightEnabled] = useState(false);
  const [copyrightText, setCopyrightText] = useState("");
  const [copyrightColor, setCopyrightColor] = useState("#f8f9fa");
  const [copyrightTextColor, setCopyrightTextColor] = useState("#000000");
  const [copyrightHeight, setCopyrightHeight] = useState(32);
  const [copyrightFontSize, setCopyrightFontSize] = useState(14);
  const [saving, setSaving] = useState(false);
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false);
  const [uploadingFooterBg, setUploadingFooterBg] = useState(false);
  const [uploadingFooterIcons, setUploadingFooterIcons] = useState(false);
  const [pages, setPages] = useState([]);

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
      setFooterText(res.data.footerText || "");
      setFooterStyle(res.data.footerStyle || { ...defaultTextStyle, color: "#ffffff", align: "center" });
      setFooterUseSplitColor(!!res.data.footerUseSplitColor);
      setFooterNamePart1(res.data.footerNamePart1 || "");
      setFooterNamePart1Color(res.data.footerNamePart1Color || "#ffffff");
      setFooterNamePart2(res.data.footerNamePart2 || "");
      setFooterNamePart2Color(res.data.footerNamePart2Color || "#fbbf24");
      setFooterBgColor(res.data.footerBgColor || "#212529");
      setFooterBgImage(res.data.footerBgImage || "");
      setFooterLogoUrl(res.data.footerLogoUrl || "");
      setFooterLogoHeight(res.data.footerLogoHeight || 32);
      setFooterLogoAlign(res.data.footerLogoAlign || "left");
      setFooterSocialIcons(Array.isArray(res.data.footerSocialIcons) ? res.data.footerSocialIcons : []);
      setFooterSocialIconSize(res.data.footerSocialIconSize || 36);
      setFooterSocialIconRadius(res.data.footerSocialIconRadius || 10);
      setFooterSocialIconBgColor(res.data.footerSocialIconBgColor || "#ffffff");
      setFooterSocialIconBorderColor(res.data.footerSocialIconBorderColor || "#ffffff00");
      setFooterSocialIconBorderWidth(res.data.footerSocialIconBorderWidth || 0);
      setFooterColumns(Array.isArray(res.data.footerColumns) ? res.data.footerColumns : []);
      setFooterLinkFontSize(res.data.footerLinkFontSize || 14);
      setFooterContactTitle(res.data.footerContactTitle || "Contact");
      setFooterContactLines(
        Array.isArray(res.data.footerContactLines)
          ? res.data.footerContactLines.join("\n")
          : ""
      );
      setFooterContactTextStyle(res.data.footerContactTextStyle || { color: "#ffffff", bold: false, italic: false, size: 14 });
      setFooterRatingNoteTitle(res.data.footerRatingNoteTitle || "");
      setFooterRatingNoteText(res.data.footerRatingNoteText || "");
      setFooterRatingNoteLink(res.data.footerRatingNoteLink || "");
      setFooterRatingNoteBgColor(res.data.footerRatingNoteBgColor || "rgba(255,255,255,0.08)");
      setFooterRatingNoteTextColor(res.data.footerRatingNoteTextColor || "#ffffff");
      setCopyrightEnabled(!!res.data.copyrightEnabled);
      setCopyrightText(res.data.copyrightText || "");
      setCopyrightColor(res.data.copyrightColor || "#f8f9fa");
      setCopyrightTextColor(res.data.copyrightTextColor || "#000000");
      setCopyrightHeight(res.data.copyrightHeight || 32);
      setCopyrightFontSize(res.data.copyrightFontSize || 14);
    });
    axios
      .get(`${API}/api/pages`, headers)
      .then(res => setPages(res.data || []))
      .catch(() => setPages([]));
  }, [headers]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          footerText,
          footerStyle,
          footerUseSplitColor,
          footerNamePart1,
          footerNamePart1Color,
          footerNamePart2,
          footerNamePart2Color,
          footerBgColor,
          footerBgImage,
          footerLogoUrl,
          footerLogoHeight,
          footerLogoAlign,
          footerSocialIcons,
          footerSocialIconSize,
          footerSocialIconRadius,
          footerSocialIconBgColor,
          footerSocialIconBorderColor,
          footerSocialIconBorderWidth,
          footerColumns,
          footerLinkFontSize,
          footerContactTitle,
          footerContactLines: footerContactLines
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean),
          footerContactTextStyle,
          footerRatingNoteTitle,
          footerRatingNoteText,
          footerRatingNoteLink,
          footerRatingNoteBgColor,
          footerRatingNoteTextColor,
          copyrightEnabled,
          copyrightText,
          copyrightColor,
          copyrightTextColor,
          copyrightHeight,
          copyrightFontSize
        },
        headers
      );
      alert("Footer settings saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const uploadFooterLogo = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingFooterLogo(true);
    try {
      const fd = new FormData();
      fd.append("footerLogo", file);
      const res = await axios.post(`${API}/api/settings/footer-logo`, fd, headers);
      setFooterLogoUrl(res.data.footerLogoUrl || "");
      alert("Footer logo uploaded");
    } catch (err) {
      alert("Footer logo upload failed");
    } finally {
      setUploadingFooterLogo(false);
      e.target.value = "";
    }
  };

  const uploadFooterBg = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingFooterBg(true);
    try {
      const fd = new FormData();
      fd.append("footerBg", file);
      const res = await axios.post(`${API}/api/settings/footer-bg`, fd, headers);
      setFooterBgImage(res.data.footerBgImage || "");
      alert("Footer background uploaded");
    } catch (err) {
      alert("Footer background upload failed");
    } finally {
      setUploadingFooterBg(false);
      e.target.value = "";
    }
  };

  const uploadFooterIcons = async e => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setUploadingFooterIcons(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("footerIcons", f));
      const res = await axios.post(`${API}/api/settings/footer-icons`, fd, headers);
      setFooterSocialIcons(Array.isArray(res.data.footerSocialIcons) ? res.data.footerSocialIcons : []);
      alert("Footer icons uploaded");
    } catch (err) {
      alert("Footer icons upload failed");
    } finally {
      setUploadingFooterIcons(false);
      e.target.value = "";
    }
  };

  const addFooterColumn = () => {
    setFooterColumns([...footerColumns, { title: "Column", links: [] }]);
  };

  const updateFooterColumn = (idx, key, value) => {
    setFooterColumns(footerColumns.map((c, i) => i === idx ? { ...c, [key]: value } : c));
  };

  const removeFooterColumn = idx => {
    setFooterColumns(footerColumns.filter((_, i) => i !== idx));
  };

  const addFooterLink = idx => {
    const next = footerColumns.map((c, i) => {
      if (i !== idx) return c;
      return { ...c, links: [...(c.links || []), { label: "Link", url: "" }] };
    });
    setFooterColumns(next);
  };

  const updateFooterLink = (colIdx, linkIdx, key, value) => {
    const next = footerColumns.map((c, i) => {
      if (i !== colIdx) return c;
      const links = (c.links || []).map((l, j) => j === linkIdx ? { ...l, [key]: value } : l);
      return { ...c, links };
    });
    setFooterColumns(next);
  };

  const removeFooterLink = (colIdx, linkIdx) => {
    const next = footerColumns.map((c, i) => {
      if (i !== colIdx) return c;
      const links = (c.links || []).filter((_, j) => j !== linkIdx);
      return { ...c, links };
    });
    setFooterColumns(next);
  };

  const addFooterIcon = () => {
    setFooterSocialIcons([...footerSocialIcons, { imageUrl: "", link: "" }]);
  };

  const updateFooterIcon = (idx, key, value) => {
    setFooterSocialIcons(footerSocialIcons.map((i, n) => n === idx ? { ...i, [key]: value } : i));
  };

  const removeFooterIcon = idx => {
    setFooterSocialIcons(footerSocialIcons.filter((_, i) => i !== idx));
  };

  const renderStyleControls = () => (
    <div className="border rounded p-3 mb-3">
      <div className="fw-bold mb-2">Footer Text Style</div>
      <div className="row">
        <div className="col-md-3 mb-2">
          <label className="form-label">Text Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={footerStyle.color || "#ffffff"}
            onChange={e => setFooterStyle({ ...footerStyle, color: e.target.value })}
          />
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Align</label>
          <select
            className="form-select"
            value={footerStyle.align || "center"}
            onChange={e => setFooterStyle({ ...footerStyle, align: e.target.value })}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
            <option value="justify">justify</option>
          </select>
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Variant</label>
          <select
            className="form-select"
            value={footerStyle.variant || "p"}
            onChange={e => setFooterStyle({ ...footerStyle, variant: e.target.value })}
          >
            <option value="p">p</option>
            <option value="span">span</option>
            <option value="h1">h1</option>
            <option value="h2">h2</option>
            <option value="h3">h3</option>
            <option value="h4">h4</option>
            <option value="h5">h5</option>
            <option value="h6">h6</option>
          </select>
        </div>
        <div className="col-md-3 mb-2 d-flex align-items-end">
          <div className="form-check me-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!footerStyle.bold}
              onChange={e => setFooterStyle({ ...footerStyle, bold: e.target.checked })}
            />
            <label className="form-check-label">Bold</label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!footerStyle.italic}
              onChange={e => setFooterStyle({ ...footerStyle, italic: e.target.checked })}
            />
            <label className="form-check-label">Italic</label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
        <div className="mb-3">
          <label className="form-label">
            Site Name {footerUseSplitColor ? "(ignored in split color mode)" : ""}
          </label>
          <input
            className="form-control"
            value={footerText}
            onChange={e => setFooterText(e.target.value)}
            placeholder="Footer Text"
            disabled={footerUseSplitColor}
          />
        </div>

        {renderStyleControls()}

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-3">Footer Site Name Split Color</div>
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="footer-split-color"
              checked={footerUseSplitColor}
              onChange={e => setFooterUseSplitColor(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="footer-split-color">
              Use Split Color Mode (Two Colors)
            </label>
          </div>
          {footerUseSplitColor && (
            <>
              <div className="row mb-2">
                <div className="col-md-8">
                  <label className="form-label">First Part Text</label>
                  <input
                    className="form-control"
                    value={footerNamePart1}
                    onChange={e => setFooterNamePart1(e.target.value)}
                    placeholder="e.g., Study"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">First Part Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={footerNamePart1Color}
                    onChange={e => setFooterNamePart1Color(e.target.value)}
                  />
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-8">
                  <label className="form-label">Second Part Text</label>
                  <input
                    className="form-control"
                    value={footerNamePart2}
                    onChange={e => setFooterNamePart2(e.target.value)}
                    placeholder="e.g., Portal"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Second Part Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={footerNamePart2Color}
                    onChange={e => setFooterNamePart2Color(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Footer Background Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={footerBgColor}
            onChange={e => setFooterBgColor(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Footer Background Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadFooterBg}
            disabled={uploadingFooterBg}
          />
          <div className="form-text">
            Recommended size: 1920 x 800 px (minimum 1600 x 700). Keep main content in center for mobile.
          </div>
          {footerBgImage && (
            <div className="mt-2">
              <img src={resolveUrl(footerBgImage)} alt="Footer Background" style={{ height: "80px" }} />
            </div>
          )}
          {footerBgImage && (
            <div className="mt-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setFooterBgImage("")}
              >
                Remove Background Image
              </button>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Footer Logo Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadFooterLogo}
            disabled={uploadingFooterLogo}
          />
          {footerLogoUrl && (
            <div className="mt-2">
              <img src={resolveUrl(footerLogoUrl)} alt="Footer Logo" style={{ height: `${footerLogoHeight}px` }} />
            </div>
          )}
          {footerLogoUrl && (
            <div className="mt-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setFooterLogoUrl("")}
              >
                Remove Footer Logo
              </button>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Footer Logo Height (px)</label>
          <input
            type="number"
            className="form-control"
            value={footerLogoHeight}
            onChange={e => setFooterLogoHeight(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Footer Logo Align</label>
          <select
            className="form-select"
            value={footerLogoAlign}
            onChange={e => setFooterLogoAlign(e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Footer Columns</div>
            <button className="btn btn-sm btn-outline-primary" onClick={addFooterColumn}>
              Add Column
            </button>
          </div>
          <div className="mb-3">
            <label className="form-label">Link Text Size (px)</label>
            <input
              type="number"
              className="form-control"
              value={footerLinkFontSize}
              onChange={e => setFooterLinkFontSize(Number(e.target.value || 0))}
            />
          </div>

          {footerColumns.length === 0 && (
            <div className="text-muted">No columns added.</div>
          )}

          {footerColumns.map((col, idx) => (
            <div key={`col-${idx}`} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-bold">Column #{idx + 1}</div>
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeFooterColumn(idx)}>
                  Remove
                </button>
              </div>

              <div className="mt-2">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  value={col.title || ""}
                  onChange={e => updateFooterColumn(idx, "title", e.target.value)}
                />
              </div>

              <div className="mt-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => addFooterLink(idx)}>
                  Add Link
                </button>
              </div>

              {(col.links || []).map((link, lidx) => {
                const matched = pages.find(p => link.url === `/page/${p.slug}`);
                return (
                <div key={`link-${idx}-${lidx}`} className="row mt-2">
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Label"
                      value={link.label || ""}
                      onChange={e => updateFooterLink(idx, lidx, "label", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="URL"
                      value={link.url || ""}
                      onChange={e => updateFooterLink(idx, lidx, "url", e.target.value)}
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
                        updateFooterLink(idx, lidx, "label", page.title || "Page");
                        updateFooterLink(idx, lidx, "url", `/page/${page.slug}`);
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
                  <div className="col-md-2">
                    <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeFooterLink(idx, lidx)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          ))}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Footer Social Icons</div>
            <button className="btn btn-sm btn-outline-primary" onClick={addFooterIcon}>
              Add Icon Link
            </button>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Icon Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={footerSocialIconSize}
                onChange={e => setFooterSocialIconSize(Number(e.target.value || 0))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Icon Radius (px)</label>
              <input
                type="number"
                className="form-control"
                value={footerSocialIconRadius}
                onChange={e => setFooterSocialIconRadius(Number(e.target.value || 0))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Border Width (px)</label>
              <input
                type="number"
                className="form-control"
                value={footerSocialIconBorderWidth}
                onChange={e => setFooterSocialIconBorderWidth(Number(e.target.value || 0))}
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Background Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={footerSocialIconBgColor}
                onChange={e => setFooterSocialIconBgColor(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Border Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={footerSocialIconBorderColor}
                onChange={e => setFooterSocialIconBorderColor(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-2">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={uploadFooterIcons}
              disabled={uploadingFooterIcons}
            />
          </div>

          {footerSocialIcons.length === 0 && (
            <div className="text-muted">No icons added.</div>
          )}

          {footerSocialIcons.map((icon, idx) => (
            <div key={`icon-${idx}`} className="row align-items-center mb-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Image URL"
                  value={icon.imageUrl || ""}
                  onChange={e => updateFooterIcon(idx, "imageUrl", e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <input
                  className="form-control"
                  placeholder="Link"
                  value={icon.link || ""}
                  onChange={e => updateFooterIcon(idx, "link", e.target.value)}
                />
              </div>
              <div className="col-md-2">
                {icon.imageUrl && (
                  <img src={resolveUrl(icon.imageUrl)} alt="icon" style={{ height: "28px" }} />
                )}
              </div>
              <div className="col-md-1">
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeFooterIcon(idx)}>
                  X
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Rating Description Box (above rating)</div>
          <div className="mb-3">
            <label className="form-label">Heading</label>
            <input
              className="form-control"
              value={footerRatingNoteTitle}
              onChange={e => setFooterRatingNoteTitle(e.target.value)}
              placeholder="e.g. About Our Papers"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Paragraph</label>
            <textarea
              className="form-control"
              rows="3"
              value={footerRatingNoteText}
              onChange={e => setFooterRatingNoteText(e.target.value)}
              placeholder="Short description text..."
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Clickable Link URL/Page</label>
            <input
              className="form-control"
              value={footerRatingNoteLink}
              onChange={e => setFooterRatingNoteLink(e.target.value)}
              placeholder="/courses or https://..."
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label">Box Background Color (hex)</label>
              <input
                className="form-control"
                value={footerRatingNoteBgColor}
                onChange={e => setFooterRatingNoteBgColor(e.target.value)}
                placeholder="rgba(255,255,255,0.08) or #1f2937"
              />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={footerRatingNoteTextColor}
                onChange={e => setFooterRatingNoteTextColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Contact Details (shown above rating)</div>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              value={footerContactTitle}
              onChange={e => setFooterContactTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Lines (one per line)</label>
            <textarea
              className="form-control"
              rows="4"
              value={footerContactLines}
              onChange={e => setFooterContactLines(e.target.value)}
              placeholder="Phone: 9876543210&#10;Email: info@example.com"
            />
          </div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={footerContactTextStyle.color || "#ffffff"}
                onChange={e => setFooterContactTextStyle({ ...footerContactTextStyle, color: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={footerContactTextStyle.size || 14}
                onChange={e => setFooterContactTextStyle({ ...footerContactTextStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="contact-bold"
                  checked={!!footerContactTextStyle.bold}
                  onChange={e => setFooterContactTextStyle({ ...footerContactTextStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="contact-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="contact-italic"
                  checked={!!footerContactTextStyle.italic}
                  onChange={e => setFooterContactTextStyle({ ...footerContactTextStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="contact-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Copyright Bar</div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="copyrightEnabled"
              checked={copyrightEnabled}
              onChange={e => setCopyrightEnabled(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="copyrightEnabled">
              Enable copyright bar
            </label>
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright Text</label>
            <input
              className="form-control"
              value={copyrightText}
              onChange={e => setCopyrightText(e.target.value)}
              placeholder="? 2026 Study Portal"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright Background Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={copyrightColor}
              onChange={e => setCopyrightColor(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright Text Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={copyrightTextColor}
              onChange={e => setCopyrightTextColor(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright Height (px)</label>
            <input
              type="number"
              className="form-control"
              value={copyrightHeight}
              onChange={e => setCopyrightHeight(Number(e.target.value || 0))}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright Text Size (px)</label>
            <input
              type="number"
              className="form-control"
              value={copyrightFontSize}
              onChange={e => setCopyrightFontSize(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Footer Settings"}
        </button>
      </div>
    </Layout>
  );
}

