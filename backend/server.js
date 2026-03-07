const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { verifyAdmin, verifyPermission } = require("./middleware/auth");
const { supabaseAdmin } = require("./config/supabase");

const app = express();
const isDevelopment = process.env.NODE_ENV !== "production";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];
const missingEnv = requiredEnv.filter(key => !String(process.env[key] || "").trim());
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}
if (String(process.env.JWT_SECRET || "").trim().length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters for secure signing");
}
if (String(process.env.JWT_SECRET).includes("change_this_to_a_long_random_secret")) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is using placeholder value. Set a real secret in backend/.env");
  }
  console.warn("Warning: JWT_SECRET is using placeholder value. Update backend/.env for better security.");
}

const parseOrigins = value =>
  String(value || "")
    .split(",")
    .map(v => v.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = parseOrigins(process.env.FRONTEND_ORIGINS);
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_ORIGINS is required in production");
}
const isTrustedPublicOrigin = origin => {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const host = String(u.hostname || "").toLowerCase();
    return host === "allpreviouspaperhub.in" || host.endsWith(".allpreviouspaperhub.in");
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalizedOrigin = String(origin).trim().replace(/\/+$/, "");
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      isTrustedPublicOrigin(normalizedOrigin) ||
      (process.env.NODE_ENV !== "production" &&
        (normalizedOrigin === "http://localhost:3000" || normalizedOrigin === "http://localhost:3001"));
    if (isAllowed) {
      return callback(null, true);
    }
    console.warn("CORS blocked origin:", normalizedOrigin);
    return callback(new Error("CORS blocked"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
    "X-Requested-With"
  ],
  credentials: false
};

const createRateLimiter = ({ windowMs, getMax, keyPrefix = "global", skip, keyResolver }) => {
  const buckets = new Map();
  const cleanupMs = Math.max(30 * 1000, Math.floor(windowMs / 2));

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now > bucket.resetAt) {
        buckets.delete(key);
      }
    }
  }, cleanupMs).unref();

  return (req, res, next) => {
    if (typeof skip === "function" && skip(req)) return next();

    const resolvedKey =
      (typeof keyResolver === "function" && keyResolver(req)) ||
      req.ip ||
      req.connection?.remoteAddress ||
      "unknown";
    const key = `${keyPrefix}:${resolvedKey}`;
    const now = Date.now();
    const limitMax = Number(getMax(req));
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    const remaining = Math.max(limitMax - current.count, 0);
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

    res.setHeader("X-RateLimit-Limit", String(limitMax));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(current.resetAt / 1000)));

    if (current.count > limitMax) {
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json(`Too many requests. Try again in ${retryAfterSec}s`);
    }
    return next();
  };
};

const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const RATE_MAX_PUBLIC = Number(process.env.RATE_LIMIT_MAX_PUBLIC || process.env.RATE_LIMIT_MAX || 180);
const RATE_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH || 360);
const LOGIN_WINDOW_MS = Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || 15 * 60 * 1000);
const RATE_MAX_LOGIN = Number(process.env.RATE_LIMIT_MAX_LOGIN || 20);

const apiRateLimit = createRateLimiter({
  windowMs: RATE_WINDOW_MS,
  keyPrefix: "api",
  getMax: req => (req.headers.authorization ? RATE_MAX_AUTH : RATE_MAX_PUBLIC),
  skip: req => req.method === "OPTIONS" || isDevelopment,
  keyResolver: req => {
    const authHeader = String(req.headers.authorization || "").trim();
    if (authHeader) return `auth:${authHeader.slice(-24)}`;
    return `ip:${req.ip || req.connection?.remoteAddress || "unknown"}`;
  }
});

const loginRateLimit = createRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  keyPrefix: "login",
  getMax: () => RATE_MAX_LOGIN,
  skip: req => req.method === "OPTIONS" || isDevelopment
});

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use(
  "/uploads",
  express.static("uploads", {
    index: false,
    fallthrough: false,
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0
  })
);

// Routes
app.use("/api/auth/login", loginRateLimit);
app.use("/api", apiRateLimit);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/course"));
app.use("/api/semesters", require("./routes/semester"));
app.use("/api/papers", require("./routes/paper"));
app.use("/api/site-rating", require("./routes/rating"));
app.use("/api/settings", require("./routes/setting"));
app.use("/api/ads-settings", require("./routes/adsSetting"));
app.use("/api/signals", require("./routes/signals"));
app.use("/api/universities", require("./routes/university"));
app.use("/api/pages", require("./routes/page"));

