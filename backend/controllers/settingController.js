const Setting = require("../models/Setting");
const { removeUploadByUrl, uploadBufferToCloudinary } = require("../utils/uploadFile");
const { emitSettingsChanged } = require("../utils/settingsEvents");

const ALLOWED_BANNER_RATIOS = [
  { width: 16, height: 5 }, // primary banner ratio
  { width: 16, height: 9 }  // YouTube thumbnail ratio
];
const BANNER_ASPECT_EPSILON = 0.02;
const ALLOWED_BADGE_SHAPES = new Set([
  "custom", "pill", "square", "rounded-square", "soft-rounded", "notch",
  "chevron-right", "chevron-left", "diamond", "hexagon", "octagon", "triangle-up",
  "triangle-down", "triangle-left", "triangle-right", "parallelogram-right",
  "parallelogram-left", "tag-right", "tag-left", "message", "bookmark", "ticket",
  "ribbon", "star-5", "star-6", "star-8", "burst-12", "burst-16", "circle",
  "ellipse", "leaf", "egg", "cloud", "heart", "shield", "drop", "arrow-right",
  "arrow-left", "arrow-up", "arrow-down", "house", "pentagon", "cross", "plus",
  "x-shape", "trapezoid", "frame", "bevel", "cut-corners", "slant-top",
  "slant-bottom", "wave-top", "wave-bottom", "blob-1", "blob-2"
]);
const ALLOWED_3D_BADGE_BASES = new Set([
  "pill", "square", "diamond", "hexagon", "octagon", "tag-right", "tag-left",
  "message", "shield", "star-5"
]);

const getImageSizeFromBuffer = buffer => {
  if (!buffer || buffer.length < 10) return null;

  // PNG: width/height in IHDR chunk
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a &&
    buffer.length >= 24
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  // JPEG: parse SOF segment for dimensions
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      // Start of Scan / End of Image
      if (marker === 0xda || marker === 0xd9) break;
      if (offset + 3 >= buffer.length) break;

      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;

      const isSofMarker =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSofMarker && offset + 8 < buffer.length) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }

      offset += 2 + segmentLength;
    }
  }

  return null;
};

const validateBannerImageRatio = async file => {
  try {
    const buffer = file?.buffer;
    const dimensions = getImageSizeFromBuffer(buffer);
    // If dimensions are not parsable (for some formats like some WEBP variants),
    // do not hard-reject here; frontend check already validates most files.
    if (!dimensions || !dimensions.width || !dimensions.height) return true;

    const ratio = dimensions.width / dimensions.height;
    return ALLOWED_BANNER_RATIOS.some(
      allowed =>
        Math.abs(ratio - allowed.width / allowed.height) <= BANNER_ASPECT_EPSILON
    );
  } catch (err) {
    return true;
  }
};

const isValidBadgeShape = value => {
  const shape = String(value || "custom").toLowerCase().trim();
  if (ALLOWED_BADGE_SHAPES.has(shape)) return true;
  const match = shape.match(/^3d-([a-z0-9-]+)-([1-5])$/);
  if (!match) return false;
  return ALLOWED_3D_BADGE_BASES.has(match[1]);
};

const normalizeBannerItem = item => {
  const imageUrl = String(item?.imageUrl || item?.src || "").trim();
  if (!imageUrl) return null;
  const fitModeRaw = String(item?.fitMode || "cover").toLowerCase();
  const fitMode = ["cover", "contain", "fill"].includes(fitModeRaw) ? fitModeRaw : "cover";
  const badgeShapeRaw = String(item?.badgeShape || "custom").toLowerCase();
  const badgeShape = isValidBadgeShape(badgeShapeRaw) ? badgeShapeRaw : "custom";
  const badgeEnabled = item?.badgeEnabled !== undefined
    ? !!item.badgeEnabled
    : !!String(item?.badgeText || "").trim();
  return {
    imageUrl,
    linkUrl: String(item?.linkUrl || "").trim(),
    openInNewTab: !!item?.openInNewTab,
    fitMode,
    badgeEnabled,
    badgeText: String(item?.badgeText || "").trim(),
    badgeTop: Number.isFinite(Number(item?.badgeTop)) ? Number(item.badgeTop) : 16,
    badgeLeft: Number.isFinite(Number(item?.badgeLeft)) ? Number(item.badgeLeft) : 16,
    mobileBadgeTop: Number.isFinite(Number(item?.mobileBadgeTop))
      ? Number(item.mobileBadgeTop)
      : 12,
    mobileBadgeLeft: Number.isFinite(Number(item?.mobileBadgeLeft))
      ? Number(item.mobileBadgeLeft)
      : 12,
    badgeBgColor: String(item?.badgeBgColor || "#ef4444"),
    badgeTextColor: String(item?.badgeTextColor || "#ffffff"),
    badgeFontSize: Number.isFinite(Number(item?.badgeFontSize)) ? Number(item.badgeFontSize) : 14,
    badgeRadius: Number.isFinite(Number(item?.badgeRadius)) ? Number(item.badgeRadius) : 8,
    badgePaddingX: Number.isFinite(Number(item?.badgePaddingX)) ? Number(item.badgePaddingX) : 10,
    badgePaddingY: Number.isFinite(Number(item?.badgePaddingY)) ? Number(item.badgePaddingY) : 6,
    badgeShape,
    badgeWidth: Number.isFinite(Number(item?.badgeWidth)) ? Number(item.badgeWidth) : 0,
    badgeHeight: Number.isFinite(Number(item?.badgeHeight)) ? Number(item.badgeHeight) : 0,
    badgeUseImage: !!item?.badgeUseImage,
    badgeImageUrl: String(item?.badgeImageUrl || "").trim(),
    badgeImageSize: Number.isFinite(Number(item?.badgeImageSize)) ? Number(item.badgeImageSize) : 18,
    badgeBorderWidth: Number.isFinite(Number(item?.badgeBorderWidth)) ? Number(item.badgeBorderWidth) : 0,
    badgeBorderColor: String(item?.badgeBorderColor || "#ffffff"),
    badgeOutlineWidth: Number.isFinite(Number(item?.badgeOutlineWidth)) ? Number(item.badgeOutlineWidth) : 0,
    badgeOutlineColor: String(item?.badgeOutlineColor || "#1e293b"),
    badgeShadowX: Number.isFinite(Number(item?.badgeShadowX)) ? Number(item.badgeShadowX) : 0,
    badgeShadowY: Number.isFinite(Number(item?.badgeShadowY)) ? Number(item.badgeShadowY) : 6,
    badgeShadowBlur: Number.isFinite(Number(item?.badgeShadowBlur)) ? Number(item.badgeShadowBlur) : 14,
    badgeShadowColor: String(item?.badgeShadowColor || "#0f172a66")
  };
};

