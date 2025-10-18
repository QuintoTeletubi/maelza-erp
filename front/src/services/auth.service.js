import config from '../config/index.js';
const API_BASE_URL = config.API_BASE_URL;

/**
 * Auth Service - Maneja la autenticación con el backend
 */
class AuthService {
  
  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Guardar tokens en localStorage
      if (data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verificar si el token no ha expirado
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user profile from API
   */
  async getProfile() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get profile');
      }

      // Actualizar user en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Guardar nuevo token
      localStorage.setItem('accessToken', data.tokens.accessToken);

      return data.tokens.accessToken;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Si falla el refresh, hacer logout
      this.logout();
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    try {
      let token = this.getToken();
      
      if (!token) {
        throw new Error('No access token found');
      }

      // Determinar si la URL es completa o relativa
      const fetchUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

      const response = await fetch(fetchUrl, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      // Si el token expiró, intentar refresh
      if (response.status === 401) {
        try {
          token = await this.refreshToken();
          
          // Retry con nuevo token
          const retryResponse = await fetch(fetchUrl, {
            ...options,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              ...options.headers,
            }
          });

          return retryResponse;
        } catch (refreshError) {
          // Si falla el refresh, redirigir al login
          this.logout();
          window.location.href = '/login';
          throw refreshError;
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuthService();