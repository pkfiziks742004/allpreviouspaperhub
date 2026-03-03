import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdSchool,
  MdBook,
  MdDateRange,
  MdFileUpload,
  MdSettings,
  MdViewAgenda,
  MdImage,
  MdEvent,
  MdInfo,
  MdArticle,
  MdViewList,
  MdPalette,
  MdAnalytics,
  MdPerson,
  MdCampaign,
  MdCategory,
  MdFeedback,
  MdSearch,
  MdBarChart,
  MdNotificationsActive,
  MdLogout
} from "react-icons/md";
import { hasPermission, getStoredRole } from "../config/permissions";
import axios from "axios";
import { API_BASE, resolveApiUrl } from "../config/api";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { key: "dashboard", to: "/admin/dashboard", icon: MdDashboard, label: "Dashboard" },
      { key: "dashboard", to: "/admin/download-analytics", icon: MdBarChart, label: "Download Analytics" },
      { key: "ratings", to: "/admin/ratings", icon: MdBarChart, label: "Ratings" }
    ]
  },
  {
    title: "Paper Control",
    items: [
      { key: "papers", to: "/admin/papers", icon: MdFileUpload, label: "Papers Management" },
      { key: "universities", to: "/admin/categories", icon: MdCategory, label: "Category Management" }
    ]
  },
  {
    title: "Signals",
    items: [
      { key: "websiteSettings", to: "/admin/notices", icon: MdNotificationsActive, label: "Notice & Updates" },
      { key: "trafficSettings", to: "/admin/search-tracker", icon: MdSearch, label: "Search Tracker" },
      { key: "pages", to: "/admin/feedback-requests", icon: MdFeedback, label: "Feedback Requests" }
    ]
  },
  {
    title: "Category Data",
    items: [
      { key: "universities", to: "/admin/universities", icon: MdSchool, label: "Universities" },
      { key: "courses", to: "/admin/courses", icon: MdBook, label: "Courses" },
      { key: "semesters", to: "/admin/semesters", icon: MdDateRange, label: "Semesters" },
      { key: "courseSections", to: "/admin/course-sections", icon: MdViewList, label: "Course Sections" }
    ]
  },
  {
    title: "Website Settings",
    items: [
      { key: "websiteSettings", to: "/admin/settings", icon: MdSettings, label: "Website Settings" },
      { key: "headerSettings", to: "/admin/header-settings", icon: MdViewAgenda, label: "Header Settings" },
      { key: "bannerSettings", to: "/admin/banner-settings", icon: MdImage, label: "Banner Settings" },
      { key: "universitySettings", to: "/admin/university-settings", icon: MdEvent, label: "University Settings" },
      { key: "courseSettings", to: "/admin/course-settings", icon: MdEvent, label: "Course Settings" },
      { key: "questionPaperSettings", to: "/admin/question-paper-settings", icon: MdEvent, label: "Question Paper Settings" },
      { key: "semesterSettings", to: "/admin/semester-settings", icon: MdEvent, label: "Semester Settings" },
      { key: "footerSettings", to: "/admin/footer-settings", icon: MdInfo, label: "Footer Settings" },
      { key: "pages", to: "/admin/pages", icon: MdArticle, label: "Pages" },
      { key: "pages", to: "/admin/about-settings", icon: MdArticle, label: "About Settings" },
      { key: "cardSettings", to: "/admin/card-settings", icon: MdPalette, label: "Card Settings" },
      { key: "trafficSettings", to: "/admin/traffic-settings", icon: MdAnalytics, label: "SEO & Traffic" },
      { key: "adsSettings", to: "/admin/ads-settings", icon: MdCampaign, label: "Google Ads Settings" }
    ]
  },
  {
    title: "Security",
    items: [
      { key: "accountSettings", to: "/admin/account-settings", icon: MdPerson, label: "Account Settings" }
    ]
  }
];

