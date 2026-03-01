const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const Paper = require("../models/Paper");
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

    res.json(data);

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

    res.json(data);

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
    res.json(data);
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

    res.json(paper);

  }catch(err){
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
