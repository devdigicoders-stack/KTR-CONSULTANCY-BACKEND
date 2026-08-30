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
} = require('../controllers/propertyAssessmentController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `pa_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
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

const uploadFields = upload.fields([
  { name: 'property-papers', maxCount: 1 },
  { name: 'gps-photo', maxCount: 10 },
  { name: 'electricity-bill', maxCount: 1 },
  { name: 'owner-photo', maxCount: 1 },
  { name: 'pan-card', maxCount: 1 },
  { name: 'aadhaar-card', maxCount: 1 },
  { name: 'property-photo', maxCount: 1 }
]);

// Public
router.post('/submit', uploadFields, submitApplication);

// Protected (admin)
router.get('/new-count', protect, getNewCount);
router.get('/', protect, getAllApplications);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
