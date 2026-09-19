const express = require('express');
const router = express.Router();
const {
  createPaymentLink,
  getPaymentLinkById,
  verifyLinkPayment,
  getAllInvoices,
  deletePaymentLink,
  downloadPaymentLinkInvoicePdf,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes (for client payment page & invoice download)
router.get('/link/:linkId', getPaymentLinkById);
router.post('/verify-link', verifyLinkPayment);
router.get('/invoice-pdf/:id', downloadPaymentLinkInvoicePdf);

// Protected Admin Routes
router.post('/create-link', protect, createPaymentLink);
router.get('/invoices', protect, getAllInvoices);
router.delete('/:id', protect, deletePaymentLink);

module.exports = router;
