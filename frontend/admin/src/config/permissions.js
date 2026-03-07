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
  { pathPrefix: "/admin/dashboard", key: "dashboard" },
  { pathPrefix: "/admin/download-analytics", key: "dashboard" },
  { pathPrefix: "/admin/universities", key: "universities" },
  { pathPrefix: "/admin/courses", key: "courses" },
  { pathPrefix: "/admin/semesters", key: "semesters" },
  { pathPrefix: "/admin/categories", key: "universities" },
  { pathPrefix: "/admin/papers", key: "papers" },
  { pathPrefix: "/admin/notices", key: "websiteSettings" },
  { pathPrefix: "/admin/search-tracker", key: "trafficSettings" },
  { pathPrefix: "/admin/feedback-requests", key: "pages" },
  { pathPrefix: "/admin/settings", key: "websiteSettings" },
  { pathPrefix: "/admin/header-settings", key: "headerSettings" },
  { pathPrefix: "/admin/banner-settings", key: "bannerSettings" },
  { pathPrefix: "/admin/university-settings", key: "universitySettings" },
  { pathPrefix: "/admin/course-settings", key: "courseSettings" },
  { pathPrefix: "/admin/question-paper-settings", key: "questionPaperSettings" },
  { pathPrefix: "/admin/semester-settings", key: "semesterSettings" },
  { pathPrefix: "/admin/footer-settings", key: "footerSettings" },
  { pathPrefix: "/admin/pages", key: "pages" },
  { pathPrefix: "/admin/about-settings", key: "pages" },
  { pathPrefix: "/admin/privacy-policy-settings", key: "pages" },
  { pathPrefix: "/admin/course-sections", key: "courseSections" },
  { pathPrefix: "/admin/card-settings", key: "cardSettings" },
  { pathPrefix: "/admin/traffic-settings", key: "trafficSettings" },
  { pathPrefix: "/admin/account-settings", key: "accountSettings" },
  { pathPrefix: "/admin/ads-settings", key: "adsSettings" },
  { pathPrefix: "/admin/ratings", key: "ratings" },
  { pathPrefix: "/admin/admin-users", key: "__super_only__" }
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
