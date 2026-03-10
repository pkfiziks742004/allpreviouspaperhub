import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, resolveImageUrl } from "../config/api";
import { getSettings, getUniversities } from "../utils/siteData";

import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { toRouteSegment } from "../utils/slugs";
import { markUniversityFlow } from "../utils/navigationFlow";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";

const Footer = lazy(() => import("../components/Footer"));
const RatingPopup = lazy(() => import("../components/RatingPopup"));
const AdSlot = lazy(() => import("../components/AdSlot"));

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const [notices, setNotices] = useState([]);

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
        setSectionPanelBgColor(data.sectionPanelBgColor || "#ffffff");
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
    Promise.allSettled([loadSettings(), loadUniversities()]).finally(() => {
      setLoading(false);
    });
  }, [loadSettings, loadUniversities]);

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

  const queryParams = new URLSearchParams(location.search || "");
  const searchQuery = String(queryParams.get("q") || "").trim().toLowerCase();
  const searchType = String(queryParams.get("type") || "all").trim().toLowerCase();
  const isSearchMode = Boolean(searchQuery) || searchType !== "all";

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
  const assignedUniversityIds = new Set(
    (courseSections || [])
      .filter(section => {
        const sectionType = String(section?.sectionType || "course").toLowerCase();
        const isVisible = section?.active !== false && !section?.comingSoon;
        return sectionType === "university" && isVisible;
      })
      .flatMap(section => (section.itemIds || section.courseIds || []).map(id => String(id || "")))
      .filter(Boolean)
  );
  const visibleUniversities = isSearchMode
    ? filteredUniversities
    : filteredUniversities.filter(uni => !assignedUniversityIds.has(String(uni._id || "")));

  const resolveLogoUrl = url =>
    resolveImageUrl(url, { width: 112, height: 112, fit: "limit" });

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

  const renderDeferredFallback = className => (
    <div className={className} style={{ minHeight: "96px" }} />
  );

  return (
    <div className="page-shell">
      <Suspense fallback={null}>
        <RatingPopup />
      </Suspense>

      <Navbar />
      <div className="page-content">
      <Banner />

      <div className="container mt-5">
        <Suspense fallback={renderDeferredFallback("mb-3")}>
          <AdSlot className="mb-3" label="Sponsored" />
        </Suspense>
        {loading ? (
          <div className="home-loading-shell">
            <div className="home-loading-title shimmer-block" />
            <div className="home-loading-subtitle shimmer-block" />
            <div className="home-loading-panel">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`home-skeleton-${idx}`} className="home-loading-card shimmer-block" />
              ))}
            </div>
          </div>
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
            {visibleUniversities.map(u => (
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
                        src={resolveLogoUrl(u.logoUrl)}
                        alt={u.name}
                        className="card-logo"
                        width="56"
                        height="56"
                        loading="lazy"
                        decoding="async"
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

            {visibleUniversities.length === 0 && (
              <div className="col-12 text-muted">
                No matching results. Try another search or change filter.
              </div>
            )}
          </div>

        </div>

        {!isSearchMode && courseSections.map((section, idx) => {
          const sectionType = String(section?.sectionType || "").toLowerCase() || "course";
          if (sectionType !== "university") return null;

          const sectionUniversities = ((section.itemIds || section.courseIds || []))
            .map(id => universities.find(u => String(u._id) === String(id)))
            .filter(u => filteredUniversities.some(row => String(row._id) === String(u?._id || "")))
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
                  {sectionUniversities.map(u => (
                    <div key={u._id} className="cards-grid-item">
                      <div
                        className="card modern-card modern-card--large h-100 text-center"
                        style={{ ...buildCardStyle("section"), cursor: "pointer" }}
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
                              src={resolveLogoUrl(u.logoUrl)}
                              alt={u.name}
                              className="card-logo"
                              width="56"
                              height="56"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="card-logo-fallback">
                              {(u.name || "").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {renderName(u.name, universityNameStyle, "h5")}
                          <div className="card-subtitle" style={buildTextStyle("section")}>{u.type || "University"}</div>
                          {u.comingSoon && (
                            <div className="badge bg-warning text-dark mt-2">
                              {u.comingSoonText || "Coming soon"}
                            </div>
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
        <Suspense fallback={renderDeferredFallback("mt-3")}>
          <AdSlot className="mt-3" label="Sponsored" />
        </Suspense>
      </div>
      </div>

      <div className="footer-top-gap" />
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
