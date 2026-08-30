const express = require('express');
const router = express.Router();
const {
  createWing,
  getAllWings,
  getWingById,
  updateWing,
  deleteWing
} = require('../controllers/wingController');

router.post('/', createWing);
router.get('/', getAllWings);
router.get('/:id', getWingById);
router.put('/:id', updateWing);
router.delete('/:id', deleteWing);

module.exports = router;
