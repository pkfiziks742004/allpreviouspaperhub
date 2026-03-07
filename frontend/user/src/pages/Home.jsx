import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, resolveApiUrl } from "../config/api";
import { getCourses, getSettings, getUniversities } from "../utils/siteData";

import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import Footer from "../components/Footer";
import RatingPopup from "../components/RatingPopup";
import AdSlot from "../components/AdSlot";
import { toRouteSegment } from "../utils/slugs";
import { markUniversityFlow } from "../utils/navigationFlow";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const [homeTitleStyle, setHomeTitleStyle] = useState({});
  const [homeSubtitleStyle, setHomeSubtitleStyle] = useState({});
  const [courseSections, setCourseSections] = useState([]);
  const [cardStyles, setCardStyles] = useState({});
  const [universityNameStyle, setUniversityNameStyle] = useState({});
  const [universitiesSectionTitle, setUniversitiesSectionTitle] = useState("");
  const [universitiesSectionSubtitle, setUniversitiesSectionSubtitle] = useState("");
  const [universitiesTitleStyle, setUniversitiesTitleStyle] = useState({});
  const [courseButtonStyle, setCourseButtonStyle] = useState({});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const [sectionCardButtonEnabled, setSectionCardButtonEnabled] = useState(true);
  const [sectionCardButtonText, setSectionCardButtonText] = useState("View Details");
  const [notices, setNotices] = useState([]);
  const [typeActionLabels, setTypeActionLabels] = useState({
    university: "View Semesters",
    college: "View Semesters",
    school: "View Classes",
    entranceExam: "View Exam Papers",
    other: "View Details"
  });

  const loadCourses = useCallback(() => {
    return getCourses({ ttlMs: 45_000 }).then(data => setCourses(data || []));
  }, []);

  const loadUniversities = useCallback(() => {
    return getUniversities({ ttlMs: 45_000 }).then(data => {
      setUniversities(data || []);
    });
  }, []);

  const loadSettings = useCallback(() => {
    return getSettings({ ttlMs: 45_000 }).then(data => {
        if (data && data.homeTitle) {
          setHomeTitle(data.homeTitle);
        }
        if (data && data.homeSubtitle) {
          setHomeSubtitle(data.homeSubtitle);
        }
        setHomeTitleStyle(data.homeTitleStyle || {});
        setHomeSubtitleStyle(data.homeSubtitleStyle || {});
        setCourseSections(Array.isArray(data.courseSections) ? data.courseSections : []);
        setCardStyles(data.cardStyles || {});
        setUniversityNameStyle(data.universityNameStyle || {});
        setUniversitiesSectionTitle(data.universitiesSectionTitle || "");
        setUniversitiesSectionSubtitle(data.universitiesSectionSubtitle || "");
        setUniversitiesTitleStyle(data.universitiesTitleStyle || {});
        setCourseButtonStyle(data.courseButtonStyle || {});
        setSectionPanelBgColor(data.sectionPanelBgColor || "#ffffff");
        setSectionCardButtonEnabled(
          typeof data.sectionCardButtonEnabled === "boolean"
            ? data.sectionCardButtonEnabled
            : true
        );
        setSectionCardButtonText(data.sectionCardButtonText || "View Details");
        setTypeActionLabels({
          university: "View Semesters",
          college: "View Semesters",
          school: "View Classes",
          entranceExam: "View Exam Papers",
          other: "View Details",
          ...(data.typeActionLabels || {})
        });
        const settings = data || {};
        const hasRouteSeo = applySeoByRoute({
          settings,
          context: {},
          pathname: window.location.pathname
        });
        if (!hasRouteSeo) {
          applySeoByPage({
            settings,
            pageKey: "home",
            fallback: {
              title: settings.homeTitle || "All Previous Paper Hub",
              description: settings.homeSubtitle || "",
              canonicalPath: "/"
            }
          });
        }
      });
  }, []);

  useEffect(() => {
    Promise.allSettled([loadCourses(), loadSettings(), loadUniversities()]).finally(() => {
      setLoading(false);
    });
  }, [loadCourses, loadSettings, loadUniversities]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/signals/notices`)
      .then(res => setNotices(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotices([]));
  }, []);

  const renderText = (text, style, fallbackTag) => {
    const Tag = (style && style.variant) || fallbackTag || "p";
    const textStyle = {
      color: style && style.color ? style.color : undefined,
      fontWeight: style && style.bold ? "700" : "normal",
      fontStyle: style && style.italic ? "italic" : "normal",
      textAlign: style && style.align ? style.align : undefined
    };
    return <Tag style={textStyle}>{text}</Tag>;
  };

  const courseMap = new Map(courses.map(c => [c._id, c]));
  const queryParams = new URLSearchParams(location.search || "");
  const searchQuery = String(queryParams.get("q") || "").trim().toLowerCase();
  const searchType = String(queryParams.get("type") || "all").trim().toLowerCase();

  const normalizeType = value => {
    const t = String(value || "").toLowerCase();
    if (t.includes("university")) return "university";
    if (t.includes("college")) return "college";
    if (t.includes("school")) return "school";
    if (t.includes("entrance") || t.includes("exam")) return "other";
    return "other";
  };

  const filteredUniversities = universities.filter(u => {
    const matchesText =
      !searchQuery ||
      String(u.name || "").toLowerCase().includes(searchQuery) ||
      String(u.type || "").toLowerCase().includes(searchQuery);
    const uniType = normalizeType(u.type || "");
    const matchesType = searchType === "all" || uniType === searchType;
    return matchesText && matchesType;
  });

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

  const buildCardStyle = key => {
    const style = (cardStyles && cardStyles[key]) || {};
    const hasGradient = style.gradientStart && style.gradientEnd;
    const background = hasGradient
      ? `linear-gradient(135deg, ${style.gradientStart}, ${style.gradientEnd})`
      : style.bgColor || undefined;
    return {
      background,
      color: style.textColor || undefined,
      minHeight: style.minHeight ? `${style.minHeight}px` : undefined,
      maxWidth: style.maxWidth ? `${style.maxWidth}px` : undefined
    };
  };

  const buildTextStyle = key => {
    const style = (cardStyles && cardStyles[key]) || {};
    return {
      color: style.textColor || undefined,
      fontWeight: style.bold ? "700" : "normal",
      fontStyle: style.italic ? "italic" : "normal"
    };
  };

  const renderName = (text, style, fallbackTag) => {
    const Tag = style.variant || fallbackTag || "span";
    return (
      <Tag
        style={{
          color: style.color || undefined,
          fontWeight: style.bold ? "700" : "normal",
          fontStyle: style.italic ? "italic" : "normal",
          textAlign: style.align || undefined,
          fontSize: style.size ? `${style.size}px` : undefined,
          width: "100%"
        }}
      >
        {text}
      </Tag>
    );
  };

  const sectionTitleStyle = style => ({
    color: style && style.color ? style.color : undefined,
    fontWeight: style && style.bold ? "700" : "normal",
    fontStyle: style && style.italic ? "italic" : "normal",
    textAlign: style && style.align ? style.align : undefined,
    fontSize: style && style.size ? `${style.size}px` : undefined,
    textDecoration: style && style.underline ? "underline" : "none"
  });

  const sectionDescriptionStyle = style => ({
    color: style && style.color ? style.color : undefined,
    fontWeight: style && style.bold ? "700" : "normal",
    fontStyle: style && style.italic ? "italic" : "normal",
    textAlign: style && style.align ? style.align : undefined,
    fontSize: style && style.size ? `${style.size}px` : undefined,
    textDecoration: style && style.underline ? "underline" : "none"
  });

  const courseBtnStyle = {
    backgroundColor: courseButtonStyle.bgColor || undefined,
    color: courseButtonStyle.textColor || undefined,
    minWidth: courseButtonStyle.minWidth ? `${courseButtonStyle.minWidth}px` : undefined,
    fontSize: courseButtonStyle.size ? `${courseButtonStyle.size}px` : undefined,
    fontWeight: courseButtonStyle.bold ? "700" : "normal",
    fontStyle: courseButtonStyle.italic ? "italic" : "normal",
    borderColor: courseButtonStyle.bgColor || undefined
  };

  const getTypeKey = type => {
    const t = String(type || "").toLowerCase();
    if (t.includes("entrance")) return "entranceExam";
    if (t.includes("school")) return "school";
    if (t.includes("college")) return "college";
    if (t.includes("university")) return "university";
    return "other";
  };

  const getActionLabelByType = type => {
    const key = getTypeKey(type);
    return (
      (typeActionLabels && typeActionLabels[key]) ||
      "View Semesters"
    );
  };

  const getCourseButtonLabel = course => {
    if (course && course.buttonLabel && String(course.buttonLabel).trim()) {
      return course.buttonLabel;
    }
    const uniType = universities.find(u => String(u._id) === String(course.universityId))?.type;
    return getActionLabelByType(uniType);
  };

  const findUniversity = universityId =>
    universities.find(u => String(u._id) === String(universityId));

  const openUniversityFromCourse = course => {
    const uni = findUniversity(course?.universityId);
    if (!uni) return;
    if (uni.comingSoon) return;
    const uniSlug = toRouteSegment(uni.name, "university");
    markUniversityFlow(uniSlug);
    navigate(`/${uniSlug}`, { state: { fromUniversityClick: true } });
  };

  return (
    <div className="page-shell">
      <RatingPopup />

      <Navbar />
      <div className="page-content">
      <Banner />

      <div className="container mt-5">
        <AdSlot className="mb-3" label="Sponsored" />
        {loading ? (
          <div className="text-center text-muted py-5">Loading...</div>
        ) : (
          <>
        {notices.length > 0 && (
          <div className="alert alert-warning mb-3">
            {notices.slice(0, 3).map(item => (
              <div key={item.id || `${item.title}-${item.createdAt}`} className="mb-1">
                <strong>{String(item.type || "notice").replace("-", " ")}:</strong> {item.title}
              </div>
            ))}
          </div>
        )}

        {renderText(homeTitle, homeTitleStyle, "h2")}

        {renderText(homeSubtitle, homeSubtitleStyle, "p")}

        <div className="home-section section-panel mt-4" style={{ background: sectionPanelBgColor || "#ffffff" }}>
          <div className="section-header">
            <h4 className="section-title" style={sectionTitleStyle(universitiesTitleStyle)}>{universitiesSectionTitle}</h4>
            <div className="section-subtitle">{universitiesSectionSubtitle}</div>
          </div>

          <div className="cards-grid cards-grid-4-6">
            {filteredUniversities.map(u => (
              <div key={u._id} className="cards-grid-item">
                <div
                  className="card modern-card modern-card--large h-100 text-center"
                  style={{ cursor: "pointer", ...buildCardStyle("university") }}
                  onClick={() => {
                    if (u.comingSoon) return;
                    const uniSlug = toRouteSegment(u.name, "university");
                    markUniversityFlow(uniSlug);
                    navigate(`/${uniSlug}`, { state: { fromUniversityClick: true } });
                  }}
                >
                  <div className="card-body">
                    {u.logoUrl ? (
                      <img
                        src={resolveUrl(u.logoUrl)}
                        alt={u.name}
                        className="card-logo"
                      />
                    ) : (
                      <div className="card-logo-fallback">
                        {(u.name || "").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {renderName(u.name, universityNameStyle, "h5")}
                    <div className="card-subtitle" style={buildTextStyle("university")}>{u.type || "University"}</div>
                    {u.comingSoon && (
                      <div className="badge bg-warning text-dark mt-2">
                        {u.comingSoonText || "Coming soon"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUniversities.length === 0 && (
              <div className="col-12 text-muted">
                No matching results. Try another search or change filter.
              </div>
            )}
          </div>

        </div>

        {courseSections.map((section, idx) => {
          const sectionCourses = (section.courseIds || [])
            .map(id => courseMap.get(id))
            .filter(Boolean);

          const isActive = section.active !== false;
          const isComingSoon = !!section.comingSoon;

          if (!isActive && !isComingSoon) return null;

          return (
            <div
              className="home-section section-panel mt-4"
              key={`section-${idx}`}
              style={{ background: sectionPanelBgColor || "#ffffff" }}
            >
              {section.title && (
                <h4 className="section-title" style={sectionTitleStyle(section.titleStyle || {})}>
                  {section.title}
                </h4>
              )}
              {section.description && (
                <p className="section-subtitle" style={sectionDescriptionStyle(section.descriptionStyle || {})}>
                  {section.description}
                </p>
              )}

              {(!isActive || isComingSoon) ? (
                <div className="alert alert-warning text-center">
                  {section.comingSoonText || "Coming soon"}
                </div>
              ) : (
                <div className="cards-grid cards-grid-4-6">
                  {sectionCourses.map(c => (
                    <div key={c._id} className="cards-grid-item">
                      <div
                        className="card modern-card h-100 text-center"
                        style={{ ...buildCardStyle("section"), cursor: "pointer" }}
                        onClick={() => {
                          openUniversityFromCourse(c);
                        }}
                      >
                        <div className="card-body">
                          <h5 className="card-title" style={buildTextStyle("section")}>{c.name}</h5>
                          {sectionCardButtonEnabled && (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm mt-2"
                              style={courseBtnStyle}
                              onClick={e => {
                                e.stopPropagation();
                                openUniversityFromCourse(c);
                              }}
                              onMouseEnter={e => {
                                if (courseButtonStyle.hoverColor) {
                                  e.currentTarget.style.backgroundColor = courseButtonStyle.hoverColor;
                                  e.currentTarget.style.borderColor = courseButtonStyle.hoverColor;
                                }
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = courseButtonStyle.bgColor || "";
                                e.currentTarget.style.borderColor = courseButtonStyle.bgColor || "";
                              }}
                            >
                              {c.buttonLabel || sectionCardButtonText || getCourseButtonLabel(c) || "View Details"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

          </>
        )}
        <AdSlot className="mt-3" label="Sponsored" />
      </div>
      </div>

      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
