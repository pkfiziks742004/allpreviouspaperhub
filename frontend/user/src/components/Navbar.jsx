import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE, resolveApiUrl } from "../config/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
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
  const [alertStyle, setAlertStyle] = useState({});
  const [siteNameStyle, setSiteNameStyle] = useState({});
  const [useSplitColor, setUseSplitColor] = useState(false);
  const [siteNamePart1, setSiteNamePart1] = useState("");
  const [siteNamePart1Color, setSiteNamePart1Color] = useState("#ffffff");
  const [siteNamePart2, setSiteNamePart2] = useState("");
  const [siteNamePart2Color, setSiteNamePart2Color] = useState("#fbbf24");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [headerType, setHeaderType] = useState("all");

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

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
    axios
      .get(`${API_BASE}/api/settings`)
      .then(res => {
        if (res.data && res.data.siteName) {
          setSiteName(res.data.siteName);
        }
        if (res.data && res.data.logoUrl) {
          setLogoUrl(res.data.logoUrl);
        } else {
          setLogoUrl("");
        }
        if (res.data && res.data.logoHeight) {
          setLogoHeight(res.data.logoHeight);
        }
        if (res.data && res.data.headerHeight) {
          setHeaderHeight(res.data.headerHeight);
        }
        if (res.data && res.data.headerColor) {
          setHeaderColor(res.data.headerColor);
        }
        setHeaderLinks(Array.isArray(res.data.headerLinks) ? res.data.headerLinks : []);
        setHeaderLinkColor(res.data.headerLinkColor || "#ffffff");
        setHeaderLinkHoverColor(res.data.headerLinkHoverColor || "#fbbf24");
        setHeaderMenuIconColor(res.data.headerMenuIconColor || "#ffffff");
        setHeaderMenuBgColor(res.data.headerMenuBgColor || "#0f172a");
        setHeaderMenuTextColor(res.data.headerMenuTextColor || res.data.headerLinkColor || "#f8fafc");
        setAlertEnabled(!!res.data.alertEnabled);
        setAlertText(res.data.alertText || "");
        setAlertColor(res.data.alertColor || "#fff3cd");
        setAlertHeight(res.data.alertHeight || 32);
        setAlertFontSize(res.data.alertFontSize || 14);
        setAlertStyle(res.data.alertStyle || {});
        setSiteNameStyle(res.data.siteNameStyle || {});
        setUseSplitColor(res.data.useSplitColor || false);
        setSiteNamePart1(res.data.siteNamePart1 || "");
        setSiteNamePart1Color(res.data.siteNamePart1Color || "#ffffff");
        setSiteNamePart2(res.data.siteNamePart2 || "");
        setSiteNamePart2Color(res.data.siteNamePart2Color || "#fbbf24");
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
      if (window.innerWidth > 992) setMenuOpen(false);
    };
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
    textAlign: alertStyle.align || "center",
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
                  src={resolveUrl(logoUrl)}
                  alt={siteName}
                  className="user-navbar-logo"
                  style={{ "--logo-height": `${logoHeight}px` }}
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

        <div ref={menuRef} className={`header-links${menuOpen ? " open" : ""}`}>
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
                    rel={link.newTab ? "noreferrer" : undefined}
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
              display: "flex"
            }}
          >
            <div className="site-alert-marquee">
              <div className="site-alert-track">
                {(() => {
                  const AlertTag = alertStyle.variant || "p";
                  return (
                    <>
                      <div className="site-alert-group">
                        <AlertTag className="site-alert-item" style={alertTextStyle}>{alertText}</AlertTag>
                        <AlertTag className="site-alert-item" style={alertTextStyle}>{alertText}</AlertTag>
                      </div>
                      <div className="site-alert-group" aria-hidden="true">
                        <AlertTag className="site-alert-item" style={alertTextStyle}>{alertText}</AlertTag>
                        <AlertTag className="site-alert-item" style={alertTextStyle}>{alertText}</AlertTag>
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
