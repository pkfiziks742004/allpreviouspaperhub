export const ADMIN_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "universities", label: "Universities" },
  { key: "courses", label: "Courses" },
  { key: "semesters", label: "Semesters" },
  { key: "papers", label: "Upload PDF" },
  { key: "websiteSettings", label: "Website Settings" },
  { key: "headerSettings", label: "Header Settings" },
  { key: "bannerSettings", label: "Banner Settings" },
  { key: "universitySettings", label: "University Settings" },
  { key: "courseSettings", label: "Course Settings" },
  { key: "questionPaperSettings", label: "Question Paper Settings" },
  { key: "semesterSettings", label: "Semester Settings" },
  { key: "footerSettings", label: "Footer Settings" },
  { key: "pages", label: "Pages" },
  { key: "courseSections", label: "Course Sections" },
  { key: "cardSettings", label: "Card Settings" },
  { key: "trafficSettings", label: "SEO & Traffic" },
  { key: "accountSettings", label: "Account Settings" },
  { key: "adsSettings", label: "Google Ads Settings" },
  { key: "ratings", label: "Ratings" }
];

export const PATH_PERMISSION_MAP = [
  { pathPrefix: "/dashboard", key: "dashboard" },
  { pathPrefix: "/download-analytics", key: "dashboard" },
  { pathPrefix: "/universities", key: "universities" },
  { pathPrefix: "/courses", key: "courses" },
  { pathPrefix: "/semesters", key: "semesters" },
  { pathPrefix: "/categories", key: "universities" },
  { pathPrefix: "/papers", key: "papers" },
  { pathPrefix: "/notices", key: "websiteSettings" },
  { pathPrefix: "/search-tracker", key: "trafficSettings" },
  { pathPrefix: "/feedback-requests", key: "pages" },
  { pathPrefix: "/settings", key: "websiteSettings" },
  { pathPrefix: "/header-settings", key: "headerSettings" },
  { pathPrefix: "/banner-settings", key: "bannerSettings" },
  { pathPrefix: "/university-settings", key: "universitySettings" },
  { pathPrefix: "/course-settings", key: "courseSettings" },
  { pathPrefix: "/question-paper-settings", key: "questionPaperSettings" },
  { pathPrefix: "/semester-settings", key: "semesterSettings" },
  { pathPrefix: "/footer-logo-slider-settings", key: "footerSettings" },
  { pathPrefix: "/footer-settings", key: "footerSettings" },
  { pathPrefix: "/pages", key: "pages" },
  { pathPrefix: "/about-settings", key: "pages" },
  { pathPrefix: "/privacy-policy-settings", key: "pages" },
  { pathPrefix: "/course-sections", key: "courseSections" },
  { pathPrefix: "/card-settings", key: "cardSettings" },
  { pathPrefix: "/traffic-settings", key: "trafficSettings" },
  { pathPrefix: "/account-settings", key: "accountSettings" },
  { pathPrefix: "/ads-settings", key: "adsSettings" },
  { pathPrefix: "/ratings", key: "ratings" },
  { pathPrefix: "/admin-users", key: "__super_only__" }
];

export const getStoredRole = () => localStorage.getItem("role") || "";
export const getStoredPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "{}");
  } catch {
    return {};
  }
};

export const hasPermission = key => {
  const role = getStoredRole();
  if (role === "super_admin") return true;
  const permissions = getStoredPermissions();
  return !!permissions[key];
};