function getPageTitle(pathname) {
  if (pathname.includes("/dashboard")) return "Dashboard";
  if (pathname.includes("/download-analytics")) return "Download Analytics";
  if (pathname.includes("/categories")) return "Category Management";
  if (pathname.includes("/notices")) return "Notice & Updates";
  if (pathname.includes("/search-tracker")) return "Search Tracker";
  if (pathname.includes("/feedback-requests")) return "Feedback Requests";
  if (pathname.includes("/ratings")) return "Ratings";
  if (pathname.includes("/admin-users")) return "Sub Admin Management";
  if (pathname.includes("/header-settings")) return "Header Settings";
  if (pathname.includes("/banner-settings")) return "Banner Settings";
  if (pathname.includes("/university-settings")) return "University Settings";
  if (pathname.includes("/course-settings")) return "Course Settings";
  if (pathname.includes("/question-paper-settings")) return "Question Paper Settings";
  if (pathname.includes("/semester-settings")) return "Semester Settings";
  if (pathname.includes("/footer-settings")) return "Footer Settings";
  if (pathname.includes("/course-sections")) return "Course Sections";
  if (pathname.includes("/card-settings")) return "Card Settings";
  if (pathname.includes("/traffic-settings")) return "SEO & Traffic Settings";
  if (pathname.includes("/account-settings")) return "Account Settings";
  if (pathname.includes("/ads-settings")) return "Google Ads Settings";
  if (pathname.includes("/universities")) return "Universities";
  if (pathname.includes("/courses")) return "Courses";
  if (pathname.includes("/semesters")) return "Semesters";
  if (pathname.includes("/papers")) return "Upload PDF";
  if (pathname.includes("/pages")) return "Pages";
  if (pathname.includes("/about-settings")) return "About Settings";
  if (pathname.includes("/settings")) return "Website Settings";
  return "Admin Panel";
}

