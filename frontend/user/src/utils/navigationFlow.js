const FLOW_KEY = "user_navigation_flow_v1";
const FLOW_TTL_MS = 6 * 60 * 60 * 1000;

const readFlow = () => {
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    if (!parsed.ts || Date.now() - Number(parsed.ts) > FLOW_TTL_MS) {
      localStorage.removeItem(FLOW_KEY);
      return {};
    }
    return parsed;
  } catch (e) {
    return {};
  }
};

const writeFlow = flow => {
  try {
    localStorage.setItem(FLOW_KEY, JSON.stringify({ ...flow, ts: Date.now() }));
  } catch (e) {
    // ignore
  }
};

export const markUniversityFlow = universitySlug => {
  const u = String(universitySlug || "").trim();
  if (!u) return;
  writeFlow({ u, c: "", s: "", p: "" });
};

export const markCourseFlow = (universitySlug, courseSlug) => {
  const u = String(universitySlug || "").trim();
  const c = String(courseSlug || "").trim();
  if (!u || !c) return;
  writeFlow({ u, c, s: "", p: "" });
};

export const markSemesterFlow = (universitySlug, courseSlug, semesterSlug) => {
  const u = String(universitySlug || "").trim();
  const c = String(courseSlug || "").trim();
  const s = String(semesterSlug || "").trim();
  if (!u || !c || !s) return;
  writeFlow({ u, c, s, p: "" });
};

export const markPaperFlow = (universitySlug, courseSlug, semesterSlug, paperSlug) => {
  const u = String(universitySlug || "").trim();
  const c = String(courseSlug || "").trim();
  const s = String(semesterSlug || "").trim();
  const p = String(paperSlug || "").trim();
  if (!u || !c || !s || !p) return;
  writeFlow({ u, c, s, p });
};

export const canAccessUniversity = universitySlug => {
  const flow = readFlow();
  return flow.u === String(universitySlug || "").trim();
};

export const canAccessCourse = (universitySlug, courseSlug) => {
  const flow = readFlow();
  return (
    flow.u === String(universitySlug || "").trim() &&
    flow.c === String(courseSlug || "").trim()
  );
};

export const canAccessSemester = (universitySlug, courseSlug, semesterSlug) => {
  const flow = readFlow();
  return (
    flow.u === String(universitySlug || "").trim() &&
    flow.c === String(courseSlug || "").trim() &&
    flow.s === String(semesterSlug || "").trim()
  );
};

export const canAccessPaper = (universitySlug, courseSlug, semesterSlug, paperSlug) => {
  const flow = readFlow();
  return (
    flow.u === String(universitySlug || "").trim() &&
    flow.c === String(courseSlug || "").trim() &&
    flow.s === String(semesterSlug || "").trim() &&
    flow.p === String(paperSlug || "").trim()
  );
};
