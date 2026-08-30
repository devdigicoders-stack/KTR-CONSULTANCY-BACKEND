const express = require('express');
const router = express.Router();
const {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool
} = require('../controllers/schoolGlobalDetailController');

// All routes public for now for easy testing
router.post('/', createSchool);
router.get('/', getAllSchools);
router.get('/:id', getSchoolById);
router.put('/:id', updateSchool);
router.delete('/:id', deleteSchool);

module.exports = router;
