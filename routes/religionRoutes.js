const express = require('express');
const router = express.Router();
const {
  createReligion,
  getAllReligions,
  getReligionById,
  updateReligion,
  deleteReligion
} = require('../controllers/religionController');

router.post('/', createReligion);
router.get('/', getAllReligions);
router.get('/:id', getReligionById);
router.put('/:id', updateReligion);
router.delete('/:id', deleteReligion);

module.exports = router;
