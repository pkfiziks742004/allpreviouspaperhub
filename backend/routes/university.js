const router = require("express").Router();
const multer = require("multer");
const University = require("../models/University");
const Course = require("../models/Course");
const Semester = require("../models/Semester");
const Paper = require("../models/Paper");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");
const { removeUploadByUrl, removeUploadByFileName, uploadBufferToCloudinary } = require("../utils/uploadFile");

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon"
]);

const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_IMAGE_UPLOAD_BYTES || 5 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

// ADD UNIVERSITY (ADMIN)
router.post("/", verifyAdmin, verifyPermission("universities"), async (req, res) => {
  try {
    const safeName = String(req.body.name || "").trim();
    if (!safeName) return res.status(400).json("Name is required");

    const uni = new University({
      name: safeName,
      type: String(req.body.type || "University").trim() || "University",
      logoUrl: req.body.logoUrl || "",
      comingSoon: !!req.body.comingSoon,
      comingSoonText: String(req.body.comingSoonText || "Coming soon").trim() || "Coming soon"
    });

    await uni.save();
    res.json("University Added");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET UNIVERSITIES (USER + ADMIN)
router.get("/", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=120");
    const list = await University.find({ status: true });
    res.json(list);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// UPDATE UNIVERSITY (ADMIN)
router.put("/:id", verifyAdmin, verifyPermission("universities"), async (req, res) => {
  try {
    const safeName = String(req.body.name || "").trim();
    if (!safeName) return res.status(400).json("Name is required");

    const payload = {
      name: safeName,
      type: String(req.body.type || "University").trim() || "University",
      comingSoon: !!req.body.comingSoon,
      comingSoonText: String(req.body.comingSoonText || "Coming soon").trim() || "Coming soon"
    };

    if (req.body.logoUrl) {
      payload.logoUrl = req.body.logoUrl;
    }

    await University.findByIdAndUpdate(req.params.id, payload);

    res.json("University Updated");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// DELETE UNIVERSITY (ADMIN)
router.delete("/:id", verifyAdmin, verifyPermission("universities"), async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) return res.status(404).json("University not found");

    const courses = await Course.find({ universityId: university._id });
    const courseIds = courses.map(c => c._id);

    const semesters = await Semester.find({ courseId: { $in: courseIds } });
    const semesterIds = semesters.map(s => s._id);

    const papers = await Paper.find({
      $or: [
        { courseId: { $in: courseIds } },
        { semId: { $in: semesterIds } }
      ]
    });

    await Promise.all(papers.map(paper => removeUploadByFileName(paper.file)));
    await Paper.deleteMany({ _id: { $in: papers.map(p => p._id) } });
    await Semester.deleteMany({ _id: { $in: semesterIds } });
    await Course.deleteMany({ _id: { $in: courseIds } });
    await University.findByIdAndDelete(req.params.id);
    await removeUploadByUrl(university.logoUrl);

    res.json("University Deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// UPLOAD UNIVERSITY LOGO (ADMIN)
router.post("/:id/logo", verifyAdmin, verifyPermission("universities"), uploadLogo.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json("No file");
    const uni = await University.findById(req.params.id);
    if (!uni) return res.status(404).json("University not found");
    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: "study-portal/universities/logo",
      resourceType: "image"
    });
    const oldLogo = uni.logoUrl;
    uni.logoUrl = uploaded.secure_url;
    await uni.save();
    await removeUploadByUrl(oldLogo);
    res.json(uni);
  } catch (err) {
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