// Health check (useful for Cloud Run / uptime monitors)
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, service: "backend" });
});

// ads.txt (public, required for AdSense verification)
app.get("/ads.txt", async (req, res) => {
  try {
    const AdsSetting = require("./models/AdsSetting");
    const settings = await AdsSetting.findOne();
    const body = String(settings?.adsTxt || "").trim();
    res.status(200).type("text/plain; charset=utf-8").send(body);
  } catch (err) {
    res.status(500).type("text/plain; charset=utf-8").send("");
  }
});

// Open Graph image resolver (public)
app.get("/og-image", async (req, res) => {
  try {
    const Setting = require("./models/Setting");
    const settings = await Setting.findOne();
    const candidate =
      String(settings?.ogImage || "").trim() ||
      String(settings?.logoUrl || "").trim() ||
      (Array.isArray(settings?.bannerImages) ? String(settings.bannerImages[0] || "").trim() : "");

    if (!candidate) return res.status(404).json("OG image not configured");

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.redirect(302, candidate);
  } catch (err) {
    return res.status(500).json("Failed to resolve OG image");
  }
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, ()=>{
  console.log(`Server Running on ${PORT}`);
});

// Dashboard Stats API
app.get("/api/stats", verifyAdmin, verifyPermission("dashboard"), async (req, res) => {

  try {
    const Course = require("./models/Course");
    const Semester = require("./models/Semester");
    const Paper = require("./models/Paper");
    const University = require("./models/University");

    const courses = await Course.countDocuments();
    const semesters = await Semester.countDocuments();
    const papers = await Paper.countDocuments();
    const universities = await University.countDocuments({ status: true });
    const allUniversities = await University.find({ status: true });
    const universityCounts = allUniversities.reduce((acc, row) => {
      const key = row.type || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      courses,
      semesters,
      papers,
      universities,
      universityCounts
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Sitemap.xml (public)
app.get("/sitemap.xml", async (req, res) => {
  try {
    const Setting = require("./models/Setting");
    const Page = require("./models/Page");
    const settings = await Setting.findOne();
    const baseUrl = (settings?.sitemapBaseUrl || "").replace(/\/+$/, "");
    const toPath = value => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      try {
        if (/^https?:\/\//i.test(raw)) {
          const parsed = new URL(raw);
          return (parsed.pathname || "/").replace(/\/+$/, "") || "/";
        }
      } catch {
        // fallback below
      }
      const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
      return withSlash.replace(/\/+$/, "") || "/";
    };
    const escapeXml = value =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    if (!baseUrl) {
      return res.status(200).type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }

    const corePaths = ["/", "/about", "/privacy-policy"];
    const extraPaths = Array.isArray(settings?.sitemapExtraPaths)
      ? settings.sitemapExtraPaths
      : [];
    const pages = await Page.find({ published: true }).catch(() => []);
    const pagePaths = (pages || [])
      .map(p => String(p?.slug || "").trim())
      .filter(Boolean)
      .map(slug => {
        if (slug === "about") return "/about";
        if (slug === "privacy-policy") return "/privacy-policy";
        return `/page/${slug}`;
      });
    const seoRulePaths = Array.isArray(settings?.seoRoutes)
      ? settings.seoRoutes
          .flatMap(rule => [rule?.path, rule?.canonicalPath])
          .map(toPath)
          .filter(Boolean)
      : [];

    const paths = [...new Set([...corePaths, ...extraPaths, ...pagePaths, ...seoRulePaths])];
    const urls = paths
      .filter(p => typeof p === "string" && p.trim())
      .map(toPath)
      .map(p => `${baseUrl}${p}`);

    const body = urls
      .map(
        u => `<url><loc>${escapeXml(u)}</loc></url>`
      )
      .join("");

    res
      .status(200)
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Basic runtime probe for Supabase connectivity
supabaseAdmin
  .from("settings")
  .select("id")
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error("Supabase connection check failed:", error.message);
      return;
    }
    console.log("Supabase Connected");
  });


