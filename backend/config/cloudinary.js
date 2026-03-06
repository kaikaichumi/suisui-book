const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'suisuibook',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Generate thumbnail URL from Cloudinary URL
function getThumbnailUrl(imageUrl, width = 300, height = 300) {
  if (!imageUrl) return '';
  // Insert transformation before /upload/ in Cloudinary URL
  return imageUrl.replace('/upload/', `/upload/c_thumb,w_${width},h_${height}/`);
}

module.exports = { cloudinary, upload, getThumbnailUrl };
