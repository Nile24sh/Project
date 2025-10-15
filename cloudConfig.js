// cloudConfig.js
const cloudinary = require("cloudinary").v2;
require('dotenv').config(); // Load .env variables

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true, // ensures https URLs
});

module.exports = cloudinary;
