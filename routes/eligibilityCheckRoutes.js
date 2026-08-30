const express = require('express');
const router = express.Router();
const eligibilityCheckController = require('../controllers/eligibilityCheckController');

// Submit new eligibility check
router.post('/submit', eligibilityCheckController.submitEligibilityCheck);

// Admin: Get all eligibility checks
router.get('/', eligibilityCheckController.getAllEligibilityChecks);

// Admin: Update status
router.put('/:id/status', eligibilityCheckController.updateEligibilityCheckStatus);

// Admin: Add remark
router.put('/:id/remark', eligibilityCheckController.addEligibilityCheckRemark);

module.exports = router;
