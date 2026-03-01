import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Courses from "./pages/Courses";
import Semesters from "./pages/Semesters";
import Papers from "./pages/Papers";
import Ratings from "./pages/Ratings";
import Settings from "./pages/Settings";
import AdsSettings from "./pages/AdsSettings";
import AccountSettings from "./pages/AccountSettings";
import FooterSettings from "./pages/FooterSettings";
import Universities from "./pages/Universities";
import TrafficSettings from "./pages/TrafficSettings";
import HeaderSettings from "./pages/HeaderSettings";
import CourseSections from "./pages/CourseSections";
import CardSettings from "./pages/CardSettings";
import BannerSettings from "./pages/BannerSettings";
import SemesterSettings from "./pages/SemesterSettings";
import UniversitySettings from "./pages/UniversitySettings";
import CourseSettings from "./pages/CourseSettings";
import QuestionPaperSettings from "./pages/QuestionPaperSettings";
import Pages from "./pages/Pages";
import AdminUsers from "./pages/AdminUsers";
import AboutSettings from "./pages/AboutSettings";
import CategoryManagement from "./pages/CategoryManagement";
import NoticeUpdates from "./pages/NoticeUpdates";
import DownloadAnalytics from "./pages/DownloadAnalytics";
import SearchTracker from "./pages/SearchTracker";
import FeedbackRequests from "./pages/FeedbackRequests";
import { API_BASE, resolveApiUrl } from "./config/api";

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
    </BrowserRouter>
  );
}

export default App;
