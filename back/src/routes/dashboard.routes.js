const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMonthlySales
} = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/monthly-sales - Get monthly sales data
router.get('/monthly-sales', getMonthlySales);

module.exports = router;