/**
 * MAELZA ERP - Purchase Service
 * Servicio para gestión de compras
 * Maneja comunicación con API backend
 */

import authService from './auth.service';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all purchases with pagination and filters
 */
export const getPurchases = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add search parameters
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.supplierId) queryParams.append('supplierId', params.supplierId);
    
    // Add date filters
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/purchases${queryString ? `?${queryString}` : ''}`;

    const response = await authService.authenticatedFetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

/**
 * Get purchase by ID
 */
export const getPurchase = async (id) => {
  try {
    const response = await authService.authenticatedFetch(`/purchases/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching purchase:', error);
    throw error;
  }
};

/**
 * Create new purchase
 */
export const createPurchase = async (purchaseData) => {
  try {
    // Validar datos antes de enviar
    if (!purchaseData.supplierId) {
      throw new Error('Debe seleccionar un proveedor');
    }
    
    if (!purchaseData.items || purchaseData.items.length === 0) {
      throw new Error('Debe agregar al menos un artículo');
    }
    
    if (purchaseData.total <= 0) {
      throw new Error('El total debe ser mayor a 0');
    }

    const response = await authService.authenticatedFetch('/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
      throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

/**
 * Update purchase
 */
export const updatePurchase = async (id, purchaseData) => {
  try {
    const response = await authService.authenticatedFetch(`/purchases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });

    return await response.json();
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
};

/**
 * Delete purchase
 */
export const deletePurchase = async (id) => {
  try {
    const response = await authService.authenticatedFetch(`/purchases/${id}`, {
      method: 'DELETE',
    });

    return await response.json();
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
};

/**
 * Get purchase statistics
 */
export const getPurchaseStats = async () => {
  try {
    const response = await authService.authenticatedFetch('/purchases/stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    throw error;
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate purchase data
 */
export const validatePurchase = (purchaseData) => {
  const errors = {};

  // Required fields validation
  if (!purchaseData.supplierId) {
    errors.supplierId = 'Proveedor es requerido';
  }

  if (!purchaseData.date) {
    errors.date = 'Fecha es requerida';
  }

  if (!purchaseData.items || purchaseData.items.length === 0) {
    errors.items = 'Debe agregar al menos un artículo';
  }

  // Validate items
  if (purchaseData.items) {
    purchaseData.items.forEach((item, index) => {
      if (!item.productId) {
        errors[`items.${index}.productId`] = 'Producto es requerido';
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`items.${index}.quantity`] = 'Cantidad debe ser mayor a 0';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`items.${index}.unitPrice`] = 'Precio unitario debe ser mayor a 0';
      }
    });
  }

  // Validate totals
  if (!purchaseData.subtotal || purchaseData.subtotal < 0) {
    errors.subtotal = 'Subtotal debe ser mayor o igual a 0';
  }

  if (!purchaseData.total || purchaseData.total < 0) {
    errors.total = 'Total debe ser mayor o igual a 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate purchase totals
 */
export const calculatePurchaseTotals = (items, taxRate = 0.18) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

/**
 * Format purchase number
 */
export const formatPurchaseNumber = (number) => {
  if (!number) return '';
  return `COMP-${String(number).padStart(6, '0')}`;
};

/**
 * Format purchase status
 */
export const formatPurchaseStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pendiente',
    'RECEIVED': 'Recibida',
    'CANCELLED': 'Cancelada',
    'PARTIAL': 'Parcial'
  };
  return statusMap[status] || status;
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'RECEIVED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'PARTIAL': 'bg-blue-100 text-blue-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const purchaseService = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseStats,
  validatePurchase,
  calculatePurchaseTotals,
  formatPurchaseNumber,
  formatPurchaseStatus,
  getStatusColor,
  formatCurrency,
  formatDate,
  formatDateForInput
};

export default purchaseService;