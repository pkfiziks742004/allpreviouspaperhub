import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const defaultNameStyle = {
  color: "#0f172a",
  bold: false,
  italic: false,
  align: "center",
  variant: "h5",
  size: 30
};

const defaultSectionTitleStyle = {
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
  minHeight: 240,
  maxWidth: 0
};

const defaultTypeActionLabels = {
  university: "View Semesters",
  college: "View Semesters",
  school: "View Classes",
  entranceExam: "View Exam Papers",
  other: "View Details"
};

export default function UniversitySettings() {
  const [universitiesSectionTitle, setUniversitiesSectionTitle] = useState("Universities / Colleges / Schools");
  const [universitiesSectionSubtitle, setUniversitiesSectionSubtitle] = useState("Select a card to view its courses");
  const [universitiesTitleStyle, setUniversitiesTitleStyle] = useState(defaultSectionTitleStyle);
  const [typeActionLabels, setTypeActionLabels] = useState(defaultTypeActionLabels);
  const [universityNameStyle, setUniversityNameStyle] = useState(defaultNameStyle);
  const [universityCardStyle, setUniversityCardStyle] = useState(defaultCardStyle);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setUniversitiesSectionTitle(res.data.universitiesSectionTitle || "Universities / Colleges / Schools");
      setUniversitiesSectionSubtitle(res.data.universitiesSectionSubtitle || "Select a card to view its courses");
      setUniversitiesTitleStyle({ ...defaultSectionTitleStyle, ...(res.data.universitiesTitleStyle || {}) });
      setTypeActionLabels({ ...defaultTypeActionLabels, ...(res.data.typeActionLabels || {}) });
      setUniversityNameStyle({ ...defaultNameStyle, ...(res.data.universityNameStyle || {}) });
      setUniversityCardStyle({ ...defaultCardStyle, ...((res.data.cardStyles && res.data.cardStyles.university) || {}) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          universitiesSectionTitle,
          universitiesTitleStyle,
          universitiesSectionSubtitle,
          typeActionLabels,
          universityNameStyle,
          cardStyles: { university: universityCardStyle }
        },
        headers
      );
      alert("University settings saved");
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
            value={universitiesSectionTitle}
            onChange={e => setUniversitiesSectionTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Section Subtitle</label>
          <input
            className="form-control"
            value={universitiesSectionSubtitle}
            onChange={e => setUniversitiesSectionSubtitle(e.target.value)}
          />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Button Labels By Type</div>
          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label">University</label>
              <input
                className="form-control"
                value={typeActionLabels.university || ""}
                onChange={e => setTypeActionLabels({ ...typeActionLabels, university: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">College</label>
              <input
                className="form-control"
                value={typeActionLabels.college || ""}
                onChange={e => setTypeActionLabels({ ...typeActionLabels, college: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">School</label>
              <input
                className="form-control"
                value={typeActionLabels.school || ""}
                onChange={e => setTypeActionLabels({ ...typeActionLabels, school: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Entrance Exam</label>
              <input
                className="form-control"
                value={typeActionLabels.entranceExam || ""}
                onChange={e => setTypeActionLabels({ ...typeActionLabels, entranceExam: e.target.value })}
              />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Other</label>
              <input
                className="form-control"
                value={typeActionLabels.other || ""}
                onChange={e => setTypeActionLabels({ ...typeActionLabels, other: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Title Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universitiesTitleStyle.color || "#0f172a"}
                onChange={e => setUniversitiesTitleStyle({ ...universitiesTitleStyle, color: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={universitiesTitleStyle.size || 22}
                onChange={e => setUniversitiesTitleStyle({ ...universitiesTitleStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select
                className="form-select"
                value={universitiesTitleStyle.align || "left"}
                onChange={e => setUniversitiesTitleStyle({ ...universitiesTitleStyle, align: e.target.value })}
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
                  id="uni-title-bold"
                  checked={!!universitiesTitleStyle.bold}
                  onChange={e => setUniversitiesTitleStyle({ ...universitiesTitleStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-title-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="uni-title-italic"
                  checked={!!universitiesTitleStyle.italic}
                  onChange={e => setUniversitiesTitleStyle({ ...universitiesTitleStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-title-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">University Name Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universityNameStyle.color || "#0f172a"}
                onChange={e => setUniversityNameStyle({ ...universityNameStyle, color: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input
                type="number"
                className="form-control"
                value={universityNameStyle.size || 30}
                onChange={e => setUniversityNameStyle({ ...universityNameStyle, size: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select
                className="form-select"
                value={universityNameStyle.align || "center"}
                onChange={e => setUniversityNameStyle({ ...universityNameStyle, align: e.target.value })}
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
                value={universityNameStyle.variant || "h5"}
                onChange={e => setUniversityNameStyle({ ...universityNameStyle, variant: e.target.value })}
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
                  id="uni-name-bold"
                  checked={!!universityNameStyle.bold}
                  onChange={e => setUniversityNameStyle({ ...universityNameStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-name-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="uni-name-italic"
                  checked={!!universityNameStyle.italic}
                  onChange={e => setUniversityNameStyle({ ...universityNameStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-name-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">University Card Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Card Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universityCardStyle.bgColor || "#ffffff"}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, bgColor: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Gradient Start</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universityCardStyle.gradientStart || "#ffffff"}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, gradientStart: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Gradient End</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universityCardStyle.gradientEnd || "#ffffff"}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, gradientEnd: e.target.value })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={universityCardStyle.textColor || "#0f172a"}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, textColor: e.target.value })}
              />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2">
              <label className="form-label">Min Height (px)</label>
              <input
                type="number"
                className="form-control"
                value={universityCardStyle.minHeight || 0}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, minHeight: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Max Width (px)</label>
              <input
                type="number"
                className="form-control"
                value={universityCardStyle.maxWidth || 0}
                onChange={e => setUniversityCardStyle({ ...universityCardStyle, maxWidth: Number(e.target.value || 0) })}
              />
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="uni-card-bold"
                  checked={!!universityCardStyle.bold}
                  onChange={e => setUniversityCardStyle({ ...universityCardStyle, bold: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-card-bold">Bold</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="uni-card-italic"
                  checked={!!universityCardStyle.italic}
                  onChange={e => setUniversityCardStyle({ ...universityCardStyle, italic: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="uni-card-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save University Settings"}
        </button>
      </div>
    </Layout>
  );
}

