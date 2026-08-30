const express = require('express');
const router = express.Router();
const {
  createSchoolFeeType,
  getAllSchoolFeeTypes,
  getSchoolFeeTypeById,
  updateSchoolFeeType,
  deleteSchoolFeeType
} = require('../controllers/schoolGlobalFeeTypeController');

router.post('/', createSchoolFeeType);
router.get('/', getAllSchoolFeeTypes);
router.get('/:id', getSchoolFeeTypeById);
router.put('/:id', updateSchoolFeeType);
router.delete('/:id', deleteSchoolFeeType);

module.exports = router;
