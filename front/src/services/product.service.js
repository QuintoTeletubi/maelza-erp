import authService from './auth.service';

import config from '../config/index.js';
const API_BASE_URL = config.API_BASE_URL;

/**
 * Product Service - Maneja las operaciones de productos
 */
class ProductService {

  /**
   * Get all products with pagination and search
   */
  async getProducts(params = {}) {
    try {
      const { page = 1, limit = 10, search = '', categoryId, isActive } = params;
      
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (categoryId) queryParams.append('categoryId', categoryId);
      if (isActive !== undefined) queryParams.append('isActive', isActive);

      const response = await authService.authenticatedFetch(
        `/products?${queryParams.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch products');
      }

      return await response.json();
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(id) {
    try {
      const response = await authService.authenticatedFetch(`/products/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product');
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Get product error:', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData) {
    try {
      const response = await authService.authenticatedFetch('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, productData) {
    try {
      const response = await authService.authenticatedFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    try {
      const response = await authService.authenticatedFetch(`/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getStats() {
    try {
      const response = await authService.authenticatedFetch('/products/stats');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get product stats error:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await authService.authenticatedFetch('/products/categories');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch categories');
      }

      const data = await response.json();
      return data.categories;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    try {
      const response = await authService.authenticatedFetch('/products/stats');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Get product stats error:', error);
      throw error;
    }
  }

  /**
   * Validate product data before sending to API
   */
  validateProduct(productData) {
    const errors = {};

    if (!productData.code || productData.code.trim().length === 0) {
      errors.code = 'El código es obligatorio';
    }

    if (!productData.name || productData.name.trim().length === 0) {
      errors.name = 'El nombre es obligatorio';
    }

    if (!productData.categoryId) {
      errors.categoryId = 'La categoría es obligatoria';
    }

    if (productData.costPrice && isNaN(parseFloat(productData.costPrice))) {
      errors.costPrice = 'El precio de costo debe ser un número válido';
    }

    if (productData.salePrice && isNaN(parseFloat(productData.salePrice))) {
      errors.salePrice = 'El precio de venta debe ser un número válido';
    }

    if (productData.minStock && isNaN(parseInt(productData.minStock))) {
      errors.minStock = 'El stock mínimo debe ser un número entero válido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Format product data for display
   */
  formatProduct(product) {
    return {
      ...product,
      costPrice: parseFloat(product.costPrice || 0).toFixed(2),
      salePrice: parseFloat(product.salePrice || 0).toFixed(2),
      formattedCreatedAt: new Date(product.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      unitDisplay: this.getUnitDisplay(product.unit)
    };
  }

  /**
   * Get display name for unit types
   */
  getUnitDisplay(unit) {
    const units = {
      'UNIT': 'Unidad',
      'KG': 'Kilogramo',
      'LB': 'Libra',
      'L': 'Litro',
      'ML': 'Mililitro',
      'M': 'Metro',
      'CM': 'Centímetro',
      'PCS': 'Piezas',
      'BOX': 'Caja',
      'PACK': 'Paquete'
    };
    return units[unit] || unit;
  }

  /**
   * Format price for display
   */
  static formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price || 0);
  }

  /**
   * Get available unit options
   */
  getUnitOptions() {
    return [
      { value: 'UNIT', label: 'Unidad' },
      { value: 'KG', label: 'Kilogramo' },
      { value: 'LB', label: 'Libra' },
      { value: 'L', label: 'Litro' },
      { value: 'ML', label: 'Mililitro' },
      { value: 'M', label: 'Metro' },
      { value: 'CM', label: 'Centímetro' },
      { value: 'PCS', label: 'Piezas' },
      { value: 'BOX', label: 'Caja' },
      { value: 'PACK', label: 'Paquete' }
    ];
  }

  /**
   * Search products (client-side filtering for small datasets)
   */
  filterProducts(products, searchTerm) {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      (product.description && product.description.toLowerCase().includes(term)) ||
      (product.category && product.category.name.toLowerCase().includes(term))
    );
  }
}

// Export singleton instance
export default new ProductService();