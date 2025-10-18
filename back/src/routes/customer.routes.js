const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} = require('../controllers/customer.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/customers
 * @desc    Get all customers with pagination and search
 * @access  Private (requires customers.read permission)
 * @query   page, limit, search, isActive
 */
router.get('/', authenticateToken, requirePermission('customers.read'), getCustomers);

/**
 * @route   GET /api/customers/stats
 * @desc    Get customer statistics
 * @access  Private (requires customers.read permission)
 */
router.get('/stats', authenticateToken, requirePermission('customers.read'), getCustomerStats);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID with related data
 * @access  Private (requires customers.read permission)
 */
router.get('/:id', authenticateToken, requirePermission('customers.read'), getCustomer);

/**
 * @route   POST /api/customers
 * @desc    Create new customer
 * @access  Private (requires customers.create permission)
 */
router.post('/', authenticateToken, requirePermission('customers.create'), createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private (requires customers.update permission)
 */
router.put('/:id', authenticateToken, requirePermission('customers.update'), updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer (soft delete if has related data)
 * @access  Private (requires customers.delete permission)
 */
router.delete('/:id', authenticateToken, requirePermission('customers.delete'), deleteCustomer);

module.exports = router;