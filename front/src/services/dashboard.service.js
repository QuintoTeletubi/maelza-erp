import authService from './auth.service';

import config from '../config/index.js';
const API_BASE_URL = config.API_BASE_URL;

const dashboardService = {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/dashboard/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent sales
  async getRecentSales(limit = 5) {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/sales?page=1&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      throw error;
    }
  },

  // Get recent purchases
  async getRecentPurchases(limit = 5) {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/purchases?page=1&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
      throw error;
    }
  },

  // Get low stock products
  async getLowStockProducts() {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/products?lowStock=true&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  // Get monthly sales chart data
  async getMonthlySales() {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/dashboard/monthly-sales`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
      throw error;
    }
  },

  // Get top customers
  async getTopCustomers(limit = 5) {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/customers/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.topCustomers?.slice(0, limit) || [];
    } catch (error) {
      console.error('Error fetching top customers:', error);
      throw error;
    }
  },

  // Utility functions
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

  formatNumber(number) {
    try {
      return new Intl.NumberFormat('es-PE').format(number || 0);
    } catch {
      return (number || 0).toString();
    }
  },

  formatDate(date) {
    try {
      return new Date(date).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  },

  formatDateTime(date) {
    try {
      return new Date(date).toLocaleString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  },

  getTimeAgo(date) {
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInMinutes = Math.floor((now - past) / (1000 * 60));

      if (diffInMinutes < 1) return 'Hace un momento';
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
      
      return this.formatDate(date);
    } catch {
      return 'Fecha inválida';
    }
  }
};

export default dashboardService;