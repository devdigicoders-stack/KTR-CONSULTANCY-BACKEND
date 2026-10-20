const express = require('express');
const router = express.Router();
const {
  createPaymentLink,
  createManualInvoice,
  updatePaymentStatus,
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

// Protected Staff & Admin Routes
router.post('/create-link', protect, createPaymentLink);
router.post('/create-manual-invoice', protect, createManualInvoice);
router.patch('/:id/status', protect, updatePaymentStatus);
router.get('/invoices', protect, getAllInvoices);
router.delete('/:id', protect, deletePaymentLink);

module.exports = router;
