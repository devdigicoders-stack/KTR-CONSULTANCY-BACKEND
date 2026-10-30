const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getCaseStudies,
  getCaseStudyById,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  updateCustomFields,
  uploadCaseDocuments,
  replaceCaseDocument,
  renameCaseDocument,
  deleteCaseDocument,
  reorderCaseDocuments,
  addBankerQuery,
  replyBankerQuery,
  updateQueryStatus,
  runAiIntelligence,
  generateShareLink,
  getSharedCaseStudy,
  submitBankerQueryFromShare
} = require('../controllers/caseStudyController');
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
    cb(null, 'case-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Public Share Routes (Banker, Advocate, Valuer, CA)
router.get('/shared/:code', getSharedCaseStudy);
router.post('/shared/:code/query', submitBankerQueryFromShare);

// Private Staff & Admin Routes
router.get('/', protect, getCaseStudies);
router.post('/', protect, createCaseStudy);
router.get('/:id', protect, getCaseStudyById);
router.put('/:id', protect, updateCaseStudy);
router.delete('/:id', protect, deleteCaseStudy);

// Custom Fields
router.patch('/:id/fields', protect, updateCustomFields);

// Documents Management
router.post('/:id/documents', protect, upload.array('files', 100), uploadCaseDocuments);
router.post('/:id/documents/:docId/replace', protect, upload.single('file'), replaceCaseDocument);
router.patch('/:id/documents/reorder', protect, reorderCaseDocuments);
router.patch('/:id/documents/:docId', protect, renameCaseDocument);
router.delete('/:id/documents/:docId', protect, deleteCaseDocument);

// Discussions & Queries
router.post('/:id/queries', protect, addBankerQuery);
router.put('/:id/queries/:queryId', protect, replyBankerQuery);
router.patch('/:id/queries/:queryId/status', protect, updateQueryStatus);

// AI Case Intelligence
router.post('/:id/ai-analyze', protect, runAiIntelligence);

// Secure Share Link Generation
router.post('/:id/share', protect, generateShareLink);

module.exports = router;
