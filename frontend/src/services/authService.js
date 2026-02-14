import { apiCall } from './api';

export const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await apiCall('auth.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          username,
          password
        })
      });

      if (response.success) {
        // Store token and user data
        localStorage.setItem('auth_token', response.token || 'demo-token-' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(response.user));
        return {
          success: true,
          user: response.user,
          token: response.token
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Using demo data.'
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    return { success: true };
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiCall('auth.php?action=update_profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      if (response.success) {
        // Update stored user data
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.user };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        return {
          success: true,
          user: updatedUser
        };
      }

      return {
        success: false,
        message: response.message
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Update failed'
      };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiCall('auth.php?action=change_password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      return response;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Change password failed'
      };
    }
  },

  // Reset password (admin only)
  resetPassword: async (userId, newPassword) => {
    try {
      const response = await apiCall('auth.php?action=reset_password', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword
        })
      });

      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Reset password failed'
      };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiCall('auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.success) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        return {
          success: true,
          user: response.user,
          token: response.token
        };
      }

      return {
        success: false,
        message: response.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }
};

export default authService;
