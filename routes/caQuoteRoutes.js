const express = require('express');
const router = express.Router();
const {
  submitQuote,
  getAllQuotes,
  getNewCount,
  updateStatus,
  updateRemark,
  deleteQuote
} = require('../controllers/caQuoteController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/submit', submitQuote);

// Protected (admin)
router.get('/new-count', protect, getNewCount);
router.get('/', protect, getAllQuotes);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/remark', protect, updateRemark);
router.delete('/:id', protect, deleteQuote);

module.exports = router;
