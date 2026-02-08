export const userPermissions = {
  admin: {
    // View permissions
    canViewAll: true,
    canViewAllVehicles: true,
    canViewAllCustomers: true,
    canViewAllServices: true,
    canViewAllPayments: true,
    canViewReports: true,
    canViewRevenueReport: true,
    
    // Manage permissions
    canManageCustomers: true,
    canManageVehicles: true,
    canManageServices: true,
    canManagePayments: true,
    canManageUsers: true,
    canManageTechnicians: true,
    canManageSettings: true,
    
    // Action permissions
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canEditPayments: true,
    
    // Report permissions
    canGenerateReports: true,
    canExportData: true
  },
  
  technician: {
    // View permissions
    canViewAll: true,
    canViewAllVehicles: true,
    canViewAllCustomers: true,
    canViewAllServices: true,
    canViewAllPayments: true,
    canViewReports: true,
    canViewRevenueReport: false,
    
    // Manage permissions
    canManageCustomers: true,
    canManageVehicles: true,
    canManageServices: true,
    canManagePayments: true,
    canManageUsers: false,
    canManageTechnicians: false,
    canManageSettings: false,
    
    // Action permissions
    canAdd: true,
    canEdit: true,
    canDelete: false,
    canEditPayments: false,
    
    // Report permissions
    canGenerateReports: true,
    canExportData: false
  },
  
  user: {
    // View permissions
    canViewAll: true,
    canViewAllVehicles: true,
    canViewAllCustomers: true,
    canViewAllServices: true,
    canViewAllPayments: true,
    canViewReports: true,
    canViewRevenueReport: false,
    
    // Manage permissions
    canManageCustomers: false,
    canManageVehicles: false,
    canManageServices: false,
    canManagePayments: false,
    canManageUsers: false,
    canManageTechnicians: false,
    canManageSettings: false,
    
    // Action permissions
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canEditPayments: false,
    
    // Report permissions
    canGenerateReports: true,
    canExportData: false
  },
  
  customer: {
    // View permissions
    canViewAll: false,
    canViewAllVehicles: false,
    canViewAllCustomers: false,
    canViewAllServices: false,
    canViewAllPayments: false,
    canViewReports: true,
    canViewRevenueReport: false,
    
    // Manage permissions
    canManageCustomers: false,
    canManageVehicles: false,
    canManageServices: false,
    canManagePayments: false,
    canManageUsers: false,
    canManageTechnicians: false,
    canManageSettings: false,
    
    // Action permissions
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canEditPayments: false,
    
    // Report permissions
    canGenerateReports: true,
    canExportData: false
  }
};

// Helper function to get permission label
export const getPermissionLabel = (permission, language = 'ar') => {
  const permissionLabels = {
    ar: {
      canViewAll: 'عرض الكل',
      canManageCustomers: 'إدارة العملاء',
      canManageVehicles: 'إدارة المركبات',
      canManageServices: 'إدارة الخدمات',
      canManagePayments: 'إدارة الدفعات',
      canViewReports: 'عرض التقارير',
      canManageUsers: 'إدارة المستخدمين',
      canDelete: 'الحذف',
      canEditPayments: 'تعديل الدفعات',
      canViewAllVehicles: 'عرض جميع المركبات',
      canViewAllCustomers: 'عرض جميع العملاء',
      canGenerateReports: 'إنشاء التقارير',
      canViewRevenueReport: 'عرض تقرير الإيرادات'
    },
    en: {
      canViewAll: 'View All',
      canManageCustomers: 'Manage Customers',
      canManageVehicles: 'Manage Vehicles',
      canManageServices: 'Manage Services',
      canManagePayments: 'Manage Payments',
      canViewReports: 'View Reports',
      canManageUsers: 'Manage Users',
      canDelete: 'Delete',
      canEditPayments: 'Edit Payments',
      canViewAllVehicles: 'View All Vehicles',
      canViewAllCustomers: 'View All Customers',
      canGenerateReports: 'Generate Reports',
      canViewRevenueReport: 'View Revenue Report'
    }
  };
  
  return permissionLabels[language]?.[permission] || permission;
};

// Helper function to check if user has permission
export const checkPermission = (userRole, permission) => {
  if (!userRole || !userPermissions[userRole]) {
    return false;
  }
  
  return userPermissions[userRole][permission] || false;
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  return userPermissions[role] || {};
};

// Get readable role name
export const getRoleName = (role, language = 'ar') => {
  const roleNames = {
    ar: {
      admin: 'مدير',
      technician: 'فني',
      user: 'مستخدم',
      customer: 'عميل'
    },
    en: {
      admin: 'Admin',
      technician: 'Technician',
      user: 'User',
      customer: 'Customer'
    }
  };
  
  return roleNames[language]?.[role] || role;
};

// Get available roles for selection
export const getAvailableRoles = (language = 'ar') => {
  return [
    { value: 'admin', label: getRoleName('admin', language) },
    { value: 'technician', label: getRoleName('technician', language) },
    { value: 'user', label: getRoleName('user', language) },
    { value: 'customer', label: getRoleName('customer', language) }
  ];
};
