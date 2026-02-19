// استخدم متغير البيئة للـ API URL
const BASE_URL = import.meta.env.VITE_API_URL || 'https://https://garage2-r68a.onrender.com/api';

export const apiCall = async (endpoint, options = {}) => {
  // تنظيف الرابط من الـ // المكررة
  const url = `${BASE_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  
  console.log('Calling API:', url); // للتشخيص
  console.log('Request options:', options); // للتشخيص
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('Response status:', response.status); // للتشخيص
    console.log('Response headers:', response.headers); // للتشخيص
    
    // محاولة قراءة الاستجابة كنص أولاً
    const responseText = await response.text();
    console.log('Response text:', responseText); // للتشخيص
    
    // محاولة تحويل النص إلى JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(responseData.message || `API call failed: ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('API call error:', {
      message: error.message,
      url: url,
      type: error.name
    });
    throw error;
  }
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
    getAll: () => apiCall('services.php'),
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
    create: (data) => apiCall('employees.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('employees.php', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall('employees.php', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  invoices: {
    getAll: () => apiCall('purchase_invoices.php'),
    create: (data) => apiCall('purchase_invoices.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (data) => apiCall('purchase_invoices.php', { method: 'PUT', body: JSON.stringify(data) }),
  },
  payments: {
    getAll: () => apiCall('payments.php'),
    getByServiceId: (serviceId) => apiCall(`payments.php?service_id=${serviceId}`),
    getByVehicleId: (vehicleId) => apiCall(`payments.php?vehicle_id=${vehicleId}`),
    create: (data) => apiCall('payments.php', { method: 'POST', body: JSON.stringify(data) }),
    createBulk: (data) => apiCall('payments.php', { method: 'POST', body: JSON.stringify({ ...data, action: 'bulk' }) }),
    update: (data) => apiCall('payments.php', { method: 'PUT', body: JSON.stringify(data) }),
  },
  purchasePayments: {
    getAll: () => apiCall('purchase_payments.php'),
  },
  reports: {
    getFundStats: () => apiCall('fund_stats.php'),
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
