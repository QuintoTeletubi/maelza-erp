import authService from './auth.service';

import config from '../config/index.js';
const API_BASE_URL = config.API_BASE_URL;

/**
 * Customer Service - Maneja las operaciones de clientes
 */
class CustomerService {

  /**
   * Get all customers with pagination and search
   */
  async getCustomers(params = {}) {
    try {
      const { page = 1, limit = 10, search = '', isActive } = params;
      
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (isActive !== undefined) queryParams.append('isActive', isActive);

      const response = await authService.authenticatedFetch(
        `/customers?${queryParams.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch customers');
      }

      return await response.json();
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id) {
    try {
      const response = await authService.authenticatedFetch(`/customers/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch customer');
      }

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(customerData) {
    try {
      const response = await authService.authenticatedFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create customer');
      }

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id, customerData) {
    try {
      const response = await authService.authenticatedFetch(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update customer');
      }

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Update customer error:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id) {
    try {
      const response = await authService.authenticatedFetch(`/customers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete customer');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete customer error:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      const response = await authService.authenticatedFetch('/customers/stats');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch customer statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Get customer stats error:', error);
      throw error;
    }
  }

  /**
   * Validate customer data before sending to API
   */
  validateCustomer(customerData) {
    const errors = {};

    if (!customerData.name || customerData.name.trim().length === 0) {
      errors.name = 'El nombre es obligatorio';
    }

    if (customerData.email && customerData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email.trim())) {
        errors.email = 'El formato del email no es válido';
      }
    }

    if (customerData.creditLimit && isNaN(parseFloat(customerData.creditLimit))) {
      errors.creditLimit = 'El límite de crédito debe ser un número válido';
    }

    if (customerData.phone && customerData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(customerData.phone.trim())) {
        errors.phone = 'El formato del teléfono no es válido';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Format customer data for display
   */
  formatCustomer(customer) {
    return {
      ...customer,
      creditLimit: parseFloat(customer.creditLimit || 0).toFixed(2),
      currentDebt: parseFloat(customer.currentDebt || 0).toFixed(2),
      formattedCreatedAt: new Date(customer.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  }

  /**
   * Search customers (client-side filtering for small datasets)
   */
  filterCustomers(customers, searchTerm) {
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.taxId && customer.taxId.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.includes(term))
    );
  }
}

// Export singleton instance
export default new CustomerService();