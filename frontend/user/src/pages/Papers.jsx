import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdSlot from "../components/AdSlot";
import { API_BASE } from "../config/api";
import { toRouteSegment } from "../utils/slugs";
import { markPaperFlow } from "../utils/navigationFlow";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";
import { getCourses, getSemesters, getSettings, getUniversities } from "../utils/siteData";

export default function Papers(){

  const { universitySlug, courseSlug, semesterSlug } = useParams();
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [paperNameStyle, setPaperNameStyle] = useState({});
  const [questionPapersSectionTitle, setQuestionPapersSectionTitle] = useState("");
  const [questionPapersTitleStyle, setQuestionPapersTitleStyle] = useState({});
  const [questionPaperCardStyle, setQuestionPaperCardStyle] = useState({});
  const [questionPaperButtonStyle, setQuestionPaperButtonStyle] = useState({});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const [settingsSnapshot, setSettingsSnapshot] = useState(null);
  const trackedSearchRef = useRef("");

  useEffect(()=>{
    const load = async () => {
      if (!universitySlug || !courseSlug || !semesterSlug) {
        setPapers([]);
        return;
      }

      const [uniRes, courseRes, semRes] = await Promise.all([
        getUniversities({ ttlMs: 45_000 }),
        getCourses({ ttlMs: 45_000 }),
        getSemesters({ ttlMs: 45_000 })
      ]);

      const universities = uniRes || [];
      const courses = courseRes || [];
      const semesters = semRes || [];

      const uni = universities.find(u => toRouteSegment(u.name, "university") === universitySlug) || null;
      const course = courses.find(c =>
        String(c.universityId || "") === String(uni?._id || "") &&
        toRouteSegment(c.name, "course") === courseSlug
      ) || null;
      const semester = semesters.find(s =>
        String((s.courseId && s.courseId._id) || s.courseId || "") === String(course?._id || "") &&
        toRouteSegment(s.name, "semester") === semesterSlug
      ) || null;

      setSelectedUniversity(uni);
      setSelectedCourse(course);
      setSelectedSemester(semester);

      if (!semester?._id) {
        setPapers([]);
        navigate("/", { replace: true });
        return;
      }

      const res = await axios.get(`${API_BASE}/api/papers/semester/${semester._id}`);
      setPapers(res.data || []);
    };

    load().catch(() => {
      setPapers([]);
      navigate("/", { replace: true });
    });

},[courseSlug, navigate, semesterSlug, universitySlug]);

  useEffect(() => {
    getSettings({ ttlMs: 45_000 })
      .then(data => {
        setSettingsSnapshot(data || {});
        setPaperNameStyle(data.paperNameStyle || {});
        setQuestionPapersSectionTitle(data.questionPapersSectionTitle || "");
        setQuestionPapersTitleStyle(data.questionPapersTitleStyle || {});
        setQuestionPaperCardStyle(data.questionPaperCardStyle || {});
        setQuestionPaperButtonStyle(data.questionPaperButtonStyle || {});
        setSectionPanelBgColor(data.sectionPanelBgColor || "#ffffff");
      });
  }, []);

  useEffect(() => {
    if (!settingsSnapshot) return;
    const context = {
      university: selectedUniversity?.name || "",
      course: selectedCourse?.name || "",
      semester: selectedSemester?.name || "",
      universitySlug: universitySlug || "",
      courseSlug: courseSlug || "",
      semesterSlug: semesterSlug || ""
    };
    const hasRouteSeo = applySeoByRoute({
      settings: settingsSnapshot,
      context,
      pathname: window.location.pathname
    });
    if (!hasRouteSeo) {
      applySeoByPage({
        settings: settingsSnapshot,
        pageKey: "papers",
        context,
        fallback: {
          title:
            selectedSemester?.name && selectedCourse?.name
              ? `${selectedSemester.name} Papers | ${selectedCourse.name}`
              : "Question Papers",
          canonicalPath: `/${universitySlug || ""}/${courseSlug || ""}/${semesterSlug || ""}`
        }
      });
    }
  }, [
    courseSlug,
    selectedCourse,
    selectedSemester,
    selectedUniversity,
    semesterSlug,
    settingsSnapshot,
    universitySlug
  ]);

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

  const buildPaperPath = paper => {
    if (!selectedUniversity || !selectedCourse || !selectedSemester) return "/";
    return `/${toRouteSegment(selectedUniversity.name, "university")}/${toRouteSegment(selectedCourse.name, "course")}/${toRouteSegment(selectedSemester.name, "semester")}/${toRouteSegment(paper.title, "paper")}`;
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
            <div className="papers-filters">
              <div className="papers-filter-item">
                <input
                  type="text"
                  placeholder="Search Paper..."
                  className="form-control"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="papers-filter-item papers-filter-year">
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
                className="card shadow-sm paper-row-card mb-2"
                style={{
                  background: cardBackground,
                  minHeight: questionPaperCardStyle.minHeight ? `${questionPaperCardStyle.minHeight}px` : undefined
                }}
              >
                <div className="paper-row-title">
                  {renderPaperTitle(p)}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm paper-open-btn"
                  style={btnStyle}
                  onClick={() => {
                    const targetPath = buildPaperPath(p);
                    const paperRouteSlug = toRouteSegment(p.title, "paper");
                    markPaperFlow(universitySlug, courseSlug, semesterSlug, paperRouteSlug);
                    axios.get(`${API_BASE}/api/papers/download/${p._id}`).catch(() => {});
                    navigate(targetPath);
                  }}
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
                >
                  Open Paper ({p.downloads || 0})
                </button>
              </div>
            ))}
            {filteredPapers.length === 0 && (
              <div className="papers-empty-state">
                Koi paper match nahi mila. Search ya year filter change karke dekhein.
              </div>
            )}
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
