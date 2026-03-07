const express = require("express");
const router = express.Router();
const Semester = require("../models/Semester");
const Course = require("../models/Course");
const University = require("../models/University");
const Paper = require("../models/Paper");
const { removeUploadByFileName } = require("../utils/uploadFile");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const REF_CACHE_TTL_MS = Number(process.env.REFERENCE_CACHE_TTL_MS || 30 * 1000);
let refCache = { at: 0, courses: [], universities: [] };

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getReferenceData = async () => {
  const now = Date.now();
  if (refCache.at && now - refCache.at < REF_CACHE_TTL_MS) {
    return refCache;
  }

  const [courses, universities] = await Promise.all([Course.find({}), University.find({})]);
  refCache = { at: now, courses, universities };
  return refCache;
};

const enrichSemesters = async semesters => {
  const { courses, universities } = await getReferenceData();
  const courseMap = new Map(courses.map(course => [String(course._id), course]));
  const universityMap = new Map(universities.map(university => [String(university._id), university]));

  return (semesters || []).map(semester => {
    const rawCourseId = getId(semester.courseId);
    const course = courseMap.get(String(rawCourseId)) || null;
    const universityId = getId(course?.universityId);
    const university = universityMap.get(String(universityId)) || null;

    return {
      ...semester,
      courseId: course
        ? {
            ...course,
            universityId: university || course.universityId || null
          }
        : semester.courseId,
      courseName: course?.name || "",
      universityName: university?.name || "",
      courseType: course?.category || university?.type || "Other"
    };
  });
};

const findDuplicateSemester = async ({ name, courseId, excludeId = "" }) => {
  const scoped = await Semester.find({ courseId });
  return scoped.find(row => {
    const sameName = String(row.name || "").trim().toLowerCase() === String(name || "").trim().toLowerCase();
    const sameRow = String(row._id || "") === String(excludeId || "");
    return sameName && !sameRow;
  });
};

router.get("/", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=120");
    const data = await Semester.find();
    res.json(await enrichSemesters(data));
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=120");
    const data = await Semester.find({ courseId: req.params.courseId });
    res.json(await enrichSemesters(data));
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const safeName = String(req.body?.name || "").trim();
    const safeCourseId = String(req.body?.courseId || "").trim();
    if (!safeName) return res.status(400).json("Semester name is required");
    if (!safeCourseId) return res.status(400).json("Course is required");

    const course = await Course.findById(safeCourseId);
    if (!course) return res.status(400).json("Invalid course");

    const duplicate = await findDuplicateSemester({ name: safeName, courseId: safeCourseId });
    if (duplicate) return res.status(400).json("Semester already exists for selected course");

    const semester = new Semester({ name: safeName, courseId: safeCourseId });
    await semester.save();
    refCache.at = 0;
    res.json(semester);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.put("/:id", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: "Not Found" });

    const nextName =
      req.body.name !== undefined
        ? String(req.body.name || "").trim()
        : String(semester.name || "").trim();
    const nextCourseId =
      req.body.courseId !== undefined
        ? String(req.body.courseId || "").trim()
        : String(getId(semester.courseId) || "").trim();

    if (!nextName) return res.status(400).json("Semester name is required");
    if (!nextCourseId) return res.status(400).json("Course is required");

    const course = await Course.findById(nextCourseId);
    if (!course) return res.status(400).json("Invalid course");

    const duplicate = await findDuplicateSemester({
      name: nextName,
      courseId: nextCourseId,
      excludeId: semester._id
    });
    if (duplicate) return res.status(400).json("Semester already exists for selected course");

    semester.name = nextName;
    semester.courseId = nextCourseId;
    await semester.save();
    refCache.at = 0;

    const enriched = await enrichSemesters([semester]);
    res.json(enriched[0] || semester);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.delete("/:id", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: "Not Found" });

    const papers = await Paper.find({ semId: semester._id });
    await Promise.all(papers.map(paper => removeUploadByFileName(paper.file)));
    await Paper.deleteMany({ semId: semester._id });
    await Semester.findByIdAndDelete(req.params.id);
    refCache.at = 0;

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
