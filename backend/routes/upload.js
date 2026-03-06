const express = require('express');
const router = express.Router();
const { verifyStore } = require('../middleware/auth');
const { upload, getThumbnailUrl } = require('../config/cloudinary');

// POST /api/upload/image - 上傳圖片（需店家登入）
router.post('/image', verifyStore, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '請選擇要上傳的圖片' });
    }

    const imageUrl = req.file.path;
    const thumbnailUrl = getThumbnailUrl(imageUrl);

    res.json({
      url: imageUrl,
      thumbnailUrl,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('圖片上傳失敗:', error);
    res.status(500).json({ message: '圖片上傳失敗' });
  }
});

module.exports = router;
