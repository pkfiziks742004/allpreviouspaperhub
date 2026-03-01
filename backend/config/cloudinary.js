const { v2: cloudinary } = require("cloudinary");

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();

const enabled = !!(cloudName && apiKey && apiSecret);

if (enabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

module.exports = {
  cloudinary,
  cloudinaryEnabled: enabled
};

