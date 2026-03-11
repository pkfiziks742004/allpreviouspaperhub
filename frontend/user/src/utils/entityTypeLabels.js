export function getEntityTypeKey(type) {
  const value = String(type || "").toLowerCase();
  const isExamType =
    value.includes("entrance") ||
    value.includes("exam") ||
    value.includes("examination") ||
    value.includes("test") ||
    value.includes("recruitment") ||
    value.includes("competitive") ||
    value.includes("assessment");

  if (isExamType) return "entranceExam";
  if (value.includes("school")) return "school";
  if (value.includes("college")) return "college";
  if (value.includes("university")) return "university";
  return "other";
}

export function getCoursesDisplayLabel(type) {
  const typeKey = getEntityTypeKey(type);
  if (typeKey === "school") return "Subjects";
  if (typeKey === "entranceExam") return "Exam Papers";
  return "Courses";
}

export function getSemestersDisplayLabel(type) {
  const typeKey = getEntityTypeKey(type);
  if (typeKey === "school") return "Years";
  if (typeKey === "entranceExam") return "Sessions";
  return "Semesters";
}

export function getPapersDisplayLabel(type) {
  const typeKey = getEntityTypeKey(type);
  if (typeKey === "entranceExam") return "Exam Papers";
  return "Question Papers";
}