const defaults = {
  siteName: "Study Portal",
  logoUrl: "",
  logoHeight: 32,
  faviconUrl: "",
  headerHeight: 56,
  userPageTitle: "Study Portal",
  adminPageTitle: "Admin Panel",
  headerLinks: [],
  headerLinkColor: "#ffffff",
  headerLinkHoverColor: "#fbbf24",
  headerMenuIconColor: "#ffffff",
  headerMenuBgColor: "#0f172a",
  headerMenuTextColor: "#f8fafc",
  cardStyles: {
    university: {
      bgColor: "#ffffff",
      gradientStart: "",
      gradientEnd: "",
      textColor: "#0f172a",
      bold: false,
      italic: false,
      minHeight: 240,
      maxWidth: 0
    },
    course: {
      bgColor: "#ffffff",
      gradientStart: "",
      gradientEnd: "",
      textColor: "#0f172a",
      bold: false,
      italic: false,
      minHeight: 200,
      maxWidth: 0
    },
    section: {
      bgColor: "#ffffff",
      gradientStart: "",
      gradientEnd: "",
      textColor: "#0f172a",
      bold: false,
      italic: false,
      minHeight: 200,
      maxWidth: 0
    }
  },
  headerColor: "#0d6efd",
  adminHeaderColor: "#1d2327",
  alertEnabled: false,
  alertText: "",
  alertColor: "#fff3cd",
  alertTextColor: "#000000",
  alertHeight: 32,
  alertFontSize: 14,
  alertMarqueeDirection: "rtl",
  alertMarqueeSpeed: 18,
  alertMarqueeGap: 2,
  copyrightEnabled: false,
  copyrightText: "",
  copyrightColor: "#f8f9fa",
  copyrightTextColor: "#000000",
  copyrightHeight: 32,
  copyrightFontSize: 14,
  pageBgColor: "#ffffff",
  sectionPanelBgColor: "#ffffff",
  bannerMargin: 0,
  bannerRadius: 0,
  homeTitle: "Welcome to Study Portal",
  homeSubtitle: "Download Question Papers, Notes & Syllabus",
  footerText: "Study Portal",
  footerBgColor: "#212529",
  footerBgImage: "",
  footerLogoUrl: "",
  footerLogoHeight: 32,
  footerLogoAlign: "left",
  footerSocialIcons: [],
  footerSocialIconSize: 36,
  footerSocialIconRadius: 10,
  footerSocialIconBgColor: "#ffffff",
  footerSocialIconBorderColor: "#ffffff00",
  footerSocialIconBorderWidth: 0,
  footerColumns: [],
  footerLinkFontSize: 14,
  footerContactTitle: "Contact",
  footerContactLines: [],
  footerContactTextStyle: { color: "#ffffff", bold: false, italic: false, size: 14 },
  footerRatingNoteTitle: "",
  footerRatingNoteText: "",
  footerRatingNoteLink: "",
  footerRatingNoteBgColor: "rgba(255,255,255,0.08)",
  footerRatingNoteTextColor: "#ffffff",
  ratingEnabled: true,
  ratingPopupFrequencyDays: 7,
  bannerImages: [],
  bannerItems: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ogImage: "",
  seoByPage: {
    home: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/" },
    about: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/about" },
    courses: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/{universitySlug}" },
    semesters: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/{universitySlug}/{courseSlug}" },
    papers: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/{universitySlug}/{courseSlug}/{semesterSlug}" },
    paperOpen: { title: "", description: "", keywords: "", ogImage: "", canonicalPath: "/{universitySlug}/{courseSlug}/{semesterSlug}/{paperSlug}" }
  },
  seoRoutes: [],
  analyticsHeadScript: "",
  analyticsBodyScript: "",
  maintenanceEnabled: false,
  maintenanceMessage: "We are under maintenance. Please check back soon.",
  canonicalUrl: "",
  sitemapBaseUrl: "",
  sitemapExtraPaths: [],
  siteNameStyle: { color: "#ffffff", bold: false, italic: false, align: "left", variant: "span" },
  useSplitColor: false,
  siteNamePart1: "",
  siteNamePart1Color: "#ffffff",
  siteNamePart2: "",
  siteNamePart2Color: "#fbbf24",
  alertStyle: { color: "#000000", bold: false, italic: false, align: "center", variant: "p" },
  homeTitleStyle: { color: "#000000", bold: false, italic: false, align: "center", variant: "h2" },
  homeSubtitleStyle: { color: "#6c757d", bold: false, italic: false, align: "center", variant: "p" },
  footerStyle: { color: "#ffffff", bold: false, italic: false, align: "center", variant: "p" },
  universityNameStyle: { color: "#0f172a", bold: false, italic: false, align: "center", variant: "h5", size: 30 },
  courseNameStyle: { color: "#0f172a", bold: false, italic: false, align: "center", variant: "h5", size: 22 },
  semesterNameStyle: { color: "#0f172a", bold: false, italic: false, align: "center", variant: "h6", size: 16 },
  paperNameStyle: { color: "#0f172a", bold: false, italic: false, align: "left", variant: "span", size: 16 },
  footerUseSplitColor: false,
  footerNamePart1: "",
  footerNamePart1Color: "#ffffff",
  footerNamePart2: "",
  footerNamePart2Color: "#fbbf24",
  courseSections: [],
  sectionCardButtonEnabled: true,
  sectionCardButtonText: "View Details",
  universitiesSectionTitle: "Universities / Colleges / Schools",
  universitiesTitleStyle: { color: "#0f172a", bold: true, italic: false, align: "left", size: 22 },
  universitiesSectionSubtitle: "Select a card to view its courses",
  typeActionLabels: {
    university: "View Semesters",
    college: "View Semesters",
    school: "View Classes",
    entranceExam: "View Exam Papers",
    other: "View Details"
  },
  universityTypeOptions: ["University", "College", "School", "Entrance Exam"],
  coursesSectionTitle: "Courses",
  coursesTitleStyle: { color: "#0f172a", bold: true, italic: false, align: "left", size: 22 },
  courseButtonStyle: {
    bgColor: "#2563eb",
    hoverColor: "#1d4ed8",
    textColor: "#ffffff",
    bold: false,
    italic: false,
    size: 14,
    minWidth: 140
  },
  questionPapersSectionTitle: "Question Papers",
  questionPapersTitleStyle: { color: "#0f172a", bold: true, italic: false, align: "left", size: 22 },
  questionPaperCardStyle: {
    bgColor: "#ffffff",
    gradientStart: "",
    gradientEnd: "",
    textColor: "#0f172a",
    bold: false,
    italic: false,
    minHeight: 80
  },
  questionPaperButtonStyle: {
    bgColor: "#2563eb",
    hoverColor: "#1d4ed8",
    textColor: "#ffffff",
    bold: false,
    italic: false,
    size: 13,
    minWidth: 140
  },
  paperOpenViewer: {
    pageBgColor: "#0f172a",
    textColor: "#ffffff",
    viewerBgColor: "#ffffff",
    topBarBgColor: "#0f172a",
    topBarTextColor: "#ffffff",
    mobileHelpText: "Mobile/Tablet par in-app PDF viewer stable nahi hota. Neeche button se PDF open karein.",
    openPdfText: "Open PDF",
    downloadButtonText: "Download Paper",
    openWebsiteText: "Open Website",
    loadingText: "Loading PDF...",
    notFoundText: "Paper not found."
  },
  semestersSectionTitle: "Semesters",
  semestersTitleStyle: { color: "#0f172a", bold: true, italic: false, align: "left", size: 22 },
  semesterCardStyle: {
    bgColor: "#ffffff",
    gradientStart: "",
    gradientEnd: "",
    textColor: "#0f172a",
    bold: false,
    italic: false,
    minHeight: 170,
    maxWidth: 0,
    titleSize: 16
  },
  semesterButtonStyle: {
    bgColor: "#15803d",
    hoverColor: "#166534",
    textColor: "#ffffff",
    bold: false,
    italic: false,
    size: 14,
    minWidth: 140
  },
  noticeUpdates: [],
  searchKeywords: [],
  feedbackRequests: []
};

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const cleanText = (value, maxLen = 200) => String(value || "").trim().slice(0, maxLen);

