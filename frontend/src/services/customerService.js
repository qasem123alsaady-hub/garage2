import { apiCall } from './api';

export const customerService = {
  // Get all customers
  getAll: async () => {
    try {
      const response = await apiCall('customers.php');
      return response.customers || response.data || response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  // Get customer by ID
  getById: async (id) => {
    try {
      const response = await apiCall(`customers.php?id=${id}`);
      return response.customer || response.data || response;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  },

  // Create new customer
  create: async (customerData) => {
    try {
      const response = await apiCall('customers.php', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });

      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: 'Failed to create customer'
      };
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      const response = await apiCall(`customers.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });

      return response;
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        message: 'Failed to update customer'
      };
    }
  },

  // Delete customer
  delete: async (id) => {
    try {
      const response = await apiCall(`customers.php?id=${id}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        message: 'Failed to delete customer'
      };
    }
  },

  // Search customers
  search: async (searchTerm) => {
    try {
      const response = await apiCall(`customers.php?search=${encodeURIComponent(searchTerm)}`);
      return response.customers || response.data || response;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  },

  // Get customer vehicles
  getVehicles: async (customerId) => {
    try {
      const response = await apiCall(`customers.php?id=${customerId}&vehicles=true`);
      return response.vehicles || response.data || [];
    } catch (error) {
      console.error('Error fetching customer vehicles:', error);
      return [];
    }
  },

  // Get customer services
  getServices: async (customerId) => {
    try {
      const response = await apiCall(`customers.php?id=${customerId}&services=true`);
      return response.services || response.data || [];
    } catch (error) {
      console.error('Error fetching customer services:', error);
      return [];
    }
  },

  // Get customer payments
  getPayments: async (customerId) => {
    try {
      const response = await apiCall(`customers.php?id=${customerId}&payments=true`);
      return response.payments || response.data || [];
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      return [];
    }
  },

  // Get customer statistics
  getStats: async (customerId) => {
    try {
      const response = await apiCall(`customers.php?id=${customerId}&stats=true`);
      return response.stats || response.data || {};
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {};
    }
  }
};

export default customerService;
