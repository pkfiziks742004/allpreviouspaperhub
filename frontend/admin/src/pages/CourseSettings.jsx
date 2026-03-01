import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const defaultTitleStyle = {
  color: "#0f172a",
  bold: true,
  italic: false,
  align: "left",
  size: 22
};

const defaultNameStyle = {
  color: "#0f172a",
  bold: false,
  italic: false,
  align: "center",
  variant: "h5",
  size: 22
};

const defaultCardStyle = {
  bgColor: "#ffffff",
  gradientStart: "",
  gradientEnd: "",
  textColor: "#0f172a",
  bold: false,
  italic: false,
  minHeight: 200,
  maxWidth: 0
};

const defaultButtonStyle = {
  bgColor: "#2563eb",
  hoverColor: "#1d4ed8",
  textColor: "#ffffff",
  bold: false,
  italic: false,
  size: 14,
  minWidth: 140
};

export default function CourseSettings() {
  const [coursesSectionTitle, setCoursesSectionTitle] = useState("Courses");
  const [coursesTitleStyle, setCoursesTitleStyle] = useState(defaultTitleStyle);
  const [courseNameStyle, setCourseNameStyle] = useState(defaultNameStyle);
  const [courseCardStyle, setCourseCardStyle] = useState(defaultCardStyle);
  const [courseButtonStyle, setCourseButtonStyle] = useState(defaultButtonStyle);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setCoursesSectionTitle(res.data.coursesSectionTitle || "Courses");
      setCoursesTitleStyle({ ...defaultTitleStyle, ...(res.data.coursesTitleStyle || {}) });
      setCourseNameStyle({ ...defaultNameStyle, ...(res.data.courseNameStyle || {}) });
      setCourseCardStyle({ ...defaultCardStyle, ...((res.data.cardStyles && res.data.cardStyles.course) || {}) });
      setCourseButtonStyle({ ...defaultButtonStyle, ...(res.data.courseButtonStyle || {}) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          coursesSectionTitle,
          coursesTitleStyle,
          courseNameStyle,
          courseButtonStyle,
          cardStyles: { course: courseCardStyle }
        },
        headers
      );
      alert("Course settings saved");
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
            value={coursesSectionTitle}
            onChange={e => setCoursesSectionTitle(e.target.value)}
          />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Title Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input type="color" className="form-control form-control-color" value={coursesTitleStyle.color || "#0f172a"} onChange={e => setCoursesTitleStyle({ ...coursesTitleStyle, color: e.target.value })} />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input type="number" className="form-control" value={coursesTitleStyle.size || 22} onChange={e => setCoursesTitleStyle({ ...coursesTitleStyle, size: Number(e.target.value || 0) })} />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select className="form-select" value={coursesTitleStyle.align || "left"} onChange={e => setCoursesTitleStyle({ ...coursesTitleStyle, align: e.target.value })}>
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input className="form-check-input" type="checkbox" id="course-title-bold" checked={!!coursesTitleStyle.bold} onChange={e => setCoursesTitleStyle({ ...coursesTitleStyle, bold: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-title-bold">Bold</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="course-title-italic" checked={!!coursesTitleStyle.italic} onChange={e => setCoursesTitleStyle({ ...coursesTitleStyle, italic: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-title-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Course Name Style</div>
          <div className="row">
            <div className="col-md-3 mb-2">
              <label className="form-label">Text Color</label>
              <input type="color" className="form-control form-control-color" value={courseNameStyle.color || "#0f172a"} onChange={e => setCourseNameStyle({ ...courseNameStyle, color: e.target.value })} />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Font Size (px)</label>
              <input type="number" className="form-control" value={courseNameStyle.size || 22} onChange={e => setCourseNameStyle({ ...courseNameStyle, size: Number(e.target.value || 0) })} />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Align</label>
              <select className="form-select" value={courseNameStyle.align || "center"} onChange={e => setCourseNameStyle({ ...courseNameStyle, align: e.target.value })}>
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
                <option value="justify">justify</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label">Variant</label>
              <select className="form-select" value={courseNameStyle.variant || "h5"} onChange={e => setCourseNameStyle({ ...courseNameStyle, variant: e.target.value })}>
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
                <input className="form-check-input" type="checkbox" id="course-name-bold" checked={!!courseNameStyle.bold} onChange={e => setCourseNameStyle({ ...courseNameStyle, bold: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-name-bold">Bold</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="course-name-italic" checked={!!courseNameStyle.italic} onChange={e => setCourseNameStyle({ ...courseNameStyle, italic: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-name-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Course Card Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Card Color</label><input type="color" className="form-control form-control-color" value={courseCardStyle.bgColor || "#ffffff"} onChange={e => setCourseCardStyle({ ...courseCardStyle, bgColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Gradient Start</label><input type="color" className="form-control form-control-color" value={courseCardStyle.gradientStart || "#ffffff"} onChange={e => setCourseCardStyle({ ...courseCardStyle, gradientStart: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Gradient End</label><input type="color" className="form-control form-control-color" value={courseCardStyle.gradientEnd || "#ffffff"} onChange={e => setCourseCardStyle({ ...courseCardStyle, gradientEnd: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={courseCardStyle.textColor || "#0f172a"} onChange={e => setCourseCardStyle({ ...courseCardStyle, textColor: e.target.value })} /></div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2"><label className="form-label">Min Height (px)</label><input type="number" className="form-control" value={courseCardStyle.minHeight || 0} onChange={e => setCourseCardStyle({ ...courseCardStyle, minHeight: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Max Width (px)</label><input type="number" className="form-control" value={courseCardStyle.maxWidth || 0} onChange={e => setCourseCardStyle({ ...courseCardStyle, maxWidth: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input className="form-check-input" type="checkbox" id="course-card-bold" checked={!!courseCardStyle.bold} onChange={e => setCourseCardStyle({ ...courseCardStyle, bold: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-card-bold">Bold</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="course-card-italic" checked={!!courseCardStyle.italic} onChange={e => setCourseCardStyle({ ...courseCardStyle, italic: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-card-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Button Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Button Color</label><input type="color" className="form-control form-control-color" value={courseButtonStyle.bgColor || "#2563eb"} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, bgColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Hover Color</label><input type="color" className="form-control form-control-color" value={courseButtonStyle.hoverColor || "#1d4ed8"} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, hoverColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={courseButtonStyle.textColor || "#ffffff"} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, textColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Size (px)</label><input type="number" className="form-control" value={courseButtonStyle.size || 14} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, size: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Min Width (px)</label><input type="number" className="form-control" value={courseButtonStyle.minWidth || 0} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, minWidth: Number(e.target.value || 0) })} /></div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input className="form-check-input" type="checkbox" id="course-btn-bold" checked={!!courseButtonStyle.bold} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, bold: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-btn-bold">Bold</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="course-btn-italic" checked={!!courseButtonStyle.italic} onChange={e => setCourseButtonStyle({ ...courseButtonStyle, italic: e.target.checked })} />
                <label className="form-check-label" htmlFor="course-btn-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Course Settings"}
        </button>
      </div>
    </Layout>
  );
}


