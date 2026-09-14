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
  saveCreditInfo
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

const upload = multer({ storage: storage });

// Define upload fields
const uploadFields = upload.fields([
  { name: 'photoUrl', maxCount: 1 },
  { name: 'idProofUrl', maxCount: 1 },
  { name: 'addressProofUrl', maxCount: 1 },
  { name: 'panCardUrl', maxCount: 1 },
  { name: 'aadhaarUrl', maxCount: 1 },
  { name: 'salarySlipUrl', maxCount: 1 },
  { name: 'bankStatementUrl', maxCount: 1 },
  { name: 'otherDocUrl', maxCount: 1 },
  { name: 'otherDocs', maxCount: 5 }
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

router.route('/:id')
  .get(protect, getClientById)
  .put(protect, uploadFields, updateClient)
  .delete(protect, deleteClient);

router.route('/:id/status')
  .patch(protect, updateClientStatus);

router.route('/:id/credit-info')
  .post(protect, saveCreditInfo);

module.exports = router;
