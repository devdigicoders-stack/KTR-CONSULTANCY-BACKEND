const express = require('express');
const router = express.Router();
const {
  submitEnquiry,
  getAllEnquiries,
  getUnreadCount,
  updateStatus,
  updateRemark,
  deleteEnquiry
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/submit', submitEnquiry);

// Protected (admin)
router.get('/unread-count', protect, getUnreadCount);
router.get('/', protect, getAllEnquiries);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;