const sanitizeSectionTextStyle = (style, fallback) => {
  const safe = style && typeof style === "object" ? style : {};
  const align = ["left", "center", "right", "justify"].includes(String(safe.align || "").toLowerCase())
    ? String(safe.align).toLowerCase()
    : fallback.align;
  return {
    color: cleanText(safe.color || fallback.color, 30) || fallback.color,
    size: clamp(safe.size, 10, 72, fallback.size),
    align,
    bold: !!safe.bold,
    italic: !!safe.italic,
    underline: !!safe.underline
  };
};

const sanitizeCourseSections = value => {
  if (!Array.isArray(value)) return defaults.courseSections;

  const usedByType = {
    university: new Set(),
    course: new Set(),
    semester: new Set()
  };

  return value.slice(0, 40).map(raw => {
    const section = raw && typeof raw === "object" ? raw : {};
    const sectionType = ["university", "course", "semester"].includes(String(section.sectionType || "").toLowerCase())
      ? String(section.sectionType).toLowerCase()
      : "course";
    const rawIds = Array.isArray(section.itemIds)
      ? section.itemIds
      : Array.isArray(section.courseIds)
        ? section.courseIds
        : [];
    const uniqueIds = [...new Set(rawIds.map(id => String(id || "").trim()).filter(Boolean))].slice(0, 120);
    const itemIds = uniqueIds.filter(id => {
      if (usedByType[sectionType].has(id)) return false;
      usedByType[sectionType].add(id);
      return true;
    });

    return {
      title: cleanText(section.title, 140) || "New Section",
      description: cleanText(section.description, 400),
      titleStyle: sanitizeSectionTextStyle(section.titleStyle, {
        color: "#0f172a",
        size: 32,
        align: "left",
        bold: false,
        italic: false,
        underline: false
      }),
      descriptionStyle: sanitizeSectionTextStyle(section.descriptionStyle, {
        color: "#475569",
        size: 20,
        align: "left",
        bold: false,
        italic: false,
        underline: false
      }),
      active: section.active !== false,
      comingSoon: !!section.comingSoon,
      comingSoonText: cleanText(section.comingSoonText || "Coming soon", 120) || "Coming soon",
      sectionType,
      itemIds,
      courseIds: sectionType === "course" ? itemIds : []
    };
  });
};

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(defaults);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const updateSettings = async (req, res) => {
  try {
    const payload = {
      siteName: req.body.siteName,
      logoUrl: req.body.logoUrl,
      logoHeight: req.body.logoHeight,
      faviconUrl: req.body.faviconUrl,
      headerHeight: req.body.headerHeight,
      userPageTitle: req.body.userPageTitle,
      adminPageTitle: req.body.adminPageTitle,
      headerLinks: req.body.headerLinks,
      headerLinkColor: req.body.headerLinkColor,
      headerLinkHoverColor: req.body.headerLinkHoverColor,
      headerMenuIconColor: req.body.headerMenuIconColor,
      headerMenuBgColor: req.body.headerMenuBgColor,
      headerMenuTextColor: req.body.headerMenuTextColor,
      cardStyles: req.body.cardStyles,
      headerColor: req.body.headerColor,
      adminHeaderColor: req.body.adminHeaderColor,
      alertEnabled: req.body.alertEnabled,
      alertText: req.body.alertText,
      alertColor: req.body.alertColor,
      alertTextColor: req.body.alertTextColor,
      alertHeight: req.body.alertHeight,
      alertFontSize: req.body.alertFontSize,
      alertMarqueeDirection: req.body.alertMarqueeDirection,
      alertMarqueeSpeed: req.body.alertMarqueeSpeed,
      alertMarqueeGap: req.body.alertMarqueeGap,
      copyrightEnabled: req.body.copyrightEnabled,
      copyrightText: req.body.copyrightText,
      copyrightColor: req.body.copyrightColor,
      copyrightTextColor: req.body.copyrightTextColor,
      copyrightHeight: req.body.copyrightHeight,
      copyrightFontSize: req.body.copyrightFontSize,
      pageBgColor: req.body.pageBgColor,
      sectionPanelBgColor: req.body.sectionPanelBgColor,
      bannerMargin: req.body.bannerMargin,
      bannerRadius: req.body.bannerRadius,
      homeTitle: req.body.homeTitle,
      homeSubtitle: req.body.homeSubtitle,
      footerText: req.body.footerText,
      footerBgColor: req.body.footerBgColor,
      footerBgImage: req.body.footerBgImage,
      footerLogoUrl: req.body.footerLogoUrl,
      footerLogoHeight: req.body.footerLogoHeight,
      footerLogoAlign: req.body.footerLogoAlign,
      footerSocialIcons: req.body.footerSocialIcons,
      footerSocialIconSize: req.body.footerSocialIconSize,
      footerSocialIconRadius: req.body.footerSocialIconRadius,
      footerSocialIconBgColor: req.body.footerSocialIconBgColor,
      footerSocialIconBorderColor: req.body.footerSocialIconBorderColor,
      footerSocialIconBorderWidth: req.body.footerSocialIconBorderWidth,
      footerColumns: req.body.footerColumns,
      footerLinkFontSize: req.body.footerLinkFontSize,
      footerContactTitle: req.body.footerContactTitle,
      footerContactLines: req.body.footerContactLines,
      footerContactTextStyle: req.body.footerContactTextStyle,
      footerRatingNoteTitle: req.body.footerRatingNoteTitle,
      footerRatingNoteText: req.body.footerRatingNoteText,
      footerRatingNoteLink: req.body.footerRatingNoteLink,
      footerRatingNoteBgColor: req.body.footerRatingNoteBgColor,
      footerRatingNoteTextColor: req.body.footerRatingNoteTextColor,
      ratingEnabled: req.body.ratingEnabled,
      ratingPopupFrequencyDays: req.body.ratingPopupFrequencyDays,
      bannerImages: req.body.bannerImages,
      bannerItems: req.body.bannerItems,
      seoTitle: req.body.seoTitle,
      seoDescription: req.body.seoDescription,
      seoKeywords: req.body.seoKeywords,
      ogImage: req.body.ogImage,
      seoByPage: req.body.seoByPage,
      seoRoutes: req.body.seoRoutes,
      analyticsHeadScript: req.body.analyticsHeadScript,
      analyticsBodyScript: req.body.analyticsBodyScript,
      maintenanceEnabled: req.body.maintenanceEnabled,
      maintenanceMessage: req.body.maintenanceMessage,
      canonicalUrl: req.body.canonicalUrl,
      sitemapBaseUrl: req.body.sitemapBaseUrl,
      sitemapExtraPaths: req.body.sitemapExtraPaths,
      siteNameStyle: req.body.siteNameStyle,
      useSplitColor: req.body.useSplitColor,
      siteNamePart1: req.body.siteNamePart1,
      siteNamePart1Color: req.body.siteNamePart1Color,
      siteNamePart2: req.body.siteNamePart2,
      siteNamePart2Color: req.body.siteNamePart2Color,
      alertStyle: req.body.alertStyle,
      homeTitleStyle: req.body.homeTitleStyle,
      homeSubtitleStyle: req.body.homeSubtitleStyle,
      footerStyle: req.body.footerStyle,
      universityNameStyle: req.body.universityNameStyle,
      courseNameStyle: req.body.courseNameStyle,
      semesterNameStyle: req.body.semesterNameStyle,
      paperNameStyle: req.body.paperNameStyle,
      footerUseSplitColor: req.body.footerUseSplitColor,
      footerNamePart1: req.body.footerNamePart1,
      footerNamePart1Color: req.body.footerNamePart1Color,
      footerNamePart2: req.body.footerNamePart2,
      footerNamePart2Color: req.body.footerNamePart2Color,
      courseSections: req.body.courseSections,
      sectionCardButtonEnabled: req.body.sectionCardButtonEnabled,
      sectionCardButtonText: req.body.sectionCardButtonText,
      universitiesSectionTitle: req.body.universitiesSectionTitle,
      universitiesTitleStyle: req.body.universitiesTitleStyle,
      universitiesSectionSubtitle: req.body.universitiesSectionSubtitle,
      typeActionLabels: req.body.typeActionLabels,
      universityTypeOptions: req.body.universityTypeOptions,
      coursesSectionTitle: req.body.coursesSectionTitle,
      coursesTitleStyle: req.body.coursesTitleStyle,
      courseButtonStyle: req.body.courseButtonStyle,
      questionPapersSectionTitle: req.body.questionPapersSectionTitle,
      questionPapersTitleStyle: req.body.questionPapersTitleStyle,
      questionPaperCardStyle: req.body.questionPaperCardStyle,
      questionPaperButtonStyle: req.body.questionPaperButtonStyle,
      paperOpenViewer: req.body.paperOpenViewer,
      semestersSectionTitle: req.body.semestersSectionTitle,
      semestersTitleStyle: req.body.semestersTitleStyle,
      semesterCardStyle: req.body.semesterCardStyle,
      semesterButtonStyle: req.body.semesterButtonStyle,
      noticeUpdates: req.body.noticeUpdates,
      searchKeywords: req.body.searchKeywords,
      feedbackRequests: req.body.feedbackRequests
    };
    const sanitizedCourseSections =
      payload.courseSections !== undefined
        ? sanitizeCourseSections(payload.courseSections)
        : defaults.courseSections;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, ...payload, courseSections: sanitizedCourseSections });
    } else {
      const previousSettings = JSON.parse(JSON.stringify(settings || {}));
      const removedFiles = [];
      const queueIfChanged = (oldValue, newValue) => {
        if (typeof oldValue === "string" && oldValue && oldValue !== newValue) {
          removedFiles.push(oldValue);
        }
      };

      if (payload.siteName !== undefined) settings.siteName = payload.siteName;
      if (payload.logoUrl !== undefined) {
        queueIfChanged(previousSettings.logoUrl, payload.logoUrl);
        settings.logoUrl = payload.logoUrl;
      }
      if (payload.logoHeight !== undefined) settings.logoHeight = payload.logoHeight;
      if (payload.headerHeight !== undefined) settings.headerHeight = payload.headerHeight;
      if (payload.userPageTitle !== undefined) settings.userPageTitle = payload.userPageTitle;
      if (payload.adminPageTitle !== undefined) settings.adminPageTitle = payload.adminPageTitle;
      if (payload.headerLinks !== undefined) settings.headerLinks = payload.headerLinks;
      if (payload.headerLinkColor !== undefined) settings.headerLinkColor = payload.headerLinkColor;
      if (payload.headerLinkHoverColor !== undefined) settings.headerLinkHoverColor = payload.headerLinkHoverColor;
      if (payload.headerMenuIconColor !== undefined) settings.headerMenuIconColor = payload.headerMenuIconColor;
      if (payload.headerMenuBgColor !== undefined) settings.headerMenuBgColor = payload.headerMenuBgColor;
      if (payload.headerMenuTextColor !== undefined) settings.headerMenuTextColor = payload.headerMenuTextColor;
      if (payload.cardStyles !== undefined) {
        const previous = settings.cardStyles || {};
        const incoming = payload.cardStyles || {};
        settings.cardStyles = {
          ...previous,
          ...incoming,
          university: {
            ...(previous.university || {}),
            ...(incoming.university || {})
          },
          course: {
            ...(previous.course || {}),
            ...(incoming.course || {})
          },
          section: {
            ...(previous.section || {}),
            ...(incoming.section || {})
          }
        };
      }
      if (payload.headerColor !== undefined) settings.headerColor = payload.headerColor;
      if (payload.adminHeaderColor !== undefined) settings.adminHeaderColor = payload.adminHeaderColor;
      if (payload.alertText !== undefined) settings.alertText = payload.alertText;
      if (payload.alertColor !== undefined) settings.alertColor = payload.alertColor;
      if (payload.alertTextColor !== undefined) settings.alertTextColor = payload.alertTextColor;
      if (payload.alertHeight !== undefined) settings.alertHeight = payload.alertHeight;
      if (payload.alertFontSize !== undefined) settings.alertFontSize = payload.alertFontSize;
      if (payload.alertMarqueeDirection !== undefined) settings.alertMarqueeDirection = payload.alertMarqueeDirection;
      if (payload.alertMarqueeSpeed !== undefined) settings.alertMarqueeSpeed = payload.alertMarqueeSpeed;
      if (payload.alertMarqueeGap !== undefined) settings.alertMarqueeGap = payload.alertMarqueeGap;
      if (payload.copyrightEnabled !== undefined) settings.copyrightEnabled = payload.copyrightEnabled;
      if (payload.copyrightText !== undefined) settings.copyrightText = payload.copyrightText;
      if (payload.copyrightColor !== undefined) settings.copyrightColor = payload.copyrightColor;
      if (payload.copyrightTextColor !== undefined) settings.copyrightTextColor = payload.copyrightTextColor;
      if (payload.copyrightHeight !== undefined) settings.copyrightHeight = payload.copyrightHeight;
      if (payload.copyrightFontSize !== undefined) settings.copyrightFontSize = payload.copyrightFontSize;
      if (payload.pageBgColor !== undefined) settings.pageBgColor = payload.pageBgColor;
      if (payload.sectionPanelBgColor !== undefined) settings.sectionPanelBgColor = payload.sectionPanelBgColor;
      if (payload.bannerMargin !== undefined) settings.bannerMargin = payload.bannerMargin;
      if (payload.bannerRadius !== undefined) settings.bannerRadius = payload.bannerRadius;
      if (payload.siteNameStyle !== undefined) settings.siteNameStyle = payload.siteNameStyle;
      if (typeof payload.useSplitColor === "boolean") settings.useSplitColor = payload.useSplitColor;
      if (payload.siteNamePart1 !== undefined) settings.siteNamePart1 = payload.siteNamePart1;
      if (payload.siteNamePart1Color !== undefined) settings.siteNamePart1Color = payload.siteNamePart1Color;
      if (payload.siteNamePart2 !== undefined) settings.siteNamePart2 = payload.siteNamePart2;
      if (payload.siteNamePart2Color !== undefined) settings.siteNamePart2Color = payload.siteNamePart2Color;
      if (payload.alertStyle !== undefined) settings.alertStyle = payload.alertStyle;
      if (payload.homeTitleStyle !== undefined) settings.homeTitleStyle = payload.homeTitleStyle;
      if (payload.homeSubtitleStyle !== undefined) settings.homeSubtitleStyle = payload.homeSubtitleStyle;
      if (payload.footerStyle !== undefined) settings.footerStyle = payload.footerStyle;
      if (payload.universityNameStyle !== undefined) settings.universityNameStyle = payload.universityNameStyle;
      if (payload.courseNameStyle !== undefined) settings.courseNameStyle = payload.courseNameStyle;
      if (payload.semesterNameStyle !== undefined) settings.semesterNameStyle = payload.semesterNameStyle;
      if (payload.paperNameStyle !== undefined) settings.paperNameStyle = payload.paperNameStyle;
      if (typeof payload.footerUseSplitColor === "boolean") settings.footerUseSplitColor = payload.footerUseSplitColor;
      if (payload.footerNamePart1 !== undefined) settings.footerNamePart1 = payload.footerNamePart1;
      if (payload.footerNamePart1Color !== undefined) settings.footerNamePart1Color = payload.footerNamePart1Color;
      if (payload.footerNamePart2 !== undefined) settings.footerNamePart2 = payload.footerNamePart2;
      if (payload.footerNamePart2Color !== undefined) settings.footerNamePart2Color = payload.footerNamePart2Color;
      if (typeof payload.alertEnabled === "boolean") {
        settings.alertEnabled = payload.alertEnabled;
      }
      if (payload.homeTitle !== undefined) settings.homeTitle = payload.homeTitle;
      if (payload.homeSubtitle !== undefined) settings.homeSubtitle = payload.homeSubtitle;
      if (payload.footerText !== undefined) settings.footerText = payload.footerText;
      if (payload.footerBgColor !== undefined) settings.footerBgColor = payload.footerBgColor;
      if (payload.footerBgImage !== undefined) {
        queueIfChanged(previousSettings.footerBgImage, payload.footerBgImage);
        settings.footerBgImage = payload.footerBgImage;
      }
      if (payload.footerLogoUrl !== undefined) {
        queueIfChanged(previousSettings.footerLogoUrl, payload.footerLogoUrl);
        settings.footerLogoUrl = payload.footerLogoUrl;
      }
      if (payload.footerLogoHeight !== undefined) settings.footerLogoHeight = payload.footerLogoHeight;
      if (payload.footerLogoAlign !== undefined) settings.footerLogoAlign = payload.footerLogoAlign;
      if (payload.faviconUrl !== undefined) {
        queueIfChanged(previousSettings.faviconUrl, payload.faviconUrl);
        settings.faviconUrl = payload.faviconUrl;
      }
      if (payload.footerSocialIcons !== undefined) {
        const prevIcons = Array.isArray(previousSettings.footerSocialIcons) ? previousSettings.footerSocialIcons : [];
        const nextIcons = Array.isArray(payload.footerSocialIcons) ? payload.footerSocialIcons : [];
        const nextIconUrls = new Set(nextIcons.map(icon => icon?.imageUrl).filter(Boolean));
        prevIcons
          .map(icon => icon?.imageUrl)
          .filter(Boolean)
          .filter(url => !nextIconUrls.has(url))
          .forEach(url => removedFiles.push(url));
        settings.footerSocialIcons = payload.footerSocialIcons;
      }
      if (payload.footerSocialIconSize !== undefined) settings.footerSocialIconSize = payload.footerSocialIconSize;
      if (payload.footerSocialIconRadius !== undefined) settings.footerSocialIconRadius = payload.footerSocialIconRadius;
      if (payload.footerSocialIconBgColor !== undefined) settings.footerSocialIconBgColor = payload.footerSocialIconBgColor;
      if (payload.footerSocialIconBorderColor !== undefined) settings.footerSocialIconBorderColor = payload.footerSocialIconBorderColor;
      if (payload.footerSocialIconBorderWidth !== undefined) settings.footerSocialIconBorderWidth = payload.footerSocialIconBorderWidth;
      if (payload.footerColumns !== undefined) settings.footerColumns = payload.footerColumns;
      if (payload.footerLinkFontSize !== undefined) settings.footerLinkFontSize = payload.footerLinkFontSize;
      if (payload.footerContactTitle !== undefined) settings.footerContactTitle = payload.footerContactTitle;
      if (payload.footerContactLines !== undefined) settings.footerContactLines = payload.footerContactLines;
      if (payload.footerContactTextStyle !== undefined) settings.footerContactTextStyle = payload.footerContactTextStyle;
      if (payload.footerRatingNoteTitle !== undefined) settings.footerRatingNoteTitle = payload.footerRatingNoteTitle;
      if (payload.footerRatingNoteText !== undefined) settings.footerRatingNoteText = payload.footerRatingNoteText;
      if (payload.footerRatingNoteLink !== undefined) settings.footerRatingNoteLink = payload.footerRatingNoteLink;
      if (payload.footerRatingNoteBgColor !== undefined) settings.footerRatingNoteBgColor = payload.footerRatingNoteBgColor;
      if (payload.footerRatingNoteTextColor !== undefined) settings.footerRatingNoteTextColor = payload.footerRatingNoteTextColor;
      if (payload.ratingPopupFrequencyDays !== undefined) settings.ratingPopupFrequencyDays = payload.ratingPopupFrequencyDays;
      if (payload.seoTitle !== undefined) settings.seoTitle = payload.seoTitle;
      if (payload.seoDescription !== undefined) settings.seoDescription = payload.seoDescription;
      if (payload.seoKeywords !== undefined) settings.seoKeywords = payload.seoKeywords;
      if (payload.seoByPage !== undefined) settings.seoByPage = payload.seoByPage;
      if (payload.seoRoutes !== undefined) settings.seoRoutes = payload.seoRoutes;
      if (payload.ogImage !== undefined) {
        queueIfChanged(previousSettings.ogImage, payload.ogImage);
        settings.ogImage = payload.ogImage;
      }
      if (payload.analyticsHeadScript !== undefined) settings.analyticsHeadScript = payload.analyticsHeadScript;
      if (payload.analyticsBodyScript !== undefined) settings.analyticsBodyScript = payload.analyticsBodyScript;
      if (typeof payload.maintenanceEnabled === "boolean") {
        settings.maintenanceEnabled = payload.maintenanceEnabled;
      }
      if (payload.maintenanceMessage !== undefined) settings.maintenanceMessage = payload.maintenanceMessage;
      if (payload.canonicalUrl !== undefined) settings.canonicalUrl = payload.canonicalUrl;
      if (payload.sitemapBaseUrl !== undefined) settings.sitemapBaseUrl = payload.sitemapBaseUrl;
      if (payload.sitemapExtraPaths !== undefined) settings.sitemapExtraPaths = payload.sitemapExtraPaths;
      if (payload.universitiesSectionTitle !== undefined) settings.universitiesSectionTitle = payload.universitiesSectionTitle;
      if (payload.universitiesTitleStyle !== undefined) settings.universitiesTitleStyle = payload.universitiesTitleStyle;
      if (payload.universitiesSectionSubtitle !== undefined) settings.universitiesSectionSubtitle = payload.universitiesSectionSubtitle;
      if (payload.typeActionLabels !== undefined) {
        settings.typeActionLabels = {
          ...(settings.typeActionLabels || {}),
          ...(payload.typeActionLabels || {})
        };
      }
      if (payload.universityTypeOptions !== undefined) {
        settings.universityTypeOptions = Array.isArray(payload.universityTypeOptions)
          ? payload.universityTypeOptions
          : settings.universityTypeOptions;
      }
      if (payload.coursesSectionTitle !== undefined) settings.coursesSectionTitle = payload.coursesSectionTitle;
      if (payload.coursesTitleStyle !== undefined) settings.coursesTitleStyle = payload.coursesTitleStyle;
      if (payload.courseButtonStyle !== undefined) settings.courseButtonStyle = payload.courseButtonStyle;
      if (payload.questionPapersSectionTitle !== undefined) settings.questionPapersSectionTitle = payload.questionPapersSectionTitle;
      if (payload.questionPapersTitleStyle !== undefined) settings.questionPapersTitleStyle = payload.questionPapersTitleStyle;
      if (payload.questionPaperCardStyle !== undefined) settings.questionPaperCardStyle = payload.questionPaperCardStyle;
      if (payload.questionPaperButtonStyle !== undefined) settings.questionPaperButtonStyle = payload.questionPaperButtonStyle;
      if (payload.paperOpenViewer !== undefined) {
        settings.paperOpenViewer = {
          ...(settings.paperOpenViewer || defaults.paperOpenViewer || {}),
          ...(payload.paperOpenViewer || {})
        };
      }
      if (payload.semestersSectionTitle !== undefined) settings.semestersSectionTitle = payload.semestersSectionTitle;
      if (payload.semestersTitleStyle !== undefined) settings.semestersTitleStyle = payload.semestersTitleStyle;
      if (payload.semesterCardStyle !== undefined) settings.semesterCardStyle = payload.semesterCardStyle;
      if (payload.semesterButtonStyle !== undefined) settings.semesterButtonStyle = payload.semesterButtonStyle;
      if (payload.noticeUpdates !== undefined) settings.noticeUpdates = payload.noticeUpdates;
      if (payload.searchKeywords !== undefined) settings.searchKeywords = payload.searchKeywords;
      if (payload.feedbackRequests !== undefined) settings.feedbackRequests = payload.feedbackRequests;
      settings.ratingEnabled =
        typeof payload.ratingEnabled === "boolean"
          ? payload.ratingEnabled
          : settings.ratingEnabled;
      if (Array.isArray(payload.bannerImages)) {
        const prevBanners = Array.isArray(previousSettings.bannerImages) ? previousSettings.bannerImages : [];
        const nextBanners = payload.bannerImages;
        const nextBannerSet = new Set(nextBanners);
        prevBanners.filter(url => !nextBannerSet.has(url)).forEach(url => removedFiles.push(url));
        settings.bannerImages = nextBanners;
      }
      if (Array.isArray(payload.bannerItems)) {
        const prevBannerItems = Array.isArray(previousSettings.bannerItems) ? previousSettings.bannerItems : [];
        const prevUrls = new Set(
          prevBannerItems
            .map(item => String(item?.imageUrl || "").trim())
            .filter(Boolean)
        );
        const nextBannerItems = payload.bannerItems
          .map(normalizeBannerItem)
          .filter(Boolean);
        const nextUrls = new Set(nextBannerItems.map(item => item.imageUrl));
        prevUrls.forEach(url => {
          if (!nextUrls.has(url)) removedFiles.push(url);
        });
        settings.bannerItems = nextBannerItems;
        settings.bannerImages = nextBannerItems.map(item => item.imageUrl);
      }
      settings.courseSections = Array.isArray(payload.courseSections)
        ? sanitizedCourseSections
        : settings.courseSections;
      if (typeof payload.sectionCardButtonEnabled === "boolean") {
        settings.sectionCardButtonEnabled = payload.sectionCardButtonEnabled;
      }
      if (payload.sectionCardButtonText !== undefined) {
        settings.sectionCardButtonText = cleanText(payload.sectionCardButtonText, 80);
      }
      await settings.save();
      await Promise.all([...new Set(removedFiles)].map(removeUploadByUrl));
    }

    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/logo",
      resourceType: "image"
    });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, logoUrl: uploaded.secure_url });
    } else {
      const oldLogo = settings.logoUrl;
      settings.logoUrl = uploaded.secure_url;
      await settings.save();
      await removeUploadByUrl(oldLogo);
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadBanners = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json("No files");
    const replaceIndex = Number.parseInt(req.body?.replaceIndex, 10);
    const isReplaceMode = Number.isInteger(replaceIndex) && replaceIndex >= 0;
    if (isReplaceMode && files.length !== 1) {
      return res.status(400).json("Replace mode allows only one banner image.");
    }

    const invalidFiles = [];
    for (const file of files) {
      const isValidRatio = await validateBannerImageRatio(file);
      if (!isValidRatio) {
        invalidFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(file => file.originalname).join(", ");
      return res.status(400).json(
        `Only 16:5 or 16:9 banner images are allowed. Invalid file(s): ${invalidNames}`
      );
    }

    const uploadedBanners = await Promise.all(
      files.map(file =>
        uploadBufferToCloudinary({
          buffer: file.buffer,
          mimeType: file.mimetype,
          folder: "study-portal/settings/banners",
          resourceType: "image"
        })
      )
    );

    const newImages = uploadedBanners.map(item => item.secure_url);
    const newItems = newImages.map(url => normalizeBannerItem({ imageUrl: url }));
    let settings = await Setting.findOne();
    if (!settings) {
      if (isReplaceMode) {
        return res.status(400).json("Cannot replace banner before initial banners exist.");
      }
      settings = await Setting.create({
        ...defaults,
        bannerImages: newImages,
        bannerItems: newItems
      });
    } else {
      const currentItems = Array.isArray(settings.bannerItems) && settings.bannerItems.length > 0
        ? settings.bannerItems.map(normalizeBannerItem).filter(Boolean)
        : (Array.isArray(settings.bannerImages) ? settings.bannerImages.map(url => normalizeBannerItem({ imageUrl: url })).filter(Boolean) : []);
      if (isReplaceMode) {
        if (replaceIndex >= currentItems.length) {
          return res.status(400).json("Invalid banner index for replace.");
        }
        const oldUrl = currentItems[replaceIndex]?.imageUrl;
        currentItems[replaceIndex] = {
          ...currentItems[replaceIndex],
          imageUrl: newImages[0]
        };
        settings.bannerItems = currentItems;
        settings.bannerImages = currentItems.map(item => item.imageUrl);
        await settings.save();
        if (oldUrl && oldUrl !== newImages[0]) {
          await removeUploadByUrl(oldUrl);
        }
      } else {
        settings.bannerItems = [...currentItems, ...newItems];
        settings.bannerImages = settings.bannerItems.map(item => item.imageUrl);
        await settings.save();
      }
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadFooterLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/footer-logo",
      resourceType: "image"
    });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, footerLogoUrl: uploaded.secure_url });
    } else {
      const oldFooterLogo = settings.footerLogoUrl;
      settings.footerLogoUrl = uploaded.secure_url;
      await settings.save();
      await removeUploadByUrl(oldFooterLogo);
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadFooterBg = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/footer-bg",
      resourceType: "image"
    });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, footerBgImage: uploaded.secure_url });
    } else {
      const oldFooterBg = settings.footerBgImage;
      settings.footerBgImage = uploaded.secure_url;
      await settings.save();
      await removeUploadByUrl(oldFooterBg);
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadFooterIcons = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json("No files");
    const uploadedIcons = await Promise.all(
      files.map(file =>
        uploadBufferToCloudinary({
          buffer: file.buffer,
          mimeType: file.mimetype,
          folder: "study-portal/settings/footer-icons",
          resourceType: "image"
        })
      )
    );
    const newIcons = uploadedIcons.map(item => ({ imageUrl: item.secure_url, link: "" }));
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, footerSocialIcons: newIcons });
    } else {
      settings.footerSocialIcons = [...(settings.footerSocialIcons || []), ...newIcons];
      await settings.save();
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadFavicon = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/favicon",
      resourceType: "image"
    });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, faviconUrl: uploaded.secure_url });
    } else {
      const oldFavicon = settings.faviconUrl;
      settings.faviconUrl = uploaded.secure_url;
      await settings.save();
      await removeUploadByUrl(oldFavicon);
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadOgImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/og-image",
      resourceType: "image"
    });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ ...defaults, ogImage: uploaded.secure_url });
    } else {
      const oldOg = settings.ogImage;
      settings.ogImage = uploaded.secure_url;
      await settings.save();
      await removeUploadByUrl(oldOg);
    }
    emitSettingsChanged();
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const uploadBadgeImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    if (!String(req.file.mimetype || "").toLowerCase().includes("png")) {
      return res.status(400).json("Only PNG badge image allowed");
    }
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/badge-image",
      resourceType: "image"
    });
    return res.json({ url: uploaded.secure_url });
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

const uploadSeoImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/settings/seo-route-image",
      resourceType: "image"
    });
    return res.json({ url: uploaded.secure_url });
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadBanners,
  uploadFooterLogo,
  uploadFooterBg,
  uploadFooterIcons,
  uploadFavicon,
  uploadOgImage,
  uploadBadgeImage,
  uploadSeoImage
};
