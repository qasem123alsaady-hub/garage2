import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { currentUser, hasPermission } = useAuth();

  const canViewAll = hasPermission('canViewAll');
  const canManageCustomers = hasPermission('canManageCustomers');
  const canManageVehicles = hasPermission('canManageVehicles');
  const canManageServices = hasPermission('canManageServices');
  const canManagePayments = hasPermission('canManagePayments');
  const canViewReports = hasPermission('canViewReports');
  const canManageUsers = hasPermission('canManageUsers');
  const canDelete = hasPermission('canDelete');
  const canEditPayments = hasPermission('canEditPayments');
  const canViewAllVehicles = hasPermission('canViewAllVehicles');
  const canViewAllCustomers = hasPermission('canViewAllCustomers');
  const canGenerateReports = hasPermission('canGenerateReports');
  const canViewRevenueReport = hasPermission('canViewRevenueReport');

  const getAccessibleData = (dataType, allData) => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return allData;
    }
    
    if (currentUser.role === 'technician') {
      return allData;
    }
    
    if (currentUser.role === 'customer' && currentUser.customer_id) {
      if (dataType === 'customers') {
        return allData.filter(item => item.id === currentUser.customer_id);
      }
      
      if (dataType === 'vehicles') {
        return allData.filter(item => item.customer_id === currentUser.customer_id);
      }
      
      if (dataType === 'services') {
        const customerVehicles = allData.filter(v => v.customer_id === currentUser.customer_id);
        const vehicleIds = customerVehicles.map(v => v.id);
        return allData.filter(item => vehicleIds.includes(item.vehicle_id));
      }
      
      if (dataType === 'payments') {
        // Implementation based on accessible services
        return allData;
      }
    }
    
    return [];
  };

  return {
    currentUser,
    canViewAll,
    canManageCustomers,
    canManageVehicles,
    canManageServices,
    canManagePayments,
    canViewReports,
    canManageUsers,
    canDelete,
    canEditPayments,
    canViewAllVehicles,
    canViewAllCustomers,
    canGenerateReports,
    canViewRevenueReport,
    getAccessibleData,
    isAdmin: currentUser?.role === 'admin',
    isTechnician: currentUser?.role === 'technician',
    isCustomer: currentUser?.role === 'customer',
    isUser: currentUser?.role === 'user'
  };
};
