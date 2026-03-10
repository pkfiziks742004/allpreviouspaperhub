import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import axios from "axios";

import PrivateRoute from "./components/PrivateRoute";
import { API_BASE, resolveApiUrl } from "./config/api";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courses = lazy(() => import("./pages/Courses"));
const Semesters = lazy(() => import("./pages/Semesters"));
const Papers = lazy(() => import("./pages/Papers"));
const Ratings = lazy(() => import("./pages/Ratings"));
const Settings = lazy(() => import("./pages/Settings"));
const AdsSettings = lazy(() => import("./pages/AdsSettings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const FooterSettings = lazy(() => import("./pages/FooterSettings"));
const Universities = lazy(() => import("./pages/Universities"));
const TrafficSettings = lazy(() => import("./pages/TrafficSettings"));
const HeaderSettings = lazy(() => import("./pages/HeaderSettings"));
const CourseSections = lazy(() => import("./pages/CourseSections"));
const CardSettings = lazy(() => import("./pages/CardSettings"));
const BannerSettings = lazy(() => import("./pages/BannerSettings"));
const SemesterSettings = lazy(() => import("./pages/SemesterSettings"));
const UniversitySettings = lazy(() => import("./pages/UniversitySettings"));
const CourseSettings = lazy(() => import("./pages/CourseSettings"));
const QuestionPaperSettings = lazy(() => import("./pages/QuestionPaperSettings"));
const Pages = lazy(() => import("./pages/Pages"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AboutSettings = lazy(() => import("./pages/AboutSettings"));
const PrivacyPolicySettings = lazy(() => import("./pages/PrivacyPolicySettings"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement"));
const NoticeUpdates = lazy(() => import("./pages/NoticeUpdates"));
const DownloadAnalytics = lazy(() => import("./pages/DownloadAnalytics"));
const SearchTracker = lazy(() => import("./pages/SearchTracker"));
const FeedbackRequests = lazy(() => import("./pages/FeedbackRequests"));

const ADMIN_BASES = ["/admin", "/sub-admin"];

const PROTECTED_ROUTES = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/download-analytics", element: <DownloadAnalytics /> },
  { path: "/courses", element: <Courses /> },
  { path: "/universities", element: <Universities /> },
  { path: "/categories", element: <CategoryManagement /> },
  { path: "/semesters", element: <Semesters /> },
  { path: "/papers", element: <Papers /> },
  { path: "/settings", element: <Settings /> },
  { path: "/header-settings", element: <HeaderSettings /> },
  { path: "/banner-settings", element: <BannerSettings /> },
  { path: "/university-settings", element: <UniversitySettings /> },
  { path: "/course-settings", element: <CourseSettings /> },
  { path: "/question-paper-settings", element: <QuestionPaperSettings /> },
  { path: "/semester-settings", element: <SemesterSettings /> },
  { path: "/account-settings", element: <AccountSettings /> },
  { path: "/footer-settings", element: <FooterSettings /> },
  { path: "/ads-settings", element: <AdsSettings /> },
  { path: "/pages", element: <Pages /> },
  { path: "/about-settings", element: <AboutSettings /> },
  { path: "/privacy-policy-settings", element: <PrivacyPolicySettings /> },
  { path: "/notices", element: <NoticeUpdates /> },
  { path: "/search-tracker", element: <SearchTracker /> },
  { path: "/feedback-requests", element: <FeedbackRequests /> },
  { path: "/admin-users", element: <AdminUsers /> },
  { path: "/traffic-settings", element: <TrafficSettings /> },
  { path: "/course-sections", element: <CourseSections /> },
  { path: "/card-settings", element: <CardSettings /> },
  { path: "/ratings", element: <Ratings /> }
];

function App() {
  useEffect(() => {
    const applyFavicon = iconUrl => {
      if (!iconUrl) return;
      const cacheBusted = `${iconUrl}${iconUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
      const ids = ["dynamic-favicon", "dynamic-shortcut-icon", "dynamic-apple-touch-icon"];
      ids.forEach(id => {
        const link = document.getElementById(id);
        if (link) link.href = cacheBusted;
      });
    };

    const applySettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/settings`);
        if (res.data && res.data.adminPageTitle) {
          document.title = res.data.adminPageTitle;
          try {
            localStorage.setItem("admin_page_title_cache", String(res.data.adminPageTitle || "").trim());
          } catch (e) {
            // ignore storage errors
          }
          let appTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");
          if (!appTitleMeta) {
            appTitleMeta = document.createElement("meta");
            appTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
            document.head.appendChild(appTitleMeta);
          }
          appTitleMeta.setAttribute("content", res.data.adminPageTitle);
        }
        if (res.data && res.data.faviconUrl) {
          applyFavicon(resolveApiUrl(res.data.faviconUrl));
        }
      } catch (e) {
        // ignore
      }
    };

    applySettings();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" />} />
          {ADMIN_BASES.map(base => (
            <Route key={`${base}-login`} path={`${base}/login`} element={<Login />} />
          ))}
          {ADMIN_BASES.flatMap(base =>
            PROTECTED_ROUTES.map(route => (
              <Route
                key={`${base}${route.path}`}
                path={`${base}${route.path}`}
                element={<PrivateRoute>{route.element}</PrivateRoute>}
              />
            ))
          )}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
