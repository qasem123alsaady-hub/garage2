import { apiCall } from './api';

export const serviceService = {
  // Get all services
  getAll: async () => {
    try {
      const response = await apiCall('services.php');
      return response.services || response.data || response;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  },

  // Get service by ID
  getById: async (id) => {
    try {
      const response = await apiCall(`services.php?id=${id}`);
      return response.service || response.data || response;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  },

  // Create new service
  create: async (serviceData) => {
    try {
      const response = await apiCall('services.php', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      });

      return response;
    } catch (error) {
      console.error('Error creating service:', error);
      return {
        success: false,
        message: 'Failed to create service'
      };
    }
  },

  // Update service
  update: async (id, serviceData) => {
    try {
      const response = await apiCall(`services.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(serviceData)
      });

      return response;
    } catch (error) {
      console.error('Error updating service:', error);
      return {
        success: false,
        message: 'Failed to update service'
      };
    }
  },

  // Delete service
  delete: async (id) => {
    try {
      const response = await apiCall(`services.php?id=${id}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        message: 'Failed to delete service'
      };
    }
  },

  // Search services
  search: async (searchTerm) => {
    try {
      const response = await apiCall(`services.php?search=${encodeURIComponent(searchTerm)}`);
      return response.services || response.data || response;
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  },

  // Get service payments
  getPayments: async (serviceId) => {
    try {
      const response = await apiCall(`services.php?id=${serviceId}&payments=true`);
      return response.payments || response.data || [];
    } catch (error) {
      console.error('Error fetching service payments:', error);
      return [];
    }
  },

  // Get service vehicle
  getVehicle: async (serviceId) => {
    try {
      const response = await apiCall(`services.php?id=${serviceId}&vehicle=true`);
      return response.vehicle || response.data || null;
    } catch (error) {
      console.error('Error fetching service vehicle:', error);
      return null;
    }
  },

  // Get service customer
  getCustomer: async (serviceId) => {
    try {
      const response = await apiCall(`services.php?id=${serviceId}&customer=true`);
      return response.customer || response.data || null;
    } catch (error) {
      console.error('Error fetching service customer:', error);
      return null;
    }
  },

  // Update service status
  updateStatus: async (id, status) => {
    try {
      const response = await apiCall(`services.php?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return response;
    } catch (error) {
      console.error('Error updating service status:', error);
      return {
        success: false,
        message: 'Failed to update service status'
      };
    }
  },

  // Update payment status
  updatePaymentStatus: async (id, paymentStatus) => {
    try {
      const response = await apiCall(`services.php?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: paymentStatus })
      });

      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return {
        success: false,
        message: 'Failed to update payment status'
      };
    }
  },

  // Get service statistics
  getStats: async (serviceId) => {
    try {
      const response = await apiCall(`services.php?id=${serviceId}&stats=true`);
      return response.stats || response.data || {};
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return {};
    }
  }
};

export default serviceService;
