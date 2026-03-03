const express = require("express");
const multer = require("multer");
const sanitizeHtml = require("sanitize-html");
const Page = require("../models/Page");
const { uploadBufferToCloudinary, removeUploadByUrl } = require("../utils/uploadFile");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const router = express.Router();

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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

const sanitizePageHtml = value =>
  sanitizeHtml(String(value || ""), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "u",
      "s",
      "iframe"
    ]),
    allowedAttributes: {
      "*": ["class", "style", "align"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "referrerpolicy"
      ]
    },
    allowedStyles: {
      "*": {
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb/i, /^hsl/i],
        "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb/i, /^hsl/i],
        "text-align": [/^left$/i, /^right$/i, /^center$/i, /^justify$/i],
        "font-size": [/^\d+(?:px|rem|em|%)$/i],
        "font-weight": [/^(normal|bold|[1-9]00)$/i],
        "font-style": [/^normal$/i, /^italic$/i],
        "text-decoration": [/^none$/i, /^underline$/i, /^line-through$/i]
      }
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" })
    }
  });

const slugify = value => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const ensureUniqueSlug = async (base, pageId) => {
  let slug = base || "page";
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Page.findOne({ slug });
    if (!existing || String(existing._id) === String(pageId || "")) {
      return slug;
    }
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
};

const cleanOptionalUrl = value => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/uploads/")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return raw;
  } catch (err) {
    return "";
  }
  return "";
};

const extractImageUrlsFromHtml = html => {
  const urls = new Set();
  const source = String(html || "");
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match = regex.exec(source);
  while (match) {
    const url = String(match[1] || "").trim();
    if (url) urls.add(url);
    match = regex.exec(source);
  }
  return [...urls];
};

// Public: list published pages
router.get("/public", async (req, res) => {
  try {
    const pages = await Page.find({ published: true });
    pages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(pages);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Public: fetch single published page by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const page = await Page.findOne({ slug, published: true });
    if (!page) return res.status(404).json("Page not found");
    res.set("Cache-Control", "no-store");
    res.json(page);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: list all pages
router.get("/", verifyAdmin, verifyPermission("pages"), async (req, res) => {
  try {
    const pages = await Page.find();
    pages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(pages);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: create page
router.post("/", verifyAdmin, verifyPermission("pages"), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json("Title is required");

    const base = slugify(req.body.slug || req.body.title);
    const slug = await ensureUniqueSlug(base);
    const page = await Page.create({
      title,
      slug,
      contentHtml: sanitizePageHtml(req.body.contentHtml),
      bannerUrl: cleanOptionalUrl(req.body.bannerUrl),
      bgColor: req.body.bgColor || "#ffffff",
      seoTitle: req.body.seoTitle || "",
      seoDescription: req.body.seoDescription || "",
      seoKeywords: req.body.seoKeywords || "",
      canonicalUrl: cleanOptionalUrl(req.body.canonicalUrl),
      extra: req.body.extra && typeof req.body.extra === "object" ? req.body.extra : {},
      published: typeof req.body.published === "boolean" ? req.body.published : true
    });
    res.json(page);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: update page
router.put("/:id", verifyAdmin, verifyPermission("pages"), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json("Page not found");
    const previousContentHtml = String(page.contentHtml || "");
    const previousBannerUrl = String(page.bannerUrl || "");
    const previousExtraAuthorImage = String(page.extra?.author?.image || "");
    if (req.body.title !== undefined) {
      const title = String(req.body.title || "").trim();
      if (!title) return res.status(400).json("Title is required");
      page.title = title;
    }
    if (req.body.slug !== undefined) {
      const base = slugify(req.body.slug || page.title);
      page.slug = await ensureUniqueSlug(base, page._id);
    } else if (req.body.title !== undefined && !page.slug) {
      const base = slugify(page.title);
      page.slug = await ensureUniqueSlug(base, page._id);
    }
    if (req.body.contentHtml !== undefined) page.contentHtml = sanitizePageHtml(req.body.contentHtml);
    if (req.body.bannerUrl !== undefined) page.bannerUrl = cleanOptionalUrl(req.body.bannerUrl);
    if (req.body.bgColor !== undefined) page.bgColor = req.body.bgColor;
    if (req.body.seoTitle !== undefined) page.seoTitle = req.body.seoTitle;
    if (req.body.seoDescription !== undefined) page.seoDescription = req.body.seoDescription;
    if (req.body.seoKeywords !== undefined) page.seoKeywords = req.body.seoKeywords;
    if (req.body.canonicalUrl !== undefined) page.canonicalUrl = cleanOptionalUrl(req.body.canonicalUrl);
    if (req.body.extra !== undefined) {
      page.extra = req.body.extra && typeof req.body.extra === "object" ? req.body.extra : {};
    }
    if (typeof req.body.published === "boolean") page.published = req.body.published;
    await page.save();
    const removedFiles = [];

    const currentContentHtml = String(page.contentHtml || "");
    const previousImages = extractImageUrlsFromHtml(previousContentHtml);
    const currentImages = new Set(extractImageUrlsFromHtml(currentContentHtml));
    previousImages
      .filter(url => !currentImages.has(url))
      .forEach(url => removedFiles.push(url));

    const currentBannerUrl = String(page.bannerUrl || "");
    if (previousBannerUrl && previousBannerUrl !== currentBannerUrl) {
      removedFiles.push(previousBannerUrl);
    }

    const currentExtraAuthorImage = String(page.extra?.author?.image || "");
    if (previousExtraAuthorImage && previousExtraAuthorImage !== currentExtraAuthorImage) {
      removedFiles.push(previousExtraAuthorImage);
    }

    await Promise.all([...new Set(removedFiles)].map(removeUploadByUrl));
    res.json(page);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: delete page
router.delete("/:id", verifyAdmin, verifyPermission("pages"), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json("Page not found");
    const removedFiles = [
      ...extractImageUrlsFromHtml(page.contentHtml),
      page.bannerUrl,
      page.extra?.author?.image
    ].filter(Boolean);
    await page.deleteOne();
    await Promise.all([...new Set(removedFiles)].map(removeUploadByUrl));
    res.json("Page deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: upload banner image (returns url)
router.post("/banner", verifyAdmin, verifyPermission("pages"), upload.single("banner"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/pages/banner",
      resourceType: "image"
    });
    res.json({ url: uploaded.secure_url });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: upload content image (returns url)
router.post("/content-image", verifyAdmin, verifyPermission("pages"), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/pages/content",
      resourceType: "image"
    });
    res.json({ url: uploaded.secure_url });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: delete uploaded content image by url
router.delete("/media/content-image", verifyAdmin, verifyPermission("pages"), async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    if (!url) return res.status(400).json("Image url is required");
    await removeUploadByUrl(url);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json(err.message);
  }
  if (err && err.message) {
    return res.status(400).json(err.message);
  }
  return next(err);
});

module.exports = router;
