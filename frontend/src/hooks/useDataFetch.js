import { useState, useEffect, useCallback } from 'react';
import {
  fetchCustomers,
  fetchVehicles,
  fetchServices,
  fetchPayments,
  fetchTechnicians,
  fetchUsers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  addService,
  updateService,
  deleteService,
  addUser,
  updateUser,
  deleteUser
} from '../services/api';

export const useDataFetch = () => {
  const [data, setData] = useState({
    customers: [],
    vehicles: [],
    services: [],
    payments: [],
    technicians: [],
    users: [],
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [customers, vehicles, services, payments, technicians, users] = await Promise.all([
        fetchCustomers(),
        fetchVehicles(),
        fetchServices(),
        fetchPayments(),
        fetchTechnicians(),
        fetchUsers()
      ]);

      setData({
        customers: customers || [],
        vehicles: vehicles || [],
        services: services || [],
        payments: payments || [],
        technicians: technicians || [],
        users: users || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addItem = useCallback(async (type, itemData) => {
    try {
      let response;
      switch(type) {
        case 'customers': response = await addCustomer(itemData); break;
        case 'vehicles': response = await addVehicle(itemData); break;
        case 'services': response = await addService(itemData); break;
        case 'users': response = await addUser(itemData); break;
        default: throw new Error('Unknown type');
      }
      
      if (response.success) {
        await loadData(); // إعادة تحميل البيانات لضمان المزامنة
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      return false;
    }
  }, [loadData]);

  const updateItem = useCallback(async (type, id, itemData) => {
    try {
      let response;
      switch(type) {
        case 'customers': response = await updateCustomer(id, itemData); break;
        case 'vehicles': response = await updateVehicle(id, itemData); break;
        case 'services': response = await updateService(id, itemData); break;
        case 'users': response = await updateUser(id, itemData); break;
        default: throw new Error('Unknown type');
      }
      
      if (response.success) {
        await loadData();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      return false;
    }
  }, [loadData]);

  const deleteItem = useCallback(async (type, id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      let response;
      switch(type) {
        case 'customers': response = await deleteCustomer(id); break;
        case 'vehicles': response = await deleteVehicle(id); break;
        case 'services': response = await deleteService(id); break;
        case 'users': response = await deleteUser(id); break;
        default: throw new Error('Unknown type');
      }
      
      if (response.success) {
        await loadData();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      return false;
    }
  }, [loadData]);

  return {
    data,
    loading: data.loading,
    error: data.error,
    loadData,
    addItem,
    updateItem,
    deleteItem,
    customers: data.customers,
    vehicles: data.vehicles,
    services: data.services,
    payments: data.payments,
    technicians: data.technicians,
    users: data.users
  };
};
