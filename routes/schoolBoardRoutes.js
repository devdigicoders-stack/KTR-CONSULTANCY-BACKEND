const express = require('express');
const router = express.Router();
const {
  createSchoolBoard,
  getAllSchoolBoards,
  getSchoolBoardById,
  updateSchoolBoard,
  deleteSchoolBoard
} = require('../controllers/schoolBoardController');

router.post('/', createSchoolBoard);
router.get('/', getAllSchoolBoards);
router.get('/:id', getSchoolBoardById);
router.put('/:id', updateSchoolBoard);
router.delete('/:id', deleteSchoolBoard);

module.exports = router;
