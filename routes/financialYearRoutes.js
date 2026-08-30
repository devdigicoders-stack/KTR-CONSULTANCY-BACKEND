const express = require('express');
const router = express.Router();
const {
  createFinancialYear,
  getAllFinancialYears,
  updateFinancialYear,
  deleteFinancialYear
} = require('../controllers/financialYearController');

// All routes public for now to allow easy testing from Postman
router.post('/', createFinancialYear);
router.get('/', getAllFinancialYears);
router.put('/:id', updateFinancialYear);
router.delete('/:id', deleteFinancialYear);

module.exports = router;
