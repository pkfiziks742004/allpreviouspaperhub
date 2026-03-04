import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { API_BASE, resolveApiUrl } from "../config/api";

function Navbar() {
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

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

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

  const visibleHeaderLinks = headerLinks.filter(link => {
    const url = String(link?.url || "").trim().toLowerCase();
    const label = String(link?.label || "").trim().toLowerCase();
    return url !== "/courses" && label !== "courses";
  });

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
          "--header-menu-text": headerMenuTextColor
        }}
      >
        <nav
          className="navbar navbar-dark px-3 user-navbar"
          style={{ backgroundColor: headerColor, minHeight: `${headerHeight}px` }}
        >
          <Link className="navbar-brand user-navbar-brand" to="/" style={nameStyle}>
            {logoUrl ? (
              <img
                src={resolveUrl(logoUrl)}
                alt={siteName}
                className="user-navbar-logo"
                style={{ "--logo-height": `${logoHeight}px` }}
              />
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

        <div ref={menuRef} className={`header-links${menuOpen ? " open" : ""}`}>
          {visibleHeaderLinks.length > 0 ? (
            visibleHeaderLinks.map((link, idx) => {
              const isExternal = (link.url || "").startsWith("http");
              const className = `header-link${idx !== visibleHeaderLinks.length - 1 ? " me-3" : ""}`;
              if (isExternal) {
                return (
                  <a
                    key={`hl-${idx}`}
                    className={className}
                    href={link.url}
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
                  to={link.url || "/"}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label || "Link"}
                </Link>
              );
            })
          ) : (
            <>
              <Link className="header-link me-3" to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            </>
          )}
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
            className="rounded-0 mb-0"
            style={{
              backgroundColor: alertColor,
              padding: "6px 12px",
              minHeight: alertHeight ? `${alertHeight}px` : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: alertStyle.align || "center"
            }}
          >
            {(() => {
              const AlertTag = alertStyle.variant || "p";
              return <AlertTag style={alertTextStyle}>{alertText}</AlertTag>;
            })()}
          </div>
        )}
      </div>
      <div className="site-header-spacer" />

    </>
  );
}

export default Navbar;
