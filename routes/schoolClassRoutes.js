const express = require('express');
const router = express.Router();
const {
  createSchoolClass,
  getAllSchoolClasses,
  getSchoolClassById,
  updateSchoolClass,
  deleteSchoolClass
} = require('../controllers/schoolClassController');

router.post('/', createSchoolClass);
router.get('/', getAllSchoolClasses);
router.get('/:id', getSchoolClassById);
router.put('/:id', updateSchoolClass);
router.delete('/:id', deleteSchoolClass);

module.exports = router;
