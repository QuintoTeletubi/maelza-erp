const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleStats,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
} = require('../controllers/sale.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/sales - Get all sales with pagination and filters
router.get('/', getSales);

// GET /api/sales/stats - Get sales statistics
router.get('/stats', getSaleStats);

// GET /api/sales/:id - Get sale by ID
router.get('/:id', getSaleById);

// POST /api/sales - Create new sale
router.post('/', createSale);

// PUT /api/sales/:id - Update sale
router.put('/:id', updateSale);

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', deleteSale);

module.exports = router;