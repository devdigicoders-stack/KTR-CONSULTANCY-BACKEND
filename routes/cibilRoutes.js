const express = require('express');
const router = express.Router();
const cibilController = require('../controllers/cibilController');

// Route to check CIBIL score
router.post('/check', cibilController.checkCibilScore);

module.exports = router;
