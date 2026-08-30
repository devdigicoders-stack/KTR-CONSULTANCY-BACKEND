const express = require('express');
const router = express.Router();
const {
  relateClassSection,
  getAllClassSections,
  getClassSectionByName,
  deleteClassSection
} = require('../controllers/classSectionController');

router.post('/', relateClassSection);
router.get('/', getAllClassSections);
router.get('/:className', getClassSectionByName);
router.delete('/:id', deleteClassSection);

module.exports = router;
