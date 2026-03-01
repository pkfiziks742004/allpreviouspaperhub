const router = require("express").Router();
const Course = require("../models/Course");
const Semester = require("../models/Semester");
const Paper = require("../models/Paper");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");
const { removeUploadByFileName } = require("../utils/uploadFile");

// ADD COURSE (ADMIN)
router.post("/", verifyAdmin, verifyPermission("courses"), async (req,res)=>{
  try {
    const safeName = String(req.body.name || "").trim();
    const safeCategory = String(req.body.category || "University").trim() || "University";
    const safeUniversityId = req.body.universityId || null;
    const safeButtonLabel = String(req.body.buttonLabel || "").trim();

    if (!safeName) return res.status(400).json("Course name is required");

    const allCourses = await Course.find({});
    const duplicate = allCourses.find(item => {
      const sameName = String(item.name || "").trim().toLowerCase() === safeName.toLowerCase();
      const sameUniversity = String(item.universityId || "") === String(safeUniversityId || "");
      return sameName && sameUniversity;
    });
    if (duplicate) {
      return res.status(400).json("Course name already exists for selected university/board");
    }

    const course = new Course({
      name: safeName,
      category: safeCategory,
      universityId: safeUniversityId,
      buttonLabel: safeButtonLabel
    });

    await course.save();

    res.json("Course Added");

  } catch(err){
    if (err && err.code === 11000) {
      return res.status(400).json("Course name already exists");
    }
    res.status(500).json(err.message);
  }
});


// GET ALL COURSES (USER + ADMIN)
router.get("/", async (req,res)=>{
  try {

    const courses = await Course.find({ status:true });

    res.json(courses);

  } catch(err){
    res.status(500).json(err.message);
  }
});


// UPDATE COURSE (ADMIN)
router.put("/:id", verifyAdmin, verifyPermission("courses"), async (req,res)=>{
  try {
    const safeName = String(req.body.name || "").trim();
    const safeCategory = String(req.body.category || "University").trim() || "University";
    const safeUniversityId = req.body.universityId || null;
    const safeButtonLabel = String(req.body.buttonLabel || "").trim();

    if (!safeName) return res.status(400).json("Course name is required");

    const allCourses = await Course.find({});
    const duplicate = allCourses.find(item => {
      const sameName = String(item.name || "").trim().toLowerCase() === safeName.toLowerCase();
      const sameUniversity = String(item.universityId || "") === String(safeUniversityId || "");
      const isSameRow = String(item._id || "") === String(req.params.id || "");
      return sameName && sameUniversity && !isSameRow;
    });
    if (duplicate) {
      return res.status(400).json("Course name already exists for selected university/board");
    }

    await Course.findByIdAndUpdate(
      req.params.id,
      {
        name: safeName,
        category: safeCategory,
        universityId: safeUniversityId,
        buttonLabel: safeButtonLabel
      }
    );

    res.json("Course Updated");

  } catch(err){
    if (err && err.code === 11000) {
      return res.status(400).json("Course name already exists");
    }
    res.status(500).json(err.message);
  }
});


// DELETE COURSE (ADMIN)
router.delete("/:id", verifyAdmin, verifyPermission("courses"), async (req,res)=>{
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json("Course not found");

    const semesters = await Semester.find({ courseId: course._id });
    const semesterIds = semesters.map(s => s._id);

    const papers = await Paper.find({
      $or: [
        { courseId: course._id },
        { semId: { $in: semesterIds } }
      ]
    });

    await Promise.all(papers.map(paper => removeUploadByFileName(paper.file)));
    await Paper.deleteMany({ _id: { $in: papers.map(p => p._id) } });
    await Semester.deleteMany({ _id: { $in: semesterIds } });
    await Course.findByIdAndDelete(req.params.id);

    res.json("Course Deleted");

  } catch(err){
    res.status(500).json(err.message);
  }
});


module.exports = router;
