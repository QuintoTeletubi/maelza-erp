import authService from './auth.service';

import config from '../config/index.js';
const API_BASE_URL = config.API_BASE_URL;

const saleService = {
  // Get all sales with filters
  async getSales(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/sales${queryString ? `?${queryString}` : ''}`;
      
      const response = await authService.authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  // Get sales statistics
  async getSalesStats(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/sales/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await authService.authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  },

  // Get sale by ID
  async getSaleById(id) {
    try {
      if (!id) {
        throw new Error('Sale ID is required');
      }

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/sales/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sale not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  },

  // Create new sale
  async createSale(saleData) {
    try {
      if (!saleData) {
        throw new Error('Sale data is required');
      }

      // Validate required fields
      if (!saleData.customerId) {
        throw new Error('Customer is required');
      }

      if (!saleData.items || saleData.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Validate items
      for (const item of saleData.items) {
        if (!item.productId) {
          throw new Error('Product is required for all items');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Valid quantity is required for all items');
        }
      }

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // Update sale
  async updateSale(id, saleData) {
    try {
      if (!id) {
        throw new Error('Sale ID is required');
      }

      if (!saleData) {
        throw new Error('Sale data is required');
      }

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  // Delete sale
  async deleteSale(id) {
    try {
      if (!id) {
        throw new Error('Sale ID is required');
      }

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  },

  // Validation functions
  validateSale(saleData) {
    const errors = {};

    if (!saleData.customerId || saleData.customerId.trim() === '') {
      errors.customerId = 'Customer is required';
    }

    if (!saleData.items || saleData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      // Validate each item
      saleData.items.forEach((item, index) => {
        if (!item.productId || item.productId.trim() === '') {
          errors[`item_${index}_product`] = 'Product is required';
        }
        
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          errors[`item_${index}_quantity`] = 'Valid quantity is required';
        }
        
        if (item.unitPrice !== undefined && parseFloat(item.unitPrice) < 0) {
          errors[`item_${index}_price`] = 'Unit price cannot be negative';
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Utility functions
  formatSaleNumber(number) {
    return number || 'N/A';
  },

  formatSaleDate(date) {
    try {
      return new Date(date).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  },

  formatSaleDateTime(date) {
    try {
      return new Date(date).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  },

  formatCurrency(amount) {
    try {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
      }).format(amount || 0);
    } catch {
      return `S/ ${(amount || 0).toFixed(2)}`;
    }
  },

  getStatusColor(status) {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  getStatusText(status) {
    const statusTexts = {
      pending: 'Pendiente',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    
    return statusTexts[status] || status;
  },

  calculateItemTotal(quantity, unitPrice) {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  },

  calculateSubtotal(items) {
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  },

  calculateTax(subtotal, taxRate = 0.18) {
    return subtotal * taxRate;
  },

  calculateTotal(subtotal, tax) {
    return subtotal + tax;
  }
};

export default saleService;