import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdSlot from "../components/AdSlot";
import { API_BASE } from "../config/api";

export default function Papers(){

  const { id } = useParams();

  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [paperNameStyle, setPaperNameStyle] = useState({});
  const [questionPapersSectionTitle, setQuestionPapersSectionTitle] = useState("");
  const [questionPapersTitleStyle, setQuestionPapersTitleStyle] = useState({});
  const [questionPaperCardStyle, setQuestionPaperCardStyle] = useState({});
  const [questionPaperButtonStyle, setQuestionPaperButtonStyle] = useState({});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const trackedSearchRef = useRef("");

  useEffect(()=>{

  axios
    .get(`${API_BASE}/api/papers/semester/${id}`)
    .then(res => setPapers(res.data));

},[id]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/settings`)
      .then(res => {
        setPaperNameStyle(res.data.paperNameStyle || {});
        setQuestionPapersSectionTitle(res.data.questionPapersSectionTitle || "");
        setQuestionPapersTitleStyle(res.data.questionPapersTitleStyle || {});
        setQuestionPaperCardStyle(res.data.questionPaperCardStyle || {});
        setQuestionPaperButtonStyle(res.data.questionPaperButtonStyle || {});
        setSectionPanelBgColor(res.data.sectionPanelBgColor || "#ffffff");
      });
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    if (trackedSearchRef.current.toLowerCase() === term.toLowerCase()) return;

    const timer = setTimeout(() => {
      axios.post(`${API_BASE}/api/signals/search`, { term, source: "papers" }).catch(() => {});
      trackedSearchRef.current = term;
    }, 700);

    return () => clearTimeout(timer);
  }, [search]);


  // 🔍 Filtered Papers
  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (yearFilter === "" || String(p.year) === String(yearFilter))
  );

  const renderPaperTitle = p => {
    const Tag = paperNameStyle.variant || "span";
    return (
      <Tag
        style={{
          color: paperNameStyle.color || questionPaperCardStyle.textColor || "#0f172a",
          fontWeight: paperNameStyle.bold ? "700" : (questionPaperCardStyle.bold ? "700" : "normal"),
          fontStyle: paperNameStyle.italic ? "italic" : (questionPaperCardStyle.italic ? "italic" : "normal"),
          textAlign: paperNameStyle.align || "left",
          fontSize: paperNameStyle.size ? `${paperNameStyle.size}px` : undefined,
          width: "100%"
        }}
      >
        {p.title} ({p.year})
      </Tag>
    );
  };

  const titleStyle = {
    color: questionPapersTitleStyle.color || "#0f172a",
    fontWeight: questionPapersTitleStyle.bold ? "700" : "normal",
    fontStyle: questionPapersTitleStyle.italic ? "italic" : "normal",
    textAlign: questionPapersTitleStyle.align || "left",
    fontSize: questionPapersTitleStyle.size ? `${questionPapersTitleStyle.size}px` : undefined
  };

  const hasGradient = questionPaperCardStyle.gradientStart && questionPaperCardStyle.gradientEnd;
  const cardBackground = hasGradient
    ? `linear-gradient(135deg, ${questionPaperCardStyle.gradientStart}, ${questionPaperCardStyle.gradientEnd})`
    : questionPaperCardStyle.bgColor || undefined;

  const btnStyle = {
    backgroundColor: questionPaperButtonStyle.bgColor || undefined,
    color: questionPaperButtonStyle.textColor || undefined,
    minWidth: questionPaperButtonStyle.minWidth ? `${questionPaperButtonStyle.minWidth}px` : undefined,
    fontSize: questionPaperButtonStyle.size ? `${questionPaperButtonStyle.size}px` : undefined,
    fontWeight: questionPaperButtonStyle.bold ? "700" : "normal",
    fontStyle: questionPaperButtonStyle.italic ? "italic" : "normal",
    borderColor: questionPaperButtonStyle.bgColor || undefined
  };


  return(
    <div className="page-shell">
      <Navbar/>

      <div className="page-content">
      <div className="container mt-4">
        <AdSlot className="mb-3" label="Sponsored" />

        <div className="home-section section-panel" style={{ background: sectionPanelBgColor || "#ffffff" }}>
          <h3 style={titleStyle}>{questionPapersSectionTitle}</h3>

          <div className="papers-search-panel mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-8 col-md-8">
                <input
                  type="text"
                  placeholder="Search Paper..."
                  className="form-control"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="col-4 col-md-4 col-lg-3">
                <input
                  type="number"
                  placeholder="Year"
                  className="form-control"
                  maxLength={4}
                  value={yearFilter}
                  onChange={e => setYearFilter(String(e.target.value || "").slice(0, 4))}
                />
              </div>
            </div>
          </div>

          <div className="papers-list-panel">
            {filteredPapers.map(p => (
              <div
                key={p._id}
                className="card shadow-sm p-3 mb-2 d-flex flex-row justify-content-between align-items-center"
                style={{
                  background: cardBackground,
                  minHeight: questionPaperCardStyle.minHeight ? `${questionPaperCardStyle.minHeight}px` : undefined
                }}
              >
                {renderPaperTitle(p)}

                <a
                  href={`/paper-open/${p._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={btnStyle}
                  onMouseEnter={e => {
                    if (questionPaperButtonStyle.hoverColor) {
                      e.currentTarget.style.backgroundColor = questionPaperButtonStyle.hoverColor;
                      e.currentTarget.style.borderColor = questionPaperButtonStyle.hoverColor;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = questionPaperButtonStyle.bgColor || "";
                    e.currentTarget.style.borderColor = questionPaperButtonStyle.bgColor || "";
                  }}
                  onClick={() => {
                    axios.get(`${API_BASE}/api/papers/download/${p._id}`);
                  }}
                >
                  Open Paper ({p.downloads || 0})
                </a>
              </div>
            ))}
          </div>
        </div>
        <AdSlot className="mt-3" label="Sponsored" />

      </div>
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
