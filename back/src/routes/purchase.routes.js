const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseStats
} = require('../controllers/purchase.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/purchases/stats - Get purchase statistics
router.get('/stats', getPurchaseStats);

// GET /api/purchases - Get all purchases with pagination and filters
router.get('/', getPurchases);

// GET /api/purchases/:id - Get single purchase
router.get('/:id', getPurchase);

// POST /api/purchases - Create new purchase
router.post('/', createPurchase);

// PUT /api/purchases/:id - Update purchase
router.put('/:id', updatePurchase);

// DELETE /api/purchases/:id - Delete purchase
router.delete('/:id', deletePurchase);

module.exports = router;