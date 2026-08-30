const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  submitApplication,
  getAllApplications,
  getNewCount,
  updateStatus,
  updateRemark,
  deleteApplication
} = require('../controllers/chainDeedController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chaindeed_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, PDF files are allowed'));
  }
});

// Public
router.post('/submit', upload.single('registryDocument'), submitApplication);

// Protected (admin)
router.get('/new-count', protect, getNewCount);
router.get('/', protect, getAllApplications);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
