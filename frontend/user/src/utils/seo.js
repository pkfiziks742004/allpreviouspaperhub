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

export const applySeoByPage = ({ settings = {}, pageKey = "", context = {}, fallback = {} }) => {
  const seoByPage = settings?.seoByPage || {};
  const pageSeo = seoByPage?.[pageKey] || {};

  const baseTitle = String(settings?.userPageTitle || settings?.seoTitle || DEFAULT_SITE_TITLE).trim();
  const title =
    replaceTemplate(pageSeo?.title, context).trim() ||
    fallback.title ||
    baseTitle ||
    DEFAULT_SITE_TITLE;
  document.title = title;
  ensureMeta("apple-mobile-web-app-title", title);

  const description =
    replaceTemplate(pageSeo?.description, context).trim() ||
    fallback.description ||
    String(settings?.seoDescription || DEFAULT_SEO_DESCRIPTION).trim();
  ensureMeta("description", description);

  const keywords =
    replaceTemplate(pageSeo?.keywords, context).trim() ||
    fallback.keywords ||
    String(settings?.seoKeywords || "").trim();
  ensureMeta("keywords", keywords);

  const ogTitle = title;
  const ogDescription = description;
  ensureMeta("og:title", ogTitle, "property");
  ensureMeta("og:description", ogDescription, "property");
  ensureMeta("og:site_name", baseTitle || DEFAULT_SITE_TITLE, "property");
  ensureMeta("twitter:title", ogTitle);
  ensureMeta("twitter:description", ogDescription);

  const image =
    replaceTemplate(pageSeo?.ogImage, context).trim() ||
    String(settings?.ogImage || "").trim();
  if (image) {
    const resolvedImage = resolveApiUrl(image);
    ensureMeta("og:image", resolvedImage, "property");
    ensureMeta("twitter:image", resolvedImage);
  }

  const canonicalBase = String(settings?.canonicalUrl || window.location.origin).replace(/\/+$/, "");
  const canonicalPathRaw = replaceTemplate(pageSeo?.canonicalPath, context).trim();
  const canonicalPath = canonicalPathRaw || fallback.canonicalPath || window.location.pathname;
  const canonicalHref = canonicalPath.startsWith("http://") || canonicalPath.startsWith("https://")
    ? canonicalPath
    : `${canonicalBase}/${canonicalPath.replace(/^\/+/, "")}`;
  ensureCanonical(canonicalHref);
};