export default function Layout({ children }) {
  const nav = useNavigate();
  const location = useLocation();
  const role = getStoredRole();
  const superAdmin = role === "super_admin";
  const roleLabel = role === "super_admin" ? "Super Admin" : "Sub Admin";
  const [siteName, setSiteName] = useState("Admin Panel");
  const [siteLogo, setSiteLogo] = useState("");
  const [logoHeight, setLogoHeight] = useState(24);
  const [siteNameStyle, setSiteNameStyle] = useState({});
  const [useSplitColor, setUseSplitColor] = useState(false);
  const [siteNamePart1, setSiteNamePart1] = useState("");
  const [siteNamePart1Color, setSiteNamePart1Color] = useState("#ffffff");
  const [siteNamePart2, setSiteNamePart2] = useState("");
  const [siteNamePart2Color, setSiteNamePart2Color] = useState("#fbbf24");
  const [topbarColor, setTopbarColor] = useState("#1d2327");
  const [topbarHeight, setTopbarHeight] = useState(46);
  const [adminInfo, setAdminInfo] = useState({ name: "", email: "", role: roleLabel });
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const profileRef = useRef(null);
  const closeLogoutSentRef = useRef(false);
  const topbarTitle = siteName || "Admin Panel";
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: token || "" } };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsRes, meRes] = await Promise.all([
          axios.get(`${API_BASE}/api/settings`, {
            ...authHeaders,
            params: { _ts: Date.now() },
            headers: {
              ...(authHeaders.headers || {}),
              "Cache-Control": "no-cache",
              Pragma: "no-cache"
            }
          }),
          axios.get(`${API_BASE}/api/auth/me`, authHeaders)
        ]);
        const data = settingsRes.data || {};
        const me = meRes.data || {};
        if (data.siteName) setSiteName(data.siteName);
        setSiteLogo(resolveApiUrl(data.logoUrl || ""));
        setLogoHeight(data.logoHeight || 24);
        setSiteNameStyle(data.siteNameStyle || {});
        setUseSplitColor(!!data.useSplitColor);
        setSiteNamePart1(data.siteNamePart1 || "");
        setSiteNamePart1Color(data.siteNamePart1Color || "#ffffff");
        setSiteNamePart2(data.siteNamePart2 || "");
        setSiteNamePart2Color(data.siteNamePart2Color || "#fbbf24");
        setTopbarColor(data.adminHeaderColor || "#1d2327");
        setTopbarHeight(data.headerHeight || 46);
        setAdminInfo({
          name: me.name || "",
          email: me.email || "",
          role: me.role === "super_admin" ? "Super Admin" : "Sub Admin"
        });
      } catch (err) {
        // keep fallback title
      }
    };
    loadSettings();
  }, [authHeaders]);

  useEffect(() => {
    const onDocClick = event => {
      if (!profileRef.current) return;
      if (profileRef.current.contains(event.target)) return;
      setShowAdminInfo(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (role !== "sub_admin") return;

    const onPageHide = () => {
      if (closeLogoutSentRef.current) return;
      const token = localStorage.getItem("token");
      if (!token) return;

      closeLogoutSentRef.current = true;
      const url = `${API_BASE}/api/auth/logout-on-close`;
      const payload = JSON.stringify({ token });

      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } catch (err) {
        // no-op
      }
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [role]);

  const logout = async () => {
    closeLogoutSentRef.current = true;
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await axios.post(
          `${API_BASE}/api/auth/logout`,
          {},
          { headers: { Authorization: token } }
        );
      }
    } catch (err) {
      // no-op: local logout still proceeds
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("permissions");
      nav("/admin/login");
    }
  };

  const pageTitle = getPageTitle(location.pathname);
  const nameStyle = {
    color: siteNameStyle.color || "#f0f6fc",
    fontWeight: siteNameStyle.bold ? 700 : 600,
    fontStyle: siteNameStyle.italic ? "italic" : "normal"
  };

  return (
    <div
      className="admin-shell"
      style={{
        "--admin-topbar-height": `${topbarHeight}px`,
        "--admin-topbar-bg": topbarColor
      }}
    >
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt="Site Logo"
              className="admin-topbar-site-logo"
              style={{ height: `${logoHeight}px`, width: "auto" }}
            />
          ) : useSplitColor ? (
            <span className="admin-topbar-title" style={nameStyle}>
              <span style={{ color: siteNamePart1Color }}>{siteNamePart1}</span>
              <span style={{ color: siteNamePart2Color }}>{siteNamePart2}</span>
            </span>
          ) : (
            <span className="admin-topbar-title" style={nameStyle}>{topbarTitle}</span>
          )}
        </div>
        <div className="admin-topbar-right">
          <div className="admin-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="admin-profile-chip"
              onClick={() => setShowAdminInfo(prev => !prev)}
            >
              {roleLabel}
            </button>
            {showAdminInfo && (
              <div className="admin-profile-popover">
                <div className="admin-profile-row"><strong>Name:</strong> {adminInfo.name || "-"}</div>
                <div className="admin-profile-row"><strong>Email:</strong> {adminInfo.email || "-"}</div>
                <div className="admin-profile-row"><strong>Role:</strong> {adminInfo.role || "-"}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-main-shell">
        <aside className="admin-sidebar">
          <Link to="/admin/account-settings" className="admin-brand-link">
            <div className="admin-brand">
              <div className="admin-mark">AP</div>
              <div>
                <div className="admin-title">Admin Panel</div>
                <div className="admin-subtitle">Control Center</div>
              </div>
            </div>
          </Link>

          <div className="admin-divider" />

          {NAV_GROUPS.map(group => {
            const visibleItems = group.items.filter(item => hasPermission(item.key));
            if (!visibleItems.length) return null;
            return (
              <div key={group.title} className="admin-nav-group">
                <div className="admin-nav-heading">{group.title}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) => `admin-link${isActive ? " active" : ""}`}
                      to={item.to}
                    >
                      <Icon className="me-2" /> {item.label}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}

          {superAdmin && (
            <NavLink className={({ isActive }) => `admin-link${isActive ? " active" : ""}`} to="/admin/admin-users">
              <MdPerson className="me-2" /> Sub Admins
            </NavLink>
          )}

          <button onClick={logout} className="admin-logout">
            <MdLogout className="me-2" /> Logout
          </button>
        </aside>

        <main className="admin-content">
          <div className="admin-content-head">
            <h1 className="admin-page-title">{pageTitle}</h1>
          </div>
          <div className="admin-content-body">{children}</div>
        </main>
      </div>
    </div>
  );
}
