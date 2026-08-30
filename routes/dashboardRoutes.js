const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/admin', dashboardController.getAdminDashboardData);

module.exports = router;
