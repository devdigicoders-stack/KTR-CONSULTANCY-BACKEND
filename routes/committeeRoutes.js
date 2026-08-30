const express = require('express');
const router = express.Router();
const {
  createCommittee,
  getAllCommittees,
  getCommitteeById,
  updateCommittee,
  deleteCommittee
} = require('../controllers/committeeController');

router.post('/', createCommittee);
router.get('/', getAllCommittees);
router.get('/:id', getCommitteeById);
router.put('/:id', updateCommittee);
router.delete('/:id', deleteCommittee);

module.exports = router;
