import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../config/api";
import { getSettings } from "../utils/siteData";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const alertMarqueeRef = useRef(null);
  const alertMeasureRef = useRef(null);
  const [siteName, setSiteName] = useState("Study Portal");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoHeight, setLogoHeight] = useState(32);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [headerColor, setHeaderColor] = useState("#0d6efd");
  const [headerLinks, setHeaderLinks] = useState([]);
  const [headerLinkColor, setHeaderLinkColor] = useState("#ffffff");
  const [headerLinkHoverColor, setHeaderLinkHoverColor] = useState("#fbbf24");
  const [headerMenuIconColor, setHeaderMenuIconColor] = useState("#ffffff");
  const [headerMenuBgColor, setHeaderMenuBgColor] = useState("#0f172a");
  const [headerMenuTextColor, setHeaderMenuTextColor] = useState("#f8fafc");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertColor, setAlertColor] = useState("#fff3cd");
  const [alertHeight, setAlertHeight] = useState(32);
  const [alertFontSize, setAlertFontSize] = useState(14);
  const [alertMarqueeDirection, setAlertMarqueeDirection] = useState("rtl");
  const [alertMarqueeSpeed, setAlertMarqueeSpeed] = useState(18);
  const [alertMarqueeGap, setAlertMarqueeGap] = useState(2);
  const [alertStyle, setAlertStyle] = useState({});
  const [siteNameStyle, setSiteNameStyle] = useState({});
  const [useSplitColor, setUseSplitColor] = useState(false);
  const [siteNamePart1, setSiteNamePart1] = useState("");
  const [siteNamePart1Color, setSiteNamePart1Color] = useState("#ffffff");
  const [siteNamePart2, setSiteNamePart2] = useState("");
  const [siteNamePart2Color, setSiteNamePart2Color] = useState("#fbbf24");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 992 : false
  );
  const [headerSearch, setHeaderSearch] = useState("");
  const [headerType, setHeaderType] = useState("all");
  const [alertRepeatCount, setAlertRepeatCount] = useState(2);

  const resolveLogoUrl = url => resolveImageUrl(url, { width: 280, fit: "limit" });

  const parseColorToRgb = color => {
    const value = String(color || "").trim();
    if (!value) return null;
    if (value.startsWith("#")) {
      const hex = value.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        if ([r, g, b].every(Number.isFinite)) return { r, g, b };
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if ([r, g, b].every(Number.isFinite)) return { r, g, b };
      }
      return null;
    }
    const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgbMatch) return null;
    const parts = rgbMatch[1].split(",").map(v => Number(v.trim()));
    if (parts.length < 3) return null;
    const [r, g, b] = parts;
    if ([r, g, b].every(Number.isFinite)) return { r, g, b };
    return null;
  };

  const rgb = parseColorToRgb(headerColor);
  const luminance = rgb
    ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    : 0.25;
  const isLightHeader = luminance > 0.62;

  useEffect(() => {
    getSettings({ ttlMs: 45_000 })
      .then(data => {
        if (data && data.siteName) {
          setSiteName(data.siteName);
        }
        if (data && data.logoUrl) {
          setLogoUrl(data.logoUrl);
        } else {
          setLogoUrl("");
        }
        if (data && data.logoHeight) {
          setLogoHeight(data.logoHeight);
        }
        if (data && data.headerHeight) {
          setHeaderHeight(data.headerHeight);
        }
        if (data && data.headerColor) {
          setHeaderColor(data.headerColor);
        }
        setHeaderLinks(Array.isArray(data.headerLinks) ? data.headerLinks : []);
        setHeaderLinkColor(data.headerLinkColor || "#ffffff");
        setHeaderLinkHoverColor(data.headerLinkHoverColor || "#fbbf24");
        setHeaderMenuIconColor(data.headerMenuIconColor || "#ffffff");
        setHeaderMenuBgColor(data.headerMenuBgColor || "#0f172a");
        setHeaderMenuTextColor(data.headerMenuTextColor || data.headerLinkColor || "#f8fafc");
        setAlertEnabled(!!data.alertEnabled);
        setAlertText(data.alertText || "");
        setAlertColor(data.alertColor || "#fff3cd");
        setAlertHeight(data.alertHeight || 32);
        setAlertFontSize(data.alertFontSize || 14);
        setAlertMarqueeDirection(data.alertMarqueeDirection === "ltr" ? "ltr" : "rtl");
        setAlertMarqueeSpeed(Number(data.alertMarqueeSpeed || 18));
        setAlertMarqueeGap(Number(data.alertMarqueeGap || 2));
        setAlertStyle(data.alertStyle || {});
        setSiteNameStyle(data.siteNameStyle || {});
        setUseSplitColor(data.useSplitColor || false);
        setSiteNamePart1(data.siteNamePart1 || "");
        setSiteNamePart1Color(data.siteNamePart1Color || "#ffffff");
        setSiteNamePart2(data.siteNamePart2 || "");
        setSiteNamePart2Color(data.siteNamePart2Color || "#fbbf24");
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      const height = el.offsetHeight || 0;
      document.documentElement.style.setProperty("--site-header-height", `${height}px`);
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, [alertEnabled, alertText, logoHeight, siteName, headerHeight]);

  useEffect(() => {
    const onResize = () => {
      setIsMobileView(window.innerWidth <= 992);
      if (window.innerWidth > 992) setMenuOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    setHeaderSearch(params.get("q") || "");
    setHeaderType((params.get("type") || "all").toLowerCase());
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = event => {
      const target = event.target;
      if (!target) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (toggleRef.current && toggleRef.current.contains(target)) return;
      setMenuOpen(false);
    };

    const onEscape = event => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!alertEnabled || !alertText) {
      setAlertRepeatCount(2);
      return;
    }

    const computeRepeatCount = () => {
      const containerWidth = alertMarqueeRef.current?.clientWidth || 0;
      const textWidth = alertMeasureRef.current?.getBoundingClientRect?.().width || 0;
      const gapCm = Math.max(0.2, Number(alertMarqueeGap) || 2);
      const gapPx = gapCm * 37.7952755906;
      const oneBlock = textWidth + gapPx;

      if (!containerWidth || !oneBlock) {
        setAlertRepeatCount(2);
        return;
      }

      const needed = Math.ceil((containerWidth * 2) / oneBlock) + 1;
      setAlertRepeatCount(Math.max(2, Math.min(40, needed)));
    };

    computeRepeatCount();
    window.addEventListener("resize", computeRepeatCount);
    return () => window.removeEventListener("resize", computeRepeatCount);
  }, [alertEnabled, alertText, alertFontSize, alertStyle, alertMarqueeGap]);

  const nameStyle = {
    color: siteNameStyle.color || "#ffffff",
    fontWeight: siteNameStyle.bold ? "700" : "normal",
    fontStyle: siteNameStyle.italic ? "italic" : "normal",
    textAlign: siteNameStyle.align || "left",
    display: "inline-block"
  };

  const alertTextStyle = {
    color: alertStyle.color || "#000000",
    fontWeight: alertStyle.bold ? "700" : "normal",
    fontStyle: alertStyle.italic ? "italic" : "normal",
    textAlign: alertStyle.align || "left",
    margin: 0,
    fontSize: alertFontSize ? `${alertFontSize}px` : undefined
  };

  if (!ready) {
    return <div className="site-header-spacer" />;
  }

  const runSearch = event => {
    event.preventDefault();
    const params = new URLSearchParams();
    const q = String(headerSearch || "").trim();
    const type = String(headerType || "all").toLowerCase();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    const query = params.toString();
    navigate(query ? `/?${query}` : "/");
    setMenuOpen(false);
  };

  const clearSearch = () => {
    setHeaderSearch("");
    setHeaderType("all");
    navigate("/");
    setMenuOpen(false);
  };

  const visibleHeaderLinks = headerLinks.filter(link => {
    const url = String(link?.url || "").trim().toLowerCase();
    const label = String(link?.label || "").trim().toLowerCase();
    return url !== "/courses" && label !== "courses";
  });
  const hasHomeLink = visibleHeaderLinks.some(link => {
    const url = String(link?.url || "").trim().toLowerCase();
    const label = String(link?.label || "").trim().toLowerCase();
    return url === "/" || url === "/home" || label === "home";
  });
  const navLinks = hasHomeLink
    ? visibleHeaderLinks
    : [{ label: "Home", url: "/", newTab: false }, ...visibleHeaderLinks];

  return (
    <>
      <div
        className="site-header"
        ref={headerRef}
        style={{
          "--header-link-color": headerLinkColor,
          "--header-link-hover": headerLinkHoverColor,
          "--header-menu-icon-color": headerMenuIconColor,
          "--header-menu-bg": headerMenuBgColor,
          "--header-menu-text": headerMenuTextColor,
          "--header-search-text": isLightHeader ? "#0f172a" : "#ffffff",
          "--header-search-placeholder": isLightHeader ? "rgba(15, 23, 42, 0.58)" : "rgba(255, 255, 255, 0.82)",
          "--header-search-surface": isLightHeader ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.12)",
          "--header-search-input-bg": isLightHeader ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.08)",
          "--header-search-border": isLightHeader ? "rgba(15, 23, 42, 0.18)" : "rgba(255, 255, 255, 0.22)",
          "--header-search-select-bg": isLightHeader ? "rgba(15, 23, 42, 0.08)" : "rgba(15, 23, 42, 0.35)",
          "--header-search-btn-bg": "#f59e0b",
          "--header-search-btn-text": "#111827",
          "--header-search-btn-hover": "#fbbf24",
          "--header-search-clear-bg": isLightHeader ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.16)",
          "--header-search-clear-text": isLightHeader ? "#0f172a" : "#ffffff"
        }}
      >
        <nav
          className="navbar navbar-dark px-3 user-navbar"
          style={{ backgroundColor: headerColor, minHeight: `${headerHeight}px` }}
        >
          <Link className="navbar-brand user-navbar-brand" to="/" style={nameStyle}>
            {logoUrl ? (
              <span className="user-brand-logo-wrap">
                <img
                  src={resolveLogoUrl(logoUrl)}
                  alt={siteName}
                  className="user-navbar-logo"
                  style={{ "--logo-height": `${logoHeight}px` }}
                  height={Math.max(24, Number(logoHeight || 32))}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </span>
            ) : useSplitColor ? (
              (() => {
                const NameTag = siteNameStyle.variant || "span";
                return (
                  <NameTag
                    className="user-brand-text"
                    style={{...nameStyle, fontWeight: siteNameStyle.bold ? "700" : "normal", fontStyle: siteNameStyle.italic ? "italic" : "normal"}}
                  >
                    <span style={{ color: siteNamePart1Color }}>{siteNamePart1}</span>
                    <span style={{ color: siteNamePart2Color }}>{siteNamePart2}</span>
                  </NameTag>
                );
              })()
            ) : (
              (() => {
                const NameTag = siteNameStyle.variant || "span";
                return <NameTag className="user-brand-text" style={nameStyle}>{siteName}</NameTag>;
              })()
            )}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            className="header-toggle-btn"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            &#8801;
          </button>

          {!isMobileView && (
            <form className="header-search-form d-none d-lg-flex" onSubmit={runSearch}>
              <select
                className="header-search-type"
                value={headerType}
                onChange={e => setHeaderType(e.target.value)}
                aria-label="Search category type"
              >
                <option value="all">All</option>
                <option value="university">University</option>
                <option value="college">College</option>
                <option value="school">School</option>
                <option value="other">Other</option>
              </select>
              <input
                className="header-search-input"
                type="search"
                placeholder="Search university, school, college..."
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
                aria-label="Search university, school, college"
              />
              <button type="submit" className="header-search-btn">Search</button>
            </form>
          )}

        <div ref={menuRef} className={`header-links${menuOpen ? " open" : ""}`}>
          {isMobileView && menuOpen && (
            <form className="header-search-form header-search-form-mobile d-lg-none" onSubmit={runSearch}>
              <span className="header-search-mobile-label">Find Fast</span>
              <input
                className="header-search-input"
                type="search"
                placeholder="Search..."
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
                aria-label="Search university, school, college"
              />
              <select
                className="header-search-type"
                value={headerType}
                onChange={e => setHeaderType(e.target.value)}
                aria-label="Search category type"
              >
                <option value="all">All</option>
                <option value="university">University</option>
                <option value="college">College</option>
                <option value="school">School</option>
                <option value="other">Other</option>
              </select>
              <div className="header-search-mobile-actions">
                <button type="submit" className="header-search-btn">Search</button>
                <button type="button" className="header-search-clear-btn" onClick={clearSearch}>Clear</button>
              </div>
            </form>
          )}
          {navLinks.length > 0 ? (
            navLinks.map((link, idx) => {
              const rawUrl = String(link?.url || "").trim();
              const normalizedUrl = rawUrl
                ? (rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`)
                : "/";
              const isExternal = /^https?:\/\//i.test(rawUrl);
              const className = `header-link${idx !== navLinks.length - 1 ? " me-3" : ""}`;
              if (isExternal) {
                return (
                  <a
                    key={`hl-${idx}`}
                    className={className}
                    href={rawUrl}
                    target={link.newTab ? "_blank" : "_self"}
                    rel={link.newTab ? "noopener noreferrer" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label || "Link"}
                  </a>
                );
              }
              return (
                <Link
                  key={`hl-${idx}`}
                  className={className}
                  to={normalizedUrl}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label || "Link"}
                </Link>
              );
            })
          ) : null}
        </div>
        </nav>
        <button
          type="button"
          aria-label="Close menu"
          className={`header-menu-backdrop${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        {alertEnabled && alertText && (
          <div
            className="rounded-0 mb-0 site-alert-bar"
            style={{
              backgroundColor: alertColor,
              padding: "6px 0",
              minHeight: alertHeight ? `${alertHeight}px` : undefined,
              display: "flex",
              "--alert-marquee-speed": `${Math.max(4, Number(alertMarqueeSpeed) || 18)}s`,
              "--alert-marquee-gap": `${Math.max(0.2, Number(alertMarqueeGap) || 2)}cm`,
              "--alert-marquee-direction": alertMarqueeDirection === "ltr" ? "reverse" : "normal"
            }}
          >
            <div ref={alertMarqueeRef} className="site-alert-marquee">
              <span ref={alertMeasureRef} className="site-alert-measure" style={alertTextStyle}>
                {alertText}
              </span>
              <div className="site-alert-track">
                {(() => {
                  const AlertTag = alertStyle.variant || "p";
                  return (
                    <>
                      <div className="site-alert-sequence">
                        {Array.from({ length: alertRepeatCount }).map((_, idx) => (
                          <AlertTag key={`alert-a-${idx}`} className="site-alert-item" style={alertTextStyle}>
                            {alertText}
                          </AlertTag>
                        ))}
                      </div>
                      <div className="site-alert-sequence" aria-hidden="true">
                        {Array.from({ length: alertRepeatCount }).map((_, idx) => (
                          <AlertTag key={`alert-b-${idx}`} className="site-alert-item" style={alertTextStyle}>
                            {alertText}
                          </AlertTag>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="site-header-spacer" />

    </>
  );
}

export default Navbar;
