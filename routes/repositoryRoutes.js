const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getFolders,
  getItems,
  uploadItem,
  updateItem,
  deleteItem
} = require('../controllers/repositoryController');
const { protect } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'repo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

router.get('/folders', protect, getFolders);
router.get('/items', protect, getItems);
router.post('/upload', protect, upload.array('files', 50), uploadItem);
router.patch('/items/:id', protect, updateItem);
router.delete('/items/:id', protect, deleteItem);

module.exports = router;
