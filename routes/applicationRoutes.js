const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
  getPendingCount,
  updateRemark
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// Public route for website submission
router.post('/submit', submitApplication);

// Protected routes for admin panel
router.get('/pending-count', protect, getPendingCount);
router.get('/', protect, getAllApplications);
router.patch('/:id/status', protect, updateApplicationStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
