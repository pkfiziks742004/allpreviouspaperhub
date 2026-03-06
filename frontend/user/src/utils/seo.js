import { resolveApiUrl } from "../config/api";

const DEFAULT_SITE_TITLE = "All Previous Paper Hub";
const DEFAULT_SEO_DESCRIPTION =
  "All Previous Paper Hub - Previous year papers, notes, syllabus, and exam resources.";

const ensureMeta = (key, value, attr = "name") => {
  let tag = document.querySelector(`meta[${attr}='${key}']`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value || "");
};

const ensureCanonical = href => {
  if (!href) return;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  ensureMeta("og:url", href, "property");
};

const replaceTemplate = (value, context) => {
  return String(value || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) =>
    context && context[key] !== undefined && context[key] !== null ? String(context[key]) : ""
  );
};

const normalizePathLike = value => {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      return (url.pathname || "/").replace(/\/+$/, "") || "/";
    }
  } catch (e) {
    // ignore parse errors and fallback to raw path handling
  }
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
};

const resolveCanonicalPath = ({ settings = {}, pathValue = "", fallback = window.location.pathname, context = {} }) => {
  const canonicalBase = String(settings?.canonicalUrl || window.location.origin).replace(/\/+$/, "");
  const replaced = replaceTemplate(pathValue, context).trim();
  const selectedPath = replaced || fallback || "/";
  if (selectedPath.startsWith("http://") || selectedPath.startsWith("https://")) return selectedPath;
  const normalizedPath = normalizePathLike(selectedPath);
  return `${canonicalBase}${normalizedPath === "/" ? "" : normalizedPath}`;
};

const setSeoPayload = ({ settings = {}, title = "", description = "", keywords = "", image = "", canonicalPath = "", context = {} }) => {
  const baseTitle = String(settings?.userPageTitle || settings?.seoTitle || DEFAULT_SITE_TITLE).trim();
  const finalTitle = String(title || baseTitle || DEFAULT_SITE_TITLE).trim();
  const finalDescription = String(description || settings?.seoDescription || DEFAULT_SEO_DESCRIPTION).trim();
  const finalKeywords = String(keywords || settings?.seoKeywords || "").trim();

  document.title = finalTitle;
  ensureMeta("apple-mobile-web-app-title", finalTitle);
  ensureMeta("description", finalDescription);
  ensureMeta("keywords", finalKeywords);

  ensureMeta("og:title", finalTitle, "property");
  ensureMeta("og:description", finalDescription, "property");
  ensureMeta("og:site_name", baseTitle || DEFAULT_SITE_TITLE, "property");
  ensureMeta("twitter:title", finalTitle);
  ensureMeta("twitter:description", finalDescription);

  const finalImage = String(image || settings?.ogImage || "").trim();
  if (finalImage) {
    const resolvedImage = resolveApiUrl(finalImage);
    ensureMeta("og:image", resolvedImage, "property");
    ensureMeta("twitter:image", resolvedImage);
  }

  const canonicalHref = resolveCanonicalPath({
    settings,
    pathValue: canonicalPath,
    fallback: window.location.pathname,
    context
  });
  ensureCanonical(canonicalHref);
};

export const applySeoByRoute = ({ settings = {}, context = {}, pathname = window.location.pathname }) => {
  const rules = Array.isArray(settings?.seoRoutes) ? settings.seoRoutes : [];
  if (!rules.length) return false;

  const normalizedCurrentPath = normalizePathLike(pathname);
  const matchedRule = rules.find(rule => {
    const rulePath = normalizePathLike(replaceTemplate(rule?.path || "", context));
    return rulePath === normalizedCurrentPath;
  });

  if (!matchedRule) return false;

  setSeoPayload({
    settings,
    title: replaceTemplate(matchedRule?.title, context),
    description: replaceTemplate(matchedRule?.description, context),
    keywords: replaceTemplate(matchedRule?.keywords, context),
    image: replaceTemplate(matchedRule?.ogImage, context),
    canonicalPath: replaceTemplate(matchedRule?.canonicalPath || matchedRule?.path || "", context),
    context
  });

  return true;
};

export const applySeoByPage = ({ settings = {}, pageKey = "", context = {}, fallback = {} }) => {
  const seoByPage = settings?.seoByPage || {};
  const pageSeo = seoByPage?.[pageKey] || {};

  const title =
    replaceTemplate(pageSeo?.title, context).trim() ||
    fallback.title ||
    String(settings?.userPageTitle || settings?.seoTitle || DEFAULT_SITE_TITLE).trim() ||
    DEFAULT_SITE_TITLE;

  const description =
    replaceTemplate(pageSeo?.description, context).trim() ||
    fallback.description ||
    String(settings?.seoDescription || DEFAULT_SEO_DESCRIPTION).trim();
  ensureMeta("description", description);

  const keywords =
    replaceTemplate(pageSeo?.keywords, context).trim() ||
    fallback.keywords ||
    String(settings?.seoKeywords || "").trim();

  const image =
    replaceTemplate(pageSeo?.ogImage, context).trim() ||
    String(settings?.ogImage || "").trim();
  const canonicalPathRaw = replaceTemplate(pageSeo?.canonicalPath, context).trim();

  setSeoPayload({
    settings,
    title,
    description,
    keywords,
    image,
    canonicalPath: canonicalPathRaw || fallback.canonicalPath || window.location.pathname,
    context
  });
};
