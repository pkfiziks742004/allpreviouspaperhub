import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

const defaultTitleStyle = {
  color: "#0f172a",
  bold: true,
  italic: false,
  align: "left",
  size: 22
};

const defaultCardStyle = {
  bgColor: "#ffffff",
  gradientStart: "",
  gradientEnd: "",
  textColor: "#0f172a",
  bold: false,
  italic: false,
  minHeight: 170,
  maxWidth: 0,
  titleSize: 16
};

const defaultNameStyle = {
  color: "#0f172a",
  bold: false,
  italic: false,
  align: "center",
  variant: "h6",
  size: 16
};

const defaultButtonStyle = {
  bgColor: "#15803d",
  hoverColor: "#166534",
  textColor: "#ffffff",
  bold: false,
  italic: false,
  size: 14,
  minWidth: 140
};

export default function SemesterSettings() {
  const [semestersSectionTitle, setSemestersSectionTitle] = useState("Semesters");
  const [semestersTitleStyle, setSemestersTitleStyle] = useState(defaultTitleStyle);
  const [semesterNameStyle, setSemesterNameStyle] = useState(defaultNameStyle);
  const [semesterCardStyle, setSemesterCardStyle] = useState(defaultCardStyle);
  const [semesterButtonStyle, setSemesterButtonStyle] = useState(defaultButtonStyle);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setSemestersSectionTitle(res.data.semestersSectionTitle || "Semesters");
      setSemestersTitleStyle(res.data.semestersTitleStyle || defaultTitleStyle);
      setSemesterNameStyle({ ...defaultNameStyle, ...(res.data.semesterNameStyle || {}) });
      setSemesterCardStyle(res.data.semesterCardStyle || defaultCardStyle);
      setSemesterButtonStyle(res.data.semesterButtonStyle || defaultButtonStyle);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          semestersSectionTitle,
          semestersTitleStyle,
          semesterNameStyle,
          semesterCardStyle,
          semesterButtonStyle
        },
        headers
      );
      alert("Semester settings saved");
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
          <label className="form-label">Section Title</label>
          <input
            className="form-control"
            value={semestersSectionTitle}
            onChange={e => setSemestersSectionTitle(e.target.value)}
          />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Title Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semestersTitleStyle.color || "#0f172a"}
                onChange={e => setSemestersTitleStyle({ ...semestersTitleStyle, color: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={semestersTitleStyle.size || 22}
                onChange={e => setSemestersTitleStyle({ ...semestersTitleStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select
                className="form-select"
                value={semestersTitleStyle.align || "left"}
                onChange={e => setSemestersTitleStyle({ ...semestersTitleStyle, align: e.target.value })}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-title-bold"
                  checked={!!semestersTitleStyle.bold}
                  onChange={e => setSemestersTitleStyle({ ...semestersTitleStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-title-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-title-italic"
                  checked={!!semestersTitleStyle.italic}
                  onChange={e => setSemestersTitleStyle({ ...semestersTitleStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-title-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Semester Name Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterNameStyle.color || "#0f172a"}
                onChange={e => setSemesterNameStyle({ ...semesterNameStyle, color: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterNameStyle.size || 16}
                onChange={e => setSemesterNameStyle({ ...semesterNameStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select
                className="form-select"
                value={semesterNameStyle.align || "center"}
                onChange={e => setSemesterNameStyle({ ...semesterNameStyle, align: e.target.value })}
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
                value={semesterNameStyle.variant || "h6"}
                onChange={e => setSemesterNameStyle({ ...semesterNameStyle, variant: e.target.value })}
              >
                <option value="span">span</option>
                <option value="p">p</option>
                <option value="h1">h1</option>
                <option value="h2">h2</option>
                <option value="h3">h3</option>
                <option value="h4">h4</option>
                <option value="h5">h5</option>
                <option value="h6">h6</option>
              </select>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-name-bold"
                  checked={!!semesterNameStyle.bold}
                  onChange={e => setSemesterNameStyle({ ...semesterNameStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-name-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-name-italic"
                  checked={!!semesterNameStyle.italic}
                  onChange={e => setSemesterNameStyle({ ...semesterNameStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-name-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Semester Card Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Card Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterCardStyle.bgColor || "#ffffff"}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, bgColor: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Gradient Start</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterCardStyle.gradientStart || "#ffffff"}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, gradientStart: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Gradient End</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterCardStyle.gradientEnd || "#ffffff"}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, gradientEnd: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterCardStyle.textColor || "#0f172a"}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, textColor: e.target.value })}
              />
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-3 mb-2">
              <label className="form-label">Min Height (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterCardStyle.minHeight || 0}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, minHeight: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Max Width (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterCardStyle.maxWidth || 0}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, maxWidth: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Title Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterCardStyle.titleSize || 16}
                onChange={e => setSemesterCardStyle({ ...semesterCardStyle, titleSize: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-card-bold"
                  checked={!!semesterCardStyle.bold}
                  onChange={e => setSemesterCardStyle({ ...semesterCardStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-card-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-card-italic"
                  checked={!!semesterCardStyle.italic}
                  onChange={e => setSemesterCardStyle({ ...semesterCardStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-card-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Button Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Button Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterButtonStyle.bgColor || "#15803d"}
                onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, bgColor: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Hover Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterButtonStyle.hoverColor || "#166534"}
                onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, hoverColor: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={semesterButtonStyle.textColor || "#ffffff"}
                onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, textColor: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterButtonStyle.size || 14}
                onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Min Width (px)</label>
              <input
                type="number"
                className="form-control"
                value={semesterButtonStyle.minWidth || 0}
                onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, minWidth: Number(e.target.value || 0) })}
              />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-btn-bold"
                  checked={!!semesterButtonStyle.bold}
                  onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-btn-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sem-btn-italic"
                  checked={!!semesterButtonStyle.italic}
                  onChange={e => setSemesterButtonStyle({ ...semesterButtonStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="sem-btn-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Semester Settings"}
        </button>
      </div>
    </Layout>
  );
}

