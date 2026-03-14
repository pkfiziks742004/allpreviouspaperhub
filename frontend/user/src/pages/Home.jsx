import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, resolveImageUrl } from "../config/api";
import { getSettings, getUniversities, peekSettings, peekUniversities } from "../utils/siteData";
import { getJson } from "../utils/http";

import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import DeferredFooterLogoSlider from "../components/DeferredFooterLogoSlider";
import DeferredFooter from "../components/DeferredFooter";
import DeferredRatingPopup from "../components/DeferredRatingPopup";
import DeferredAdSlot from "../components/DeferredAdSlot";
import { toRouteSegment } from "../utils/slugs";
import { markUniversityFlow } from "../utils/navigationFlow";
import { useDeferredUiReady } from "../utils/deferredUi";
import { useDeviceProfile } from "../utils/useDeviceProfile";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";

const initialSettings = peekSettings() || {};
const initialUniversities = peekUniversities() || [];
const hasInitialSettings = Object.keys(initialSettings).length > 0;
const hasInitialUniversities = Array.isArray(initialUniversities) && initialUniversities.length > 0;
const DEFAULT_HOME_TITLE = initialSettings.homeTitle || "Welcome to All Previous Paper Hub";
const DEFAULT_HOME_SUBTITLE =
  initialSettings.homeSubtitle || "Download question papers, notes, and syllabus in one place.";
const DEFAULT_UNIVERSITIES_TITLE =
  initialSettings.universitiesSectionTitle || "Universities / Colleges / Schools / Entrance Exam";
const DEFAULT_UNIVERSITIES_SUBTITLE =
  initialSettings.universitiesSectionSubtitle || "Select a card to view its courses.";

