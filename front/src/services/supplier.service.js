import authService from './auth.service';

class SupplierService {
  /**
   * Get all suppliers with pagination and filters
   */
  async getSuppliers(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || '',
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        sortBy: params.sortBy || 'name',
        sortOrder: params.sortOrder || 'asc'
      });

      const response = await authService.authenticatedFetch(`/suppliers?${queryParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch suppliers');
      }

      return await response.json();
    } catch (error) {
      console.error('Get suppliers error:', error);
      throw error;
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(id) {
    try {
      const response = await authService.authenticatedFetch(`/suppliers/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch supplier');
      }

      const data = await response.json();
      return data.supplier;
    } catch (error) {
      console.error('Get supplier error:', error);
      throw error;
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(supplierData) {
    try {
      const response = await authService.authenticatedFetch('/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create supplier');
      }

      const data = await response.json();
      return data.supplier;
    } catch (error) {
      console.error('Create supplier error:', error);
      throw error;
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id, supplierData) {
    try {
      const response = await authService.authenticatedFetch(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(supplierData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update supplier');
      }

      const data = await response.json();
      return data.supplier;
    } catch (error) {
      console.error('Update supplier error:', error);
      throw error;
    }
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id) {
    try {
      const response = await authService.authenticatedFetch(`/suppliers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete supplier');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete supplier error:', error);
      throw error;
    }
  }

  /**
   * Get supplier statistics
   */
  async getStats() {
    try {
      const response = await authService.authenticatedFetch('/suppliers/stats');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch supplier stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get supplier stats error:', error);
      throw error;
    }
  }

  /**
   * Validate supplier data
   */
  validateSupplier(data) {
    const errors = {};

    // Required fields
    if (!data.name?.trim()) {
      errors.name = 'El nombre del proveedor es requerido';
    }

    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.email = 'Formato de email inválido';
    }

    // Phone validation
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.phone = 'Formato de teléfono inválido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  isValidPhone(phone) {
    // Allow various phone formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format supplier data for display
   */
  formatSupplier(supplier) {
    return {
      ...supplier,
      displayName: supplier.name,
      fullContact: supplier.contactPerson ? 
        `${supplier.contactPerson} (${supplier.contactPhone || supplier.phone || 'Sin teléfono'})` : 
        (supplier.phone || 'Sin contacto'),
      fullAddress: [supplier.address, supplier.city, supplier.country]
        .filter(Boolean)
        .join(', ') || 'Sin dirección'
    };
  }

  /**
   * Search suppliers by term
   */
  async searchSuppliers(searchTerm, limit = 10) {
    try {
      const response = await this.getSuppliers({
        search: searchTerm,
        limit,
        page: 1
      });
      
      return response.suppliers.map(supplier => this.formatSupplier(supplier));
    } catch (error) {
      console.error('Search suppliers error:', error);
      throw error;
    }
  }

  /**
   * Get active suppliers for dropdowns
   */
  async getActiveSuppliers() {
    try {
      const response = await this.getSuppliers({
        isActive: true,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      return response.suppliers;
    } catch (error) {
      console.error('Get active suppliers error:', error);
      throw error;
    }
  }
}

export default new SupplierService();