const express = require('express');
const router = express.Router();
const cibilReportController = require('../controllers/cibilReportController');
const { protect } = require('../middleware/authMiddleware');

// Save a CIBIL report (public or protected depending on where it's called from)
router.post('/save', cibilReportController.saveCibilReport);

// Auto-refund route when bureau API fails
router.post('/auto-refund', cibilReportController.autoRefund);

// Get all CIBIL reports (Admin only ideally, but keeping protect)
router.get('/all', protect, cibilReportController.getAllCibilReports);

// Get my CIBIL reports
router.get('/my', protect, cibilReportController.getMyCibilReports);

// Get all CIBIL reports (Fallback for legacy)
router.get('/', protect, cibilReportController.getAllCibilReports);

// Delete a CIBIL report
router.delete('/:id', protect, cibilReportController.deleteCibilReport);

// Direct download invoice PDF
router.get('/invoice-pdf/:id', cibilReportController.downloadInvoicePdf);

module.exports = router;
