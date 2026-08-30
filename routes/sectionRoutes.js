const express = require('express');
const router = express.Router();
const {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection
} = require('../controllers/sectionController');

router.post('/', createSection);
router.get('/', getAllSections);
router.get('/:id', getSectionById);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

module.exports = router;
