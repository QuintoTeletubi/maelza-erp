const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getCategories
} = require('../controllers/product.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination, search and filters
 * @access  Private (requires products.read permission)
 * @query   page, limit, search, categoryId, isActive, lowStock
 */
router.get('/', authenticateToken, requirePermission('products.read'), getProducts);

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Private (requires products.read permission)
 */
router.get('/stats', authenticateToken, requirePermission('products.read'), getProductStats);

/**
 * @route   GET /api/products/categories
 * @desc    Get all categories
 * @access  Private (requires products.read permission)
 */
router.get('/categories', authenticateToken, requirePermission('products.read'), getCategories);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID with stock info
 * @access  Private (requires products.read permission)
 */
router.get('/:id', authenticateToken, requirePermission('products.read'), getProduct);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (requires products.create permission)
 */
router.post('/', authenticateToken, requirePermission('products.create'), createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (requires products.update permission)
 */
router.put('/:id', authenticateToken, requirePermission('products.update'), updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete if has related data)
 * @access  Private (requires products.delete permission)
 */
router.delete('/:id', authenticateToken, requirePermission('products.delete'), deleteProduct);

module.exports = router;