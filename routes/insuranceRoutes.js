const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  submitInquiry,
  getAllInquiries,
  updateStatus
} = require('../controllers/insuranceController');
const { protect } = require('../middleware/authMiddleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ins_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, PDF, and DOC files are allowed.'));
    }
  }
});

const uploadFields = upload.fields([
  { name: 'rcDocument', maxCount: 1 },
  { name: 'previousPolicyDocument', maxCount: 1 }
]);

// Public inquiry submission
router.post('/submit', uploadFields, submitInquiry);

// Protected routes (Admin)
router.get('/', protect, getAllInquiries);
router.patch('/:id/status', protect, updateStatus);

module.exports = router;
