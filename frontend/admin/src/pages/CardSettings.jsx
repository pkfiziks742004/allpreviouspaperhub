import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

const defaultStyle = {
  bgColor: "#ffffff",
  gradientStart: "",
  gradientEnd: "",
  textColor: "#0f172a",
  bold: false,
  italic: false,
  minHeight: 200,
  maxWidth: 0
};

const styleLabels = {
  university: "University Cards",
  course: "Course Cards",
  section: "Section Cards"
};

const defaultNameStyle = {
  color: "#0f172a",
  bold: false,
  italic: false,
  align: "center",
  variant: "h5",
  size: 18
};

const VARIANT_OPTIONS = ["span", "p", "h1", "h2", "h3", "h4", "h5", "h6"];
const ALIGN_OPTIONS = ["left", "center", "right", "justify"];

export default function CardSettings() {
  const [cardStyles, setCardStyles] = useState({
    university: { ...defaultStyle, minHeight: 240 },
    course: { ...defaultStyle, minHeight: 200 },
    section: { ...defaultStyle, minHeight: 200 }
  });
  const [universityNameStyle, setUniversityNameStyle] = useState({ ...defaultNameStyle, variant: "h5", size: 30 });
  const [courseNameStyle, setCourseNameStyle] = useState({ ...defaultNameStyle, variant: "h5", size: 22 });
  const [semesterNameStyle, setSemesterNameStyle] = useState({ ...defaultNameStyle, variant: "h6", size: 16 });
  const [paperNameStyle, setPaperNameStyle] = useState({ ...defaultNameStyle, align: "left", variant: "span", size: 16 });
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      if (res.data && res.data.cardStyles) {
        setCardStyles({
          university: { ...defaultStyle, minHeight: 240, ...(res.data.cardStyles.university || {}) },
          course: { ...defaultStyle, minHeight: 200, ...(res.data.cardStyles.course || {}) },
          section: { ...defaultStyle, minHeight: 200, ...(res.data.cardStyles.section || {}) }
        });
      }
      setUniversityNameStyle({ ...defaultNameStyle, variant: "h5", size: 30, ...(res.data.universityNameStyle || {}) });
      setCourseNameStyle({ ...defaultNameStyle, variant: "h5", size: 22, ...(res.data.courseNameStyle || {}) });
      setSemesterNameStyle({ ...defaultNameStyle, variant: "h6", size: 16, ...(res.data.semesterNameStyle || {}) });
      setPaperNameStyle({ ...defaultNameStyle, align: "left", variant: "span", size: 16, ...(res.data.paperNameStyle || {}) });
      setSectionPanelBgColor(res.data.sectionPanelBgColor || "#ffffff");
    });
  }, []);

  const updateStyle = (key, field, value) => {
    setCardStyles({
      ...cardStyles,
      [key]: { ...cardStyles[key], [field]: value }
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          cardStyles,
          universityNameStyle,
          courseNameStyle,
          semesterNameStyle,
          paperNameStyle,
          sectionPanelBgColor
        },
        headers
      );
      alert("Card styles saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderCardStyle = key => {
    const style = cardStyles[key] || defaultStyle;
    return (
      <div className="border rounded p-3 mb-4">
        <div className="fw-bold mb-2">{styleLabels[key]}</div>

        <div className="row">
          <div className="col-md-3 mb-2">
            <label className="form-label">Card Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={style.bgColor || "#ffffff"}
              onChange={e => updateStyle(key, "bgColor", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Gradient Start</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={style.gradientStart || "#ffffff"}
              onChange={e => updateStyle(key, "gradientStart", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Gradient End</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={style.gradientEnd || "#ffffff"}
              onChange={e => updateStyle(key, "gradientEnd", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Text Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={style.textColor || "#0f172a"}
              onChange={e => updateStyle(key, "textColor", e.target.value)}
            />
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-md-3 mb-2">
            <label className="form-label">Min Height (px)</label>
            <input
              type="number"
              className="form-control"
              value={style.minHeight || 0}
              onChange={e => updateStyle(key, "minHeight", Number(e.target.value || 0))}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Max Width (px)</label>
            <input
              type="number"
              className="form-control"
              value={style.maxWidth || 0}
              onChange={e => updateStyle(key, "maxWidth", Number(e.target.value || 0))}
            />
          </div>
          <div className="col-md-3 mb-2 d-flex align-items-end">
            <div className="form-check me-3">
              <input
                className="form-check-input"
                type="checkbox"
                id={`${key}-bold`}
                checked={!!style.bold}
                onChange={e => updateStyle(key, "bold", e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`${key}-bold`}>Bold</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`${key}-italic`}
                checked={!!style.italic}
                onChange={e => updateStyle(key, "italic", e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`${key}-italic`}>Italic</label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNameStyle = (label, style, setStyle) => (
    <div className="border rounded p-3 mb-4">
      <div className="fw-bold mb-2">{label}</div>
      <div className="row">
        <div className="col-md-3 mb-2">
          <label className="form-label">Text Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={style.color || "#0f172a"}
            onChange={e => setStyle({ ...style, color: e.target.value })}
          />
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Font Size (px)</label>
          <input
            type="number"
            className="form-control"
            value={style.size || 16}
            onChange={e => setStyle({ ...style, size: Number(e.target.value || 0) })}
          />
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Align</label>
          <select
            className="form-select"
            value={style.align || "center"}
            onChange={e => setStyle({ ...style, align: e.target.value })}
          >
            {ALIGN_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3 mb-2">
          <label className="form-label">Variant</label>
          <select
            className="form-select"
            value={style.variant || "span"}
            onChange={e => setStyle({ ...style, variant: e.target.value })}
          >
            {VARIANT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="row mt-2">
        <div className="col-md-3 mb-2 d-flex align-items-end">
          <div className="form-check me-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!style.bold}
              onChange={e => setStyle({ ...style, bold: e.target.checked })}
            />
            <label className="form-check-label">Bold</label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={!!style.italic}
              onChange={e => setStyle({ ...style, italic: e.target.checked })}
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
        {renderNameStyle("University Name Style", universityNameStyle, setUniversityNameStyle)}
        {renderNameStyle("Course Name Style", courseNameStyle, setCourseNameStyle)}
        {renderNameStyle("Semester Name Style", semesterNameStyle, setSemesterNameStyle)}
        {renderNameStyle("Question Paper Name Style", paperNameStyle, setPaperNameStyle)}

        {renderCardStyle("university")}
        {renderCardStyle("course")}
        {renderCardStyle("section")}
        <div className="border rounded p-3 mb-4">
          <div className="fw-bold mb-2">All Card Area Background</div>
          <div className="text-muted mb-2">
            Applies to Home, Courses, Semesters and Question Papers card containers.
          </div>
          <label className="form-label">Background Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={sectionPanelBgColor}
            onChange={e => setSectionPanelBgColor(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Card Settings"}
        </button>
      </div>
    </Layout>
  );
}

