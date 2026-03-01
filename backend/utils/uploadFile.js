const fs = require("fs/promises");
const path = require("path");
const { cloudinary, cloudinaryEnabled } = require("../config/cloudinary");

const uploadsDir = path.join(__dirname, "..", "uploads");

const toUploadPathFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const clean = url.split("?")[0].trim();
  if (!clean.startsWith("/uploads/")) return null;
  const fileName = path.basename(clean);
  if (!fileName) return null;
  return path.join(uploadsDir, fileName);
};

const toUploadPathFromFileName = (fileName) => {
  if (!fileName || typeof fileName !== "string") return null;
  const safeName = path.basename(fileName.trim());
  if (!safeName) return null;
  return path.join(uploadsDir, safeName);
};

const removeFile = async filePath => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete file:", filePath, err.message);
    }
  }
};

const uploadBufferToCloudinary = async ({ buffer, mimeType, folder, resourceType = "image" }) => {
  if (!cloudinaryEnabled) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.");
  }
  if (!buffer) throw new Error("No file buffer");

  const safeFolder = String(folder || "study-portal").trim();
  const targetResourceType = resourceType || (String(mimeType || "").includes("pdf") ? "raw" : "image");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: safeFolder,
        resource_type: targetResourceType
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const isCloudinaryUrl = url => /res\.cloudinary\.com/i.test(String(url || ""));

const extractCloudinaryPublicId = url => {
  const value = String(url || "");
  const marker = "/upload/";
  const idx = value.indexOf(marker);
  if (idx === -1) return "";
  let remainder = value.slice(idx + marker.length);
  remainder = remainder.replace(/^v\d+\//, "");
  remainder = remainder.split("?")[0].trim();
  if (!remainder) return "";
  return remainder.replace(/\.[^/.?]+$/, "");
};

const removeFromCloudinaryByUrl = async (url, forcedType) => {
  if (!cloudinaryEnabled || !isCloudinaryUrl(url)) return;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  const types = forcedType ? [forcedType] : ["image", "raw"];
  for (const type of types) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: type });
      return;
    } catch (err) {
      // try next type
    }
  }
};

const removeUploadByUrl = async (url) => {
  if (!url) return;
  if (isCloudinaryUrl(url)) {
    await removeFromCloudinaryByUrl(url);
    return;
  }
  await removeFile(toUploadPathFromUrl(url));
};

const removeUploadByFileName = async (fileName) => {
  const value = String(fileName || "");
  if (!value) return;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    await removeUploadByUrl(value);
    return;
  }
  await removeFile(toUploadPathFromFileName(value));
};

module.exports = {
  uploadBufferToCloudinary,
  removeUploadByUrl,
  removeUploadByFileName,
  isCloudinaryUrl
};
