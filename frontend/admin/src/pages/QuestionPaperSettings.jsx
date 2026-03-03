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

const defaultNameStyle = {
  color: "#0f172a",
  bold: false,
  italic: false,
  align: "left",
  variant: "span",
  size: 16
};

const defaultCardStyle = {
  bgColor: "#ffffff",
  gradientStart: "",
  gradientEnd: "",
  textColor: "#0f172a",
  bold: false,
  italic: false,
  minHeight: 80
};

const defaultButtonStyle = {
  bgColor: "#2563eb",
  hoverColor: "#1d4ed8",
  textColor: "#ffffff",
  bold: false,
  italic: false,
  size: 13,
  minWidth: 140
};

export default function QuestionPaperSettings() {
  const [questionPapersSectionTitle, setQuestionPapersSectionTitle] = useState("Question Papers");
  const [questionPapersTitleStyle, setQuestionPapersTitleStyle] = useState(defaultTitleStyle);
  const [paperNameStyle, setPaperNameStyle] = useState(defaultNameStyle);
  const [questionPaperCardStyle, setQuestionPaperCardStyle] = useState(defaultCardStyle);
  const [questionPaperButtonStyle, setQuestionPaperButtonStyle] = useState(defaultButtonStyle);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setQuestionPapersSectionTitle(res.data.questionPapersSectionTitle || "Question Papers");
      setQuestionPapersTitleStyle({ ...defaultTitleStyle, ...(res.data.questionPapersTitleStyle || {}) });
      setPaperNameStyle({ ...defaultNameStyle, ...(res.data.paperNameStyle || {}) });
      setQuestionPaperCardStyle({ ...defaultCardStyle, ...(res.data.questionPaperCardStyle || {}) });
      setQuestionPaperButtonStyle({ ...defaultButtonStyle, ...(res.data.questionPaperButtonStyle || {}) });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          questionPapersSectionTitle,
          questionPapersTitleStyle,
          paperNameStyle,
          questionPaperCardStyle,
          questionPaperButtonStyle
        },
        headers
      );
      alert("Question paper settings saved");
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
          <input className="form-control" value={questionPapersSectionTitle} onChange={e => setQuestionPapersSectionTitle(e.target.value)} />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Title Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={questionPapersTitleStyle.color || "#0f172a"} onChange={e => setQuestionPapersTitleStyle({ ...questionPapersTitleStyle, color: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Font Size (px)</label><input type="number" className="form-control" value={questionPapersTitleStyle.size || 22} onChange={e => setQuestionPapersTitleStyle({ ...questionPapersTitleStyle, size: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Align</label><select className="form-select" value={questionPapersTitleStyle.align || "left"} onChange={e => setQuestionPapersTitleStyle({ ...questionPapersTitleStyle, align: e.target.value })}><option value="left">left</option><option value="center">center</option><option value="right">right</option></select></div>
            <div className="col-md-3 mb-2 d-flex align-items-end"><div className="form-check me-3"><input className="form-check-input" type="checkbox" id="qp-title-bold" checked={!!questionPapersTitleStyle.bold} onChange={e => setQuestionPapersTitleStyle({ ...questionPapersTitleStyle, bold: e.target.checked })} /><label className="form-check-label" htmlFor="qp-title-bold">Bold</label></div><div className="form-check"><input className="form-check-input" type="checkbox" id="qp-title-italic" checked={!!questionPapersTitleStyle.italic} onChange={e => setQuestionPapersTitleStyle({ ...questionPapersTitleStyle, italic: e.target.checked })} /><label className="form-check-label" htmlFor="qp-title-italic">Italic</label></div></div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Question Paper Name Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={paperNameStyle.color || "#0f172a"} onChange={e => setPaperNameStyle({ ...paperNameStyle, color: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Font Size (px)</label><input type="number" className="form-control" value={paperNameStyle.size || 16} onChange={e => setPaperNameStyle({ ...paperNameStyle, size: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Align</label><select className="form-select" value={paperNameStyle.align || "left"} onChange={e => setPaperNameStyle({ ...paperNameStyle, align: e.target.value })}><option value="left">left</option><option value="center">center</option><option value="right">right</option><option value="justify">justify</option></select></div>
            <div className="col-md-3 mb-2"><label className="form-label">Variant</label><select className="form-select" value={paperNameStyle.variant || "span"} onChange={e => setPaperNameStyle({ ...paperNameStyle, variant: e.target.value })}><option value="span">span</option><option value="p">p</option><option value="h1">h1</option><option value="h2">h2</option><option value="h3">h3</option><option value="h4">h4</option><option value="h5">h5</option><option value="h6">h6</option></select></div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2 d-flex align-items-end"><div className="form-check me-3"><input className="form-check-input" type="checkbox" id="qp-name-bold" checked={!!paperNameStyle.bold} onChange={e => setPaperNameStyle({ ...paperNameStyle, bold: e.target.checked })} /><label className="form-check-label" htmlFor="qp-name-bold">Bold</label></div><div className="form-check"><input className="form-check-input" type="checkbox" id="qp-name-italic" checked={!!paperNameStyle.italic} onChange={e => setPaperNameStyle({ ...paperNameStyle, italic: e.target.checked })} /><label className="form-check-label" htmlFor="qp-name-italic">Italic</label></div></div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Question Paper Card Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Card Color</label><input type="color" className="form-control form-control-color" value={questionPaperCardStyle.bgColor || "#ffffff"} onChange={e => setQuestionPaperCardStyle({ ...questionPaperCardStyle, bgColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Gradient Start</label><input type="color" className="form-control form-control-color" value={questionPaperCardStyle.gradientStart || "#ffffff"} onChange={e => setQuestionPaperCardStyle({ ...questionPaperCardStyle, gradientStart: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Gradient End</label><input type="color" className="form-control form-control-color" value={questionPaperCardStyle.gradientEnd || "#ffffff"} onChange={e => setQuestionPaperCardStyle({ ...questionPaperCardStyle, gradientEnd: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={questionPaperCardStyle.textColor || "#0f172a"} onChange={e => setQuestionPaperCardStyle({ ...questionPaperCardStyle, textColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Min Height (px)</label><input type="number" className="form-control" value={questionPaperCardStyle.minHeight || 0} onChange={e => setQuestionPaperCardStyle({ ...questionPaperCardStyle, minHeight: Number(e.target.value || 0) })} /></div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Button Style</div>
          <div className="row">
            <div className="col-md-3 mb-2"><label className="form-label">Button Color</label><input type="color" className="form-control form-control-color" value={questionPaperButtonStyle.bgColor || "#2563eb"} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, bgColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Hover Color</label><input type="color" className="form-control form-control-color" value={questionPaperButtonStyle.hoverColor || "#1d4ed8"} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, hoverColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Color</label><input type="color" className="form-control form-control-color" value={questionPaperButtonStyle.textColor || "#ffffff"} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, textColor: e.target.value })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Text Size (px)</label><input type="number" className="form-control" value={questionPaperButtonStyle.size || 13} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, size: Number(e.target.value || 0) })} /></div>
            <div className="col-md-3 mb-2"><label className="form-label">Min Width (px)</label><input type="number" className="form-control" value={questionPaperButtonStyle.minWidth || 0} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, minWidth: Number(e.target.value || 0) })} /></div>
          </div>
          <div className="row mt-2">
            <div className="col-md-3 mb-2 d-flex align-items-end">
              <div className="form-check me-3">
                <input className="form-check-input" type="checkbox" id="qp-btn-bold" checked={!!questionPaperButtonStyle.bold} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, bold: e.target.checked })} />
                <label className="form-check-label" htmlFor="qp-btn-bold">Bold</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="qp-btn-italic" checked={!!questionPaperButtonStyle.italic} onChange={e => setQuestionPaperButtonStyle({ ...questionPaperButtonStyle, italic: e.target.checked })} />
                <label className="form-check-label" htmlFor="qp-btn-italic">Italic</label>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Question Paper Settings"}
        </button>
      </div>
    </Layout>
  );
}


