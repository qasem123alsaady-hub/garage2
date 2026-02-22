const BASE_URL = 'http://localhost/car-garage/backend/api';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}/${endpoint}`;
  const headers = { ...options.headers };
  
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.statusText}`);
  }
  
  return response.json();
};

export default {
  customers: {
    getAll: () => apiCall('customers.php'),
    create: (data) => apiCall('customers.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('customers.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('customers.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  vehicles: {
    getAll: () => apiCall('vehicles.php'),
    create: (data) => apiCall('vehicles.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('vehicles.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`vehicles.php?id=${id}`, { method: 'DELETE' }),
  },
  services: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`services.php${query ? '?' + query : ''}`);
    },
    create: (data) => apiCall('services.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('services.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`services.php?id=${id}`, { method: 'DELETE' }),
  },
  suppliers: {
    getAll: () => apiCall('suppliers.php'),
    create: (data) => apiCall('suppliers.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('suppliers.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('suppliers.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  employees: {
    getAll: () => apiCall('employees.php'),
    getPayroll: () => apiCall('employees.php?action=payroll'),
    create: (data) => apiCall('employees.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('employees.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('employees.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
    addAdvance: (data) => apiCall('employees.php?action=advance', { method: 'POST', body: JSON.stringify(data) }),
    approvePayroll: (data) => apiCall('employees.php?action=payroll_approve', { method: 'POST', body: JSON.stringify(data) }),
    getEmployeePayments: () => apiCall('employees.php?action=payments'),
    confirmEmployeePayment: (id) => apiCall('employees.php?action=confirm_payment', { method: 'POST', body: JSON.stringify({ payment_id: id }) }),
    deleteEmployeePayment: (id) => apiCall('employees.php', { method: 'DELETE', body: JSON.stringify({ payment_id: id }) }),
  },
  invoices: {
    getAll: () => apiCall('purchase_invoices.php'),
    create: (data) => apiCall('purchase_invoices.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('purchase_invoices.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('purchase_invoices.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  payments: {
    getAll: () => apiCall('payments.php'),
    getByServiceId: (serviceId) => apiCall('payments.php?service_id=' + serviceId),
    getByVehicleId: (vehicleId) => apiCall('payments.php?vehicle_id=' + vehicleId),
    create: (data) => apiCall('payments.php', { method: 'POST', body: JSON.stringify(data) }),
    createBulk: (data) => apiCall('payments.php', { method: 'POST', body: JSON.stringify({ ...data, action: 'bulk' }) }),
    update: (data) => apiCall('payments.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('payments.php', { method: 'DELETE', body: JSON.stringify({ payment_id: id }) }),
  },
  purchasePayments: {
    getAll: () => apiCall('purchase_payments.php'),
    getByInvoiceId: (invoiceId) => apiCall('purchase_payments.php?invoice_id=' + invoiceId),
    create: (data) => apiCall('purchase_payments.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('purchase_payments.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('purchase_payments.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  reports: {
    getFundStats: () => apiCall('fund_stats.php'),
  },
  serviceTypes: {
    getAll: () => apiCall('service_types.php'),
    create: (data) => apiCall('service_types.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiCall(`service_types.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`service_types.php?id=${id}`, { method: 'DELETE' }),
  },
  users: {
    getAll: () => apiCall('users.php'),
    create: (data) => apiCall('users.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('users.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('users.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  dashboard: {
    getStats: () => apiCall('dashboard.php'),
  }
};
