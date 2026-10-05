const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createForm,
  getMyForms,
  getPublicForm,
  submitPublicForm,
  deleteForm
} = require('../controllers/formController');
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
    cb(null, 'form-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
});

// Public Routes (for client form submission & doc uploading)
router.get('/public/:linkId', getPublicForm);
router.post('/public/:linkId/submit', upload.any(), submitPublicForm);

// Protected Staff / Admin Routes
router.post('/create', protect, createForm);
router.get('/my-forms', protect, getMyForms);
router.delete('/:id', protect, deleteForm);

module.exports = router;
