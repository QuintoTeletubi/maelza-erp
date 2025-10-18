const express = require('express');
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
} = require('../controllers/supplier.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers with pagination, search and filters
 * @access  Private (requires suppliers.read permission)
 * @query   page, limit, search, isActive, sortBy, sortOrder
 */
router.get('/', authenticateToken, requirePermission('suppliers.read'), getSuppliers);

/**
 * @route   GET /api/suppliers/stats
 * @desc    Get supplier statistics
 * @access  Private (requires suppliers.read permission)
 */
router.get('/stats', authenticateToken, requirePermission('suppliers.read'), getSupplierStats);

/**
 * @route   GET /api/suppliers/:id
 * @desc    Get supplier by ID with purchase orders
 * @access  Private (requires suppliers.read permission)
 */
router.get('/:id', authenticateToken, requirePermission('suppliers.read'), getSupplier);

/**
 * @route   POST /api/suppliers
 * @desc    Create new supplier
 * @access  Private (requires suppliers.create permission)
 */
router.post('/', authenticateToken, requirePermission('suppliers.create'), createSupplier);

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Update supplier
 * @access  Private (requires suppliers.update permission)
 */
router.put('/:id', authenticateToken, requirePermission('suppliers.update'), updateSupplier);

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Delete supplier (soft delete if has related data)
 * @access  Private (requires suppliers.delete permission)
 */
router.delete('/:id', authenticateToken, requirePermission('suppliers.delete'), deleteSupplier);

module.exports = router;