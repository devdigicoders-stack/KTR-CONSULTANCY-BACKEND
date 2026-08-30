const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  submitCase,
  getAllCases,
  getNewCount,
  updateStatus,
  updateRemark,
  deleteCase
} = require('../controllers/cibilCaseController');
const { protect } = require('../middleware/authMiddleware');

// Multer setup for PAN file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `pan_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, PDF files are allowed'));
  }
});

// Public
router.post('/submit', upload.single('panFile'), submitCase);

// Protected (admin)
router.get('/new-count', protect, getNewCount);
router.get('/', protect, getAllCases);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteCase);

module.exports = router;
