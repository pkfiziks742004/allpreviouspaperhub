const express = require("express");
const router = express.Router();
const Semester = require("../models/Semester");
const Course = require("../models/Course");
const University = require("../models/University");
const Paper = require("../models/Paper");
const { removeUploadByFileName } = require("../utils/uploadFile");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const enrichSemesters = async semesters => {
  const [courses, universities] = await Promise.all([Course.find({}), University.find({})]);

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

// ✅ GET All Semesters
router.get("/", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=120");
    const data = await Semester.find();
    res.json(await enrichSemesters(data));
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// ✅ GET Semesters by Course
router.get("/:courseId", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=120");
    const data = await Semester.find({ courseId: req.params.courseId });

    res.json(await enrichSemesters(data));
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// ✅ POST Add Semester
router.post("/", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const semester = new Semester(req.body);
    await semester.save();

    res.json(semester);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// ✅ UPDATE Semester
router.put("/:id", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: "Not Found" });

    if (req.body.name !== undefined) semester.name = req.body.name;
    if (req.body.courseId !== undefined) semester.courseId = req.body.courseId;

    await semester.save();
    const enriched = await enrichSemesters([semester]);
    res.json(enriched[0] || semester);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// ✅ DELETE Semester
router.delete("/:id", verifyAdmin, verifyPermission("semesters"), async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ message: "Not Found" });

    const papers = await Paper.find({ semId: semester._id });
    await Promise.all(papers.map(paper => removeUploadByFileName(paper.file)));
    await Paper.deleteMany({ semId: semester._id });
    await Semester.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json(err.message);
  }
});


module.exports = router;
