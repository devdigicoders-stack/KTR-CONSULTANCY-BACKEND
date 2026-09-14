const express = require('express');
const router = express.Router();
const {
  createPaymentLink,
  getPaymentLinkById,
  verifyLinkPayment,
  getAllInvoices,
  deletePaymentLink,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes (for client payment page)
router.get('/link/:linkId', getPaymentLinkById);
router.post('/verify-link', verifyLinkPayment);

// Protected Admin Routes
router.post('/create-link', protect, createPaymentLink);
router.get('/invoices', protect, getAllInvoices);
router.delete('/:id', protect, deletePaymentLink);

module.exports = router;
