const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const Paper = require("../models/Paper");
const Course = require("../models/Course");
const Semester = require("../models/Semester");
const University = require("../models/University");
const path = require("path");
const { removeUploadByFileName, uploadBufferToCloudinary } = require("../utils/uploadFile");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_PDF_UPLOAD_BYTES || 25 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || "").toLowerCase();
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = ext === ".pdf";
    if (!isPdfMime && !isPdfExt) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});

const isAbsoluteUrl = value => /^https?:\/\//i.test(String(value || ""));
const toSafePdfName = value =>
  `${String(value || "paper")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "paper"}.pdf`;

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const toNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

const enrichPapers = async papers => {
  const [semesters, courses, universities] = await Promise.all([
    Semester.find({}),
    Course.find({}),
    University.find({})
  ]);

  const semesterMap = new Map(semesters.map(item => [String(item._id), item]));
  const courseMap = new Map(courses.map(item => [String(item._id), item]));
  const universityMap = new Map(universities.map(item => [String(item._id), item]));

  const rows = (papers || []).map(paper => {
    const semesterId = getId(paper.semId);
    const semester = semesterMap.get(String(semesterId)) || null;
    const courseId = getId(paper.courseId) || getId(semester?.courseId);
    const course = courseMap.get(String(courseId)) || null;
    const universityId = getId(course?.universityId);
    const university = universityMap.get(String(universityId)) || null;
    const category = university?.type || course?.category || "Other";

    return {
      ...paper,
      semId: semester || paper.semId,
      courseId: course
        ? {
            ...course,
            universityId: university || course.universityId || null
          }
        : paper.courseId,
      semesterName: semester?.name || "",
      courseName: course?.name || "",
      universityName: university?.name || "",
      category
    };
  });

  rows.sort((a, b) => {
    const categoryCmp = collator.compare(String(a.category || ""), String(b.category || ""));
    if (categoryCmp !== 0) return categoryCmp;
    const universityCmp = collator.compare(String(a.universityName || ""), String(b.universityName || ""));
    if (universityCmp !== 0) return universityCmp;
    const courseCmp = collator.compare(String(a.courseName || ""), String(b.courseName || ""));
    if (courseCmp !== 0) return courseCmp;
    const semCmp = collator.compare(String(a.semesterName || ""), String(b.semesterName || ""));
    if (semCmp !== 0) return semCmp;
    const yearCmp = toNumber(b.year) - toNumber(a.year);
    if (yearCmp !== 0) return yearCmp;
    return collator.compare(String(a.title || ""), String(b.title || ""));
  });

  return rows;
};



// ✅ Download Count
router.get("/download/:id", async (req,res)=>{
  try{

    const paper = await Paper.findById(req.params.id);

    if(!paper) return res.status(404).json("Not Found");

    paper.downloads = (paper.downloads || 0) + 1;

    await paper.save();

    res.json(paper);

  }catch(err){
    res.status(500).json(err.message);
  }
});



// ✅ Search
router.get("/search/:key", async (req,res)=>{
  try{

    const data = await Paper.find({
      title: { $regex: req.params.key, $options:"i" }
    });

    res.json(data);

  }catch(err){
    res.status(500).json(err.message);
  }
});


// ✅ All Papers
router.get("/", async (req,res)=>{
  try{
    const data = await Paper.find();
    res.json(await enrichPapers(data));

  }catch(err){
    res.status(500).json(err.message);
  }
});


// ✅ By Semester
router.get("/semester/:semId", async (req,res)=>{
  try{

    const data = await Paper.find({
      semId: req.params.semId
    });

    res.json(await enrichPapers(data));

  }catch(err){
    res.status(500).json(err.message);
  }
});

// ✅ Force file download
router.get("/download-file/:id", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json("Not Found");

    paper.downloads = (paper.downloads || 0) + 1;
    await paper.save();

    const downloadName = toSafePdfName(paper.title);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);

    if (isAbsoluteUrl(paper.file)) {
      const remote = await axios.get(paper.file, { responseType: "arraybuffer" });
      return res.send(Buffer.from(remote.data));
    }

    const filePath = path.join(__dirname, "..", "uploads", paper.file);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

// View paper inline (no forced download)
router.get("/open-file/:id", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json("Not Found");

    const fileName = toSafePdfName(paper.title);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    if (isAbsoluteUrl(paper.file)) {
      const remote = await axios.get(paper.file, { responseType: "arraybuffer" });
      return res.send(Buffer.from(remote.data));
    }

    const filePath = path.join(__dirname, "..", "uploads", paper.file);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

// ✅ Single Paper
router.get("/:id", async (req, res) => {
  try {
    const data = await Paper.findById(req.params.id);

    if (!data) return res.status(404).json("Not Found");
    const rows = await enrichPapers([data]);
    res.json(rows[0] || data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ Upload
router.post("/", verifyAdmin, verifyPermission("papers"), upload.single("pdf"), async (req,res)=>{
  try{
    if (!req.file) return res.status(400).json("PDF file is required");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/papers",
      resourceType: "raw"
    });

    const paper = new Paper({
      courseId:req.body.courseId,
      semId:req.body.semId,
      title:req.body.title,
      year:req.body.year,
      file:uploaded.secure_url
    });

    await paper.save();

    const rows = await enrichPapers([paper]);
    res.json(rows[0] || paper);

  }catch(err){
    res.status(500).json(err.message);
  }
});

// ✅ Update paper metadata / file
router.put("/:id", verifyAdmin, verifyPermission("papers"), upload.single("pdf"), async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json("Not Found");

    if (req.body.courseId !== undefined) paper.courseId = req.body.courseId;
    if (req.body.semId !== undefined) paper.semId = req.body.semId;
    if (req.body.title !== undefined) paper.title = req.body.title;
    if (req.body.year !== undefined) paper.year = req.body.year;

    if (req.file) {
      const uploaded = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        folder: "study-portal/papers",
        resourceType: "raw"
      });
      const oldFile = paper.file;
      paper.file = uploaded.secure_url;
      await paper.save();
      await removeUploadByFileName(oldFile);
    } else {
      await paper.save();
    }

    const rows = await enrichPapers([paper]);
    res.json(rows[0] || paper);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ Delete
router.delete("/:id", verifyAdmin, verifyPermission("papers"), async (req,res)=>{
  try{
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json("Not Found");
    await Paper.findByIdAndDelete(req.params.id);
    await removeUploadByFileName(paper.file);

    res.json("Deleted");

  }catch(err){
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
