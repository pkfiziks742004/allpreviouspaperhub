const express = require("express");
const router = express.Router();
const { verifyAdmin, verifyPermission, verifyAnyPermission } = require("../middleware/auth");
const multer = require("multer");
const {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadBanners,
  uploadFooterLogo,
  uploadFooterBg,
  uploadFooterIcons,
  uploadFavicon,
  uploadOgImage
} = require("../controllers/settingController");
const { subscribeSettingsEvents } = require("../utils/settingsEvents");

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_IMAGE_UPLOAD_BYTES || 5 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});
const SETTINGS_PERMISSIONS = [
  "websiteSettings",
  "headerSettings",
  "bannerSettings",
  "universitySettings",
  "courseSettings",
  "questionPaperSettings",
  "semesterSettings",
  "footerSettings",
  "courseSections",
  "cardSettings",
  "trafficSettings"
];

// Public: get settings
router.get("/", getSettings);

// Public: realtime settings events (SSE)
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const unsubscribe = subscribeSettingsEvents(res);
  res.write(`data: ${JSON.stringify({ type: "connected", at: Date.now() })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
    res.end();
  });
});

// Admin: update settings
router.put("/", verifyAdmin, verifyAnyPermission(SETTINGS_PERMISSIONS), updateSettings);

// Admin: upload logo
router.post("/logo", verifyAdmin, verifyPermission("headerSettings"), upload.single("logo"), uploadLogo);

// Admin: upload banner images
router.post("/banners", verifyAdmin, verifyPermission("bannerSettings"), upload.array("banners", 10), uploadBanners);

// Admin: upload footer logo
router.post("/footer-logo", verifyAdmin, verifyPermission("footerSettings"), upload.single("footerLogo"), uploadFooterLogo);

// Admin: upload footer background image
router.post("/footer-bg", verifyAdmin, verifyPermission("footerSettings"), upload.single("footerBg"), uploadFooterBg);

// Admin: upload footer social icons
router.post("/footer-icons", verifyAdmin, verifyPermission("footerSettings"), upload.array("footerIcons", 10), uploadFooterIcons);

// Admin: upload favicon
router.post("/favicon", verifyAdmin, verifyPermission("headerSettings"), upload.single("favicon"), uploadFavicon);

// Admin: upload OG image
router.post("/og-image", verifyAdmin, verifyPermission("trafficSettings"), upload.single("ogImage"), uploadOgImage);

module.exports = router;
