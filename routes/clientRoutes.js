const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  submitProfile,
  getMyProfile,
  getMyClients,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
  getPendingCount,
  getAllDocuments,
  getMyDocuments,
  getDashboardStats,
  saveCreditInfo,
  addClientDocument,
  softDeleteDocument,
  createCustomFolder,
  deleteCustomFolder,
  uploadFolderDocument,
  deleteFolderDocument,
  addPendency,
  updatePendencyStatus,
  deletePendency,
  getPublicSharedClientDocs,
  updateDocumentOrder
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// Setup Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Keep original extension
    const ext = path.extname(file.originalname);
    cb(null, `${req.adminId}-${file.fieldname}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Define upload fields
const uploadFields = upload.fields([
  { name: 'photoUrl', maxCount: 1 },
  { name: 'idProofUrl', maxCount: 1 },
  { name: 'addressProofUrl', maxCount: 1 },
  { name: 'panCardUrl', maxCount: 1 },
  { name: 'aadhaarUrl', maxCount: 1 },
  { name: 'salarySlipUrl', maxCount: 1 },
  { name: 'itrUrl', maxCount: 1 },
  { name: 'form16Url', maxCount: 1 },
  { name: 'bankStatementUrl', maxCount: 1 },
  { name: 'propertyDocUrl', maxCount: 1 },
  { name: 'otherDocUrl', maxCount: 1 },
  { name: 'otherDocs', maxCount: 10 }
]);

// User Routes
router.route('/profile')
  .post(protect, uploadFields, submitProfile)
  .get(protect, getMyProfile);

router.route('/my-clients')
  .get(protect, getMyClients);

// Documents Routes
router.route('/documents/my')
  .get(protect, getMyDocuments);
router.route('/documents/all')
  .get(protect, getAllDocuments);

// Dashboard Stats
router.route('/dashboard-stats')
  .get(protect, getDashboardStats);

// Admin Routes (Technically these should be in adminRoutes, but keeping here for client domain logic)
// We will add logic in controller to ensure they are admins
router.route('/pending/count')
  .get(protect, getPendingCount);

router.route('/')
  .get(protect, getAllClients);

// Public Shared Documents Route (No login required)
router.route('/shared/:id')
  .get(getPublicSharedClientDocs);

router.route('/:id')
  .get(protect, getClientById)
  .put(protect, uploadFields, updateClient)
  .delete(protect, deleteClient);

router.route('/:id/document-order')
  .put(protect, updateDocumentOrder);

// Setup Multer multi/single document upload handler
const docUploadMiddleware = upload.fields([
  { name: 'files', maxCount: 20 },
  { name: 'file', maxCount: 1 }
]);

router.route('/:id/documents')
  .post(protect, docUploadMiddleware, addClientDocument)
  .delete(protect, softDeleteDocument);

router.route('/:id/folders')
  .post(protect, createCustomFolder);

router.route('/:id/folders/:folderId')
  .delete(protect, deleteCustomFolder);

router.route('/:id/folders/:folderId/documents')
  .post(protect, docUploadMiddleware, uploadFolderDocument);

router.route('/:id/folders/:folderId/documents/:docId')
  .delete(protect, deleteFolderDocument);

router.route('/:id/pendencies')
  .post(protect, addPendency);

router.route('/:id/pendencies/:pendencyId')
  .patch(protect, updatePendencyStatus)
  .delete(protect, deletePendency);

router.route('/:id/status')
  .patch(protect, updateClientStatus);

router.route('/:id/credit-info')
  .post(protect, saveCreditInfo);

module.exports = router;