export default function Home() {
  const deviceProfile = useDeviceProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!(hasInitialSettings && hasInitialUniversities));
  const [universities, setUniversities] = useState(initialUniversities);
  const [homeTitle, setHomeTitle] = useState(DEFAULT_HOME_TITLE);
  const [homeSubtitle, setHomeSubtitle] = useState(DEFAULT_HOME_SUBTITLE);
  const [homeTitleStyle, setHomeTitleStyle] = useState(initialSettings.homeTitleStyle || {});
  const [homeSubtitleStyle, setHomeSubtitleStyle] = useState(initialSettings.homeSubtitleStyle || {});
  const [courseSections, setCourseSections] = useState(Array.isArray(initialSettings.courseSections) ? initialSettings.courseSections : []);
  const [cardStyles, setCardStyles] = useState(initialSettings.cardStyles || {});
  const [universityNameStyle, setUniversityNameStyle] = useState(initialSettings.universityNameStyle || {});
  const [universitiesSectionTitle, setUniversitiesSectionTitle] = useState(DEFAULT_UNIVERSITIES_TITLE);
  const [universitiesSectionSubtitle, setUniversitiesSectionSubtitle] = useState(DEFAULT_UNIVERSITIES_SUBTITLE);
  const [universitiesTitleStyle, setUniversitiesTitleStyle] = useState(initialSettings.universitiesTitleStyle || {});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState(initialSettings.sectionPanelBgColor || "#ffffff");
  const [notices, setNotices] = useState([]);
  const [expandedMobileCards, setExpandedMobileCards] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const isMobileView = deviceProfile.isMobile;
  const isConstrainedMobile = deviceProfile.isMobile && deviceProfile.isConstrained;
  const deferredUiReady = useDeferredUiReady(
    isConstrainedMobile ? 2800 : isMobileView ? 2200 : 1800
  );

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
    if (!deferredUiReady) return undefined;

    let active = true;
    getJson(`${API_BASE}/api/signals/notices`)
      .then(data => {
        if (active) setNotices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setNotices([]);
      });

    return () => {
      active = false;
    };
  }, [deferredUiReady]);

  useEffect(() => {
    if (!isMobileView) {
      setExpandedMobileCards(true);
      setExpandedSections({});
      return undefined;
    }

    setExpandedMobileCards(false);
    setExpandedSections({});
    return undefined;
  }, [isMobileView]);

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

  const prioritizeAvailableUniversities = list => {
    const available = [];
    const comingSoon = [];

    (list || []).forEach(item => {
      if (item?.comingSoon) {
        comingSoon.push(item);
        return;
      }

      available.push(item);
    });

    return [...available, ...comingSoon];
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
  const sectionFilteredUniversities = filteredUniversities.filter(
    uni => !assignedUniversityIds.has(String(uni._id || ""))
  );
  const visibleUniversities = prioritizeAvailableUniversities(
    isSearchMode
    ? filteredUniversities
    : sectionFilteredUniversities.length > 0
      ? sectionFilteredUniversities
      : filteredUniversities
  );
  const displayedUniversities =
    isMobileView && !expandedMobileCards && !isSearchMode
      ? visibleUniversities.slice(0, 6)
      : visibleUniversities;

  const resolveLogoUrl = url =>
    resolveImageUrl(url, {
      width: isConstrainedMobile ? 72 : isMobileView ? 84 : 112,
      height: isConstrainedMobile ? 72 : isMobileView ? 84 : 112,
      fit: "limit",
      quality: isConstrainedMobile ? "auto:low" : "auto"
    });

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

  const renderName = (text, style, fallbackTag, className = "") => {
    const Tag = style.variant || fallbackTag || "span";
    return (
      <Tag
        className={className || undefined}
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

  const getHomeCardTitleClass = name => {
    const text = String(name || "").trim();
    const length = text.length;
    if (length >= 34) return "home-card-title home-card-title--xs";
    if (length >= 26) return "home-card-title home-card-title--sm";
    if (length >= 18) return "home-card-title home-card-title--md";
    return "home-card-title home-card-title--lg";
  };

  return (
    <div className="page-shell">
      <DeferredRatingPopup enabled={!isConstrainedMobile && deferredUiReady} timeoutMs={0} />

      <Navbar />
      <div className="page-content">
      <Banner />

      <div className="container mt-5">
        <DeferredAdSlot
          className="mb-3"
          label="Sponsored"
          enabled={deferredUiReady}
          timeoutMs={isConstrainedMobile ? 1800 : isMobileView ? 900 : 0}
        />
        {renderText(homeTitle, homeTitleStyle, "h1")}

        {renderText(homeSubtitle, homeSubtitleStyle, "p")}
        {loading ? (
          <div className="home-loading-shell">
            <div className="section-header">
              <h2 className="section-title" style={sectionTitleStyle(universitiesTitleStyle)}>
                {universitiesSectionTitle}
              </h2>
              <div className="section-subtitle">{universitiesSectionSubtitle}</div>
            </div>
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
        <div className="home-section section-panel mt-4" style={{ background: sectionPanelBgColor || "#ffffff" }}>
          <div className="section-header">
            <h2 className="section-title" style={sectionTitleStyle(universitiesTitleStyle)}>{universitiesSectionTitle}</h2>
            <div className="section-subtitle">{universitiesSectionSubtitle}</div>
          </div>

          <div className="cards-grid cards-grid-4-6">
            {displayedUniversities.map(u => (
              <div key={u._id} className="cards-grid-item">
                <div
                  className={`card modern-card modern-card--large home-card h-100 text-center${u.comingSoon ? " card-state-coming-soon" : ""}`}
                  style={{ cursor: u.comingSoon ? "not-allowed" : "pointer", ...buildCardStyle("university") }}
                  aria-disabled={u.comingSoon ? "true" : undefined}
                  onClick={() => {
                    if (u.comingSoon) return;
                    const uniSlug = toRouteSegment(u.name, "university");
                    markUniversityFlow(uniSlug);
                    navigate(`/${uniSlug}`, { state: { fromUniversityClick: true } });
                  }}
                >
                  <div className="card-body home-card-body">
                    <div className="home-card-logo-slot">
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
                    </div>
                    <div className="home-card-content">
                      {renderName(u.name, universityNameStyle, "h5", getHomeCardTitleClass(u.name))}
                      <div className="card-subtitle home-card-subtitle" style={buildTextStyle("university")}>{u.type || "University"}</div>
                    </div>
                    {u.comingSoon && (
                      <div className="badge bg-warning text-dark mt-2 home-card-badge">
                        {u.comingSoonText || "Coming soon"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {displayedUniversities.length === 0 && (
              <div className="col-12 text-muted">
                No matching results. Try another search or change filter.
              </div>
            )}
          </div>
          {isMobileView && !isSearchMode && visibleUniversities.length > 6 && (
            <div className="home-section-action">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setExpandedMobileCards(value => !value)}
              >
                {expandedMobileCards ? "Show less" : `Show all (${visibleUniversities.length})`}
              </button>
            </div>
          )}

        </div>

        {!isSearchMode && courseSections.map((section, idx) => {
          const sectionType = String(section?.sectionType || "").toLowerCase() || "course";
          if (sectionType !== "university") return null;

          const sectionUniversities = prioritizeAvailableUniversities(
            ((section.itemIds || section.courseIds || []))
              .map(id => universities.find(u => String(u._id) === String(id)))
              .filter(u => filteredUniversities.some(row => String(row._id) === String(u?._id || "")))
              .filter(Boolean)
          );
          const displayedSectionUniversities =
            isMobileView && !expandedSections[idx]
              ? sectionUniversities.slice(0, 4)
              : sectionUniversities;

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
                <h2 className="section-title" style={sectionTitleStyle(section.titleStyle || {})}>
                  {section.title}
                </h2>
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
                  {displayedSectionUniversities.map(u => (
                    <div key={u._id} className="cards-grid-item">
                      <div
                        className={`card modern-card modern-card--large home-card h-100 text-center${u.comingSoon ? " card-state-coming-soon" : ""}`}
                        style={{ ...buildCardStyle("section"), cursor: u.comingSoon ? "not-allowed" : "pointer" }}
                        aria-disabled={u.comingSoon ? "true" : undefined}
                        onClick={() => {
                          if (u.comingSoon) return;
                          const uniSlug = toRouteSegment(u.name, "university");
                          markUniversityFlow(uniSlug);
                          navigate(`/${uniSlug}`, { state: { fromUniversityClick: true } });
                        }}
                      >
                        <div className="card-body home-card-body">
                          <div className="home-card-logo-slot">
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
                          </div>
                          <div className="home-card-content">
                            {renderName(u.name, universityNameStyle, "h5", getHomeCardTitleClass(u.name))}
                            <div className="card-subtitle home-card-subtitle" style={buildTextStyle("section")}>{u.type || "University"}</div>
                          </div>
                          {u.comingSoon && (
                            <div className="badge bg-warning text-dark mt-2 home-card-badge">
                              {u.comingSoonText || "Coming soon"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isMobileView && sectionUniversities.length > 4 && isActive && !isComingSoon && (
                <div className="home-section-action">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() =>
                      setExpandedSections(prev => ({
                        ...prev,
                        [idx]: !prev[idx]
                      }))
                    }
                  >
                    {expandedSections[idx] ? "Show less" : `Show all (${sectionUniversities.length})`}
                  </button>
                </div>
              )}
            </div>
          );
        })}

          </>
        )}
        <DeferredAdSlot
          className="mt-3"
          label="Sponsored"
          enabled={deferredUiReady}
          timeoutMs={isConstrainedMobile ? 2200 : isMobileView ? 1200 : 0}
        />
      </div>
      </div>

      <div className="mt-4">
        <DeferredFooterLogoSlider
          flush
          enabled={!isConstrainedMobile && deferredUiReady}
          timeoutMs={isMobileView ? 1800 : 0}
        />
      </div>

      <DeferredFooter flushTop enabled={deferredUiReady} timeoutMs={isMobileView ? 600 : 0} />
    </div>
  );
}
