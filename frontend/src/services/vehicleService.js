import { apiCall } from './api';

export const vehicleService = {
  // Get all vehicles
  getAll: async () => {
    try {
      const response = await apiCall('vehicles.php');
      return response.vehicles || response.data || response;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  },

  // Get vehicle by ID
  getById: async (id) => {
    try {
      const response = await apiCall(`vehicles.php?id=${id}`);
      return response.vehicle || response.data || response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  },

  // Create new vehicle
  create: async (vehicleData) => {
    try {
      const response = await apiCall('vehicles.php', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      });

      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return {
        success: false,
        message: 'Failed to create vehicle'
      };
    }
  },

  // Update vehicle
  update: async (id, vehicleData) => {
    try {
      const response = await apiCall(`vehicles.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicleData)
      });

      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return {
        success: false,
        message: 'Failed to update vehicle'
      };
    }
  },

  // Delete vehicle
  delete: async (id) => {
    try {
      const response = await apiCall(`vehicles.php?id=${id}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return {
        success: false,
        message: 'Failed to delete vehicle'
      };
    }
  },

  // Search vehicles
  search: async (searchTerm) => {
    try {
      const response = await apiCall(`vehicles.php?search=${encodeURIComponent(searchTerm)}`);
      return response.vehicles || response.data || response;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      return [];
    }
  },

  // Get vehicle services
  getServices: async (vehicleId) => {
    try {
      const response = await apiCall(`vehicles.php?id=${vehicleId}&services=true`);
      return response.services || response.data || [];
    } catch (error) {
      console.error('Error fetching vehicle services:', error);
      return [];
    }
  },

  // Get vehicle payments
  getPayments: async (vehicleId) => {
    try {
      const response = await apiCall(`vehicles.php?id=${vehicleId}&payments=true`);
      return response.payments || response.data || [];
    } catch (error) {
      console.error('Error fetching vehicle payments:', error);
      return [];
    }
  },

  // Get vehicle customer
  getCustomer: async (vehicleId) => {
    try {
      const response = await apiCall(`vehicles.php?id=${vehicleId}&customer=true`);
      return response.customer || response.data || null;
    } catch (error) {
      console.error('Error fetching vehicle customer:', error);
      return null;
    }
  },

  // Update vehicle status
  updateStatus: async (id, status) => {
    try {
      const response = await apiCall(`vehicles.php?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return response;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      return {
        success: false,
        message: 'Failed to update vehicle status'
      };
    }
  },

  // Get vehicle statistics
  getStats: async (vehicleId) => {
    try {
      const response = await apiCall(`vehicles.php?id=${vehicleId}&stats=true`);
      return response.stats || response.data || {};
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      return {};
    }
  }
};

export default vehicleService;
