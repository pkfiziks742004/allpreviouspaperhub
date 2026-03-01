const ADMIN_PERMISSIONS = [
  "dashboard",
  "universities",
  "courses",
  "semesters",
  "papers",
  "websiteSettings",
  "headerSettings",
  "bannerSettings",
  "universitySettings",
  "courseSettings",
  "questionPaperSettings",
  "semesterSettings",
  "footerSettings",
  "pages",
  "courseSections",
  "cardSettings",
  "trafficSettings",
  "accountSettings",
  "adsSettings",
  "ratings"
];

const buildPermissions = (enabled = true) =>
  ADMIN_PERMISSIONS.reduce((acc, key) => {
    acc[key] = !!enabled;
    return acc;
  }, {});

module.exports = {
  ADMIN_PERMISSIONS,
  buildPermissions
};
