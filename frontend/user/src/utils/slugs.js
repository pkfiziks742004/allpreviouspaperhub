export const RESERVED_SLUGS = new Set([
  "about",
  "courses",
  "course",
  "papers",
  "paper-open",
  "page"
]);

export function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toRouteSegment(value, fallback = "item") {
  const slug = toSlug(value);
  if (!slug) return fallback;
  if (RESERVED_SLUGS.has(slug)) return `${slug}-item`;
  return slug;
}

