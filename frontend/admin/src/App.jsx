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
        const res = await axios.get(`${API_BASE}/api/settings`, {
          params: { _ts: Date.now() }
        });
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

          <Route path="/admin/login" element={<Login />} />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/download-analytics"
            element={
              <PrivateRoute>
                <DownloadAnalytics />
              </PrivateRoute>
            }
          />

        <Route
          path="/admin/courses"
          element={
            <PrivateRoute>
              <Courses />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/universities"
          element={
            <PrivateRoute>
              <Universities />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <PrivateRoute>
              <CategoryManagement />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/semesters"
          element={
            <PrivateRoute>
              <Semesters />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/papers"
          element={
            <PrivateRoute>
              <Papers />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/header-settings"
          element={
            <PrivateRoute>
              <HeaderSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/banner-settings"
          element={
            <PrivateRoute>
              <BannerSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/university-settings"
          element={
            <PrivateRoute>
              <UniversitySettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/course-settings"
          element={
            <PrivateRoute>
              <CourseSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/question-paper-settings"
          element={
            <PrivateRoute>
              <QuestionPaperSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/semester-settings"
          element={
            <PrivateRoute>
              <SemesterSettings />
            </PrivateRoute>
          }
        />



        <Route
          path="/admin/account-settings"
          element={
            <PrivateRoute>
              <AccountSettings />
            </PrivateRoute>
          }
        />


        <Route
          path="/admin/footer-settings"
          element={
            <PrivateRoute>
              <FooterSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/ads-settings"
          element={
            <PrivateRoute>
              <AdsSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/pages"
          element={
            <PrivateRoute>
              <Pages />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/about-settings"
          element={
            <PrivateRoute>
              <AboutSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/privacy-policy-settings"
          element={
            <PrivateRoute>
              <PrivacyPolicySettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <PrivateRoute>
              <NoticeUpdates />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/search-tracker"
          element={
            <PrivateRoute>
              <SearchTracker />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/feedback-requests"
          element={
            <PrivateRoute>
              <FeedbackRequests />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/admin-users"
          element={
            <PrivateRoute>
              <AdminUsers />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/traffic-settings"
          element={
            <PrivateRoute>
              <TrafficSettings />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/course-sections"
          element={
            <PrivateRoute>
              <CourseSections />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/card-settings"
          element={
            <PrivateRoute>
              <CardSettings />
            </PrivateRoute>
          }
        />

          <Route
            path="/admin/ratings"
            element={
              <PrivateRoute>
                <Ratings />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
