// يمكنك تغيير هذا العنوان ليتناسب مع رابط السيرفر الخاص بك
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost/car-garage/backend/api' 
  : '/car-garage/backend/api';

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  // التأكد من أن الـ endpoint لا يحتوي على / في البداية
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  const url = `${API_BASE}/${cleanEndpoint}`;
  
  console.log(`📡 API Call to: ${url} ${options.method || 'GET'}`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'omit'
  };

  try {
    const response = await fetch(url, config);
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    if (response.type === 'opaque' || response.status === 0) {
      throw new Error('CORS error or network failure. Check server CORS headers.');
    }

    if (response.status === 204) {
      return { success: true };
    }

    const text = await response.text();
    console.log(`📡 Response Text (first 200 chars): ${text.substring(0, 200)}...`);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = text ? JSON.parse(text) : {};
        errorMessage = errorData.message || errorData.error || errorMessage;
        
        // تحسين رسائل الخطأ
        if (errorMessage.includes('معرف المستخدم مفقود')) {
          errorMessage = 'User ID is required. Please check your request parameters.';
        }
        if (errorMessage.includes('Service ID is required')) {
          errorMessage = 'Service ID is required. Please provide a service ID or use "all".';
        }
      } catch (e) {
        if (text) errorMessage = `${errorMessage} - ${text}`;
      }
      throw new Error(errorMessage);
    }

    if (text && text.trim() !== '') {
      try {
        const data = JSON.parse(text);
        console.log(`📡 Parsed JSON data:`, data);
        return data;
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e, 'Text:', text);
        throw new Error('Invalid JSON response from server');
      }
    } else {
      return { success: true };
    }
  } catch (error) {
    console.error(`❌ API Error (${cleanEndpoint}):`, error);
    
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.endpoint = cleanEndpoint;
    enhancedError.url = url;
    
    throw enhancedError;
  }
};

// Auth API
export const authService = {
  login: async (username, password) => {
    return apiCall('auth.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        username,
        password
      })
    });
  },
  
  logout: async () => {
    return apiCall('auth.php?action=logout');
  },
  
  checkAuth: async () => {
    return apiCall('auth.php?action=check');
  }
};

// Customers API
export const fetchCustomers = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `customers.php?${queryParams}` : 'customers.php';
  console.log(`👥 Fetching customers from: ${url}`);
  return apiCall(url);
};

export const addCustomer = async (customerData) => {
  return apiCall('customers.php', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
};

export const updateCustomer = async (id, customerData) => {
  if (!id) {
    throw new Error('Customer ID is required for update');
  }
  return apiCall(`customers.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
  });
};

export const deleteCustomer = async (id) => {
  if (!id) {
    throw new Error('Customer ID is required for deletion');
  }
  return apiCall(`customers.php?id=${id}`, {
    method: 'DELETE'
  });
};

// Vehicles API
export const fetchVehicles = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `vehicles.php?${queryParams}` : 'vehicles.php';
  console.log(`🚗 Fetching vehicles from: ${url}`);
  return apiCall(url);
};

export const addVehicle = async (vehicleData) => {
  return apiCall('vehicles.php', {
    method: 'POST',
    body: JSON.stringify(vehicleData)
  });
};

export const updateVehicle = async (id, vehicleData) => {
  if (!id) {
    throw new Error('Vehicle ID is required for update');
  }
  return apiCall(`vehicles.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData)
  });
};

export const deleteVehicle = async (id) => {
  if (!id) {
    throw new Error('Vehicle ID is required for deletion');
  }
  return apiCall(`vehicles.php?id=${id}`, {
    method: 'DELETE'
  });
};

// Services API
export const fetchServices = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `services.php?${queryParams}` : 'services.php';
  console.log(`🔧 Fetching services from: ${url}`);
  return apiCall(url);
};

export const addService = async (serviceData) => {
  return apiCall('services.php', {
    method: 'POST',
    body: JSON.stringify(serviceData)
  });
};

export const updateService = async (id, serviceData) => {
  if (!id) {
    throw new Error('Service ID is required for update');
  }
  return apiCall(`services.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData)
  });
};

export const deleteService = async (id) => {
  if (!id) {
    throw new Error('Service ID is required for deletion');
  }
  return apiCall(`services.php?id=${id}`, {
    method: 'DELETE'
  });
};

// Payments API - الحل النهائي
export const fetchPayments = async (params = {}) => {
  // حل المشكلة: server يرفض `all=true` ويطلب `service_id` مطلوب
  // الحل: استخدام `service_id=all` بدلاً من `all=true`
  
  // تحضير المعلمات الآمنة
  const safeParams = { ...params };
  
  // إذا كان هناك service_id محدد، استخدمه
  // إذا لا يوجد service_id، استخدم 'all'
  if (!safeParams.service_id && !safeParams.all) {
    safeParams.service_id = 'all';
  }
  
  // إذا كان هناك all=true، حوله إلى service_id=all
  if (safeParams.all === 'true' || safeParams.all === true) {
    safeParams.service_id = 'all';
    delete safeParams.all;
  }
  
  const queryParams = new URLSearchParams(safeParams).toString();
  const url = `payments.php?${queryParams}`;
  console.log(`💰 Fetching payments from: ${url}`);
  
  try {
    const response = await apiCall(url);
    
    // معالجة الاستجابة: قد تكون مصفوفة فارغة وهذا طبيعي
    if (Array.isArray(response) && response.length === 0) {
      console.log('ℹ️ No payments found (empty array returned). This is normal if no payments have been added yet.');
      return response; // إرجاع المصفوفة الفارغة
    }
    
    return response;
  } catch (error) {
    // إذا كان الخطأ بسبب service_id، حاول إصلاحه
    if (error.message.includes('Service ID is required')) {
      console.log('⚠️ Retrying payments request with service_id=all...');
      return apiCall('payments.php?service_id=all');
    }
    throw error;
  }
};

export const fetchAllPayments = async () => {
  // استخدم service_id=all بدلاً من all=true
  console.log('💰 Fetching ALL payments using service_id=all');
  return apiCall('payments.php?service_id=all');
};

export const fetchPaymentsByService = async (serviceId) => {
  if (!serviceId) {
    throw new Error('Service ID is required');
  }
  console.log(`💰 Fetching payments for service: ${serviceId}`);
  return apiCall(`payments.php?service_id=${serviceId}`);
};

export const fetchPaymentsByCustomer = async (customerId) => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }
  console.log(`💰 Fetching payments for customer: ${customerId}`);
  return apiCall(`payments.php?customer_id=${customerId}`);
};

export const addPayment = async (paymentData) => {
  // تأكد من وجود service_id في البيانات
  if (!paymentData.service_id) {
    console.warn('⚠️ Attempting to add payment without service_id');
    // حاول الحصول على service_id من الخدمات المتاحة
    try {
      const services = await fetchServices();
      if (services && services.length > 0) {
        paymentData.service_id = services[0].id;
        console.log(`ℹ️ Auto-assigned service_id: ${paymentData.service_id}`);
      }
    } catch (error) {
      console.error('❌ Cannot auto-assign service_id:', error);
    }
  }
  
  if (!paymentData.service_id) {
    throw new Error('Service ID is required for payment. Please add a service first.');
  }
  
  return apiCall('payments.php', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

export const updatePayment = async (id, paymentData) => {
  if (!id) {
    throw new Error('Payment ID is required for update');
  }
  return apiCall(`payments.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData)
  });
};

export const deletePayment = async (id) => {
  if (!id) {
    throw new Error('Payment ID is required for deletion');
  }
  return apiCall(`payments.php?id=${id}`, {
    method: 'DELETE'
  });
};

// Users API - مع التعديلات
export const fetchUsers = async (params = {}) => {
  // إضافة معلمة all=true إذا كانت المعلمات فارغة
  const safeParams = { ...params };
  
  if (Object.keys(safeParams).length === 0) {
    // استخدام معلمة آمنة لجلب جميع المستخدمين
    safeParams.all = 'true';
  }
  
  const queryParams = new URLSearchParams(safeParams).toString();
  const url = queryParams ? `users.php?${queryParams}` : 'users.php';
  console.log(`👤 Fetching users from: ${url}`);
  return apiCall(url);
};

export const fetchTechnicians = async () => {
  // استخدام role مع all=true
  return apiCall('users.php?role=technician&all=true');
};

export const fetchUserById = async (id) => {
  if (!id) {
    throw new Error('User ID is required');
  }
  return apiCall(`users.php?id=${id}`);
};

export const addUser = async (userData) => {
  return apiCall('users.php', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const updateUser = async (id, userData) => {
  if (!id) {
    throw new Error('User ID is required for update');
  }
  return apiCall(`users.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
};

export const deleteUser = async (id) => {
  if (!id) {
    throw new Error('User ID is required for deletion');
  }
  return apiCall(`users.php?id=${id}`, {
    method: 'DELETE'
  });
};

// Dashboard API
export const fetchDashboardStats = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `dashboard.php?${queryParams}` : 'dashboard.php';
  console.log(`📊 Fetching dashboard stats from: ${url}`);
  return apiCall(url);
};

// Reports API
export const generateReport = async (reportType, filters = {}) => {
  return apiCall('reports.php', {
    method: 'POST',
    body: JSON.stringify({
      type: reportType,
      filters
    })
  });
};

// Excel Export API
export const downloadExcelReport = async (lang = 'ar') => {
  const token = localStorage.getItem('auth_token');
  const url = `${API_BASE}/export_excel.php?lang=${lang}`;
  
  console.log(`📊 Downloading Excel report from: ${url}`);

  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `garage_report_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Download Error:', error);
    throw error;
  }
};

// اختبار الاتصال بالـ API
export const testApiConnection = async () => {
  try {
    const response = await apiCall('test.php');
    return { connected: true, response };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// دالة مساعدة للتحقق من حالة المصادقة
export const checkAuthStatus = async () => {
  try {
    const response = await apiCall('auth.php?action=check');
    return { authenticated: true, user: response.user };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
};

// دالة خاصة للتغلب على مشاكل CORS في التطوير
export const testCorsFix = async () => {
  console.log('🔧 Testing CORS fix...');
  
  const testUrl = `${API_BASE}/auth.php?action=test`;
  console.log('🔧 Test URL:', testUrl);
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'omit'
    });
    
    console.log('🔧 Test response:', response.status, response.statusText);
    
    if (response.ok) {
      const text = await response.text();
      console.log('🔧 Test response text:', text);
      return { success: true, message: 'CORS test passed' };
    } else {
      return { 
        success: false, 
        message: `CORS test failed: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error('🔧 CORS test error:', error);
    return { 
      success: false, 
      message: `CORS test error: ${error.message}` 
    };
  }
};

// دالة جديدة: اختبار واجهة payments بالشكل الصحيح
export const testPaymentsApi = async () => {
  console.log('🧪 Testing payments API with correct parameters...');
  
  const tests = [
    { 
      method: 'GET payments with service_id=all', 
      url: 'payments.php?service_id=all' 
    },
    { 
      method: 'GET payments without params (auto service_id=all)', 
      call: async () => await fetchPayments() 
    },
    { 
      method: 'GET all payments', 
      call: async () => await fetchAllPayments() 
    }
  ];
  
  // إذا كانت هناك خدمات، أضف اختبار لجلب مدفوعات خدمة محددة
  try {
    const services = await fetchServices();
    if (services && services.length > 0) {
      const serviceId = services[0].id;
      tests.push({
        method: `GET payments for service ${serviceId}`,
        url: `payments.php?service_id=${serviceId}`
      });
    }
  } catch (error) {
    console.log('⚠️ Cannot add service-specific test:', error.message);
  }
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.method}`);
      
      let response;
      if (test.url) {
        response = await apiCall(test.url);
      } else {
        response = await test.call();
      }
      
      results.push({
        test: test.method,
        success: true,
        data: response,
        isEmpty: Array.isArray(response) && response.length === 0
      });
      console.log(`✅ ${test.method}: Success (Empty: ${Array.isArray(response) && response.length === 0})`);
    } catch (error) {
      results.push({
        test: test.method,
        success: false,
        error: error.message
      });
      console.log(`❌ ${test.method}: ${error.message}`);
    }
  }
  
  return results;
};

// دالة لاختبار جميع واجهات API
export const testAllApis = async () => {
  console.log('🧪 Testing all APIs...');
  
  const apis = [
    { name: 'auth check', call: () => authService.checkAuth() },
    { name: 'customers', call: () => fetchCustomers() },
    { name: 'vehicles', call: () => fetchVehicles() },
    { name: 'services', call: () => fetchServices() },
    { name: 'payments', call: () => fetchAllPayments() },
    { name: 'users', call: () => fetchUsers() },
    { name: 'technicians', call: () => fetchTechnicians() }
  ];
  
  const results = [];
  
  for (const api of apis) {
    try {
      console.log(`🧪 Testing: ${api.name}`);
      const response = await api.call();
      const isEmpty = Array.isArray(response) && response.length === 0;
      
      results.push({
        api: api.name,
        success: true,
        status: 'OK',
        isEmpty: isEmpty,
        count: Array.isArray(response) ? response.length : 'N/A'
      });
      console.log(`✅ ${api.name}: Success (Count: ${Array.isArray(response) ? response.length : 'N/A'})`);
    } catch (error) {
      results.push({
        api: api.name,
        success: false,
        error: error.message
      });
      console.log(`❌ ${api.name}: ${error.message}`);
    }
  }
  
  console.log('📋 Test Results:', results);
  return results;
};

// دالة لإنشاء بيانات تجريبية
export const createTestData = async () => {
  console.log('🧪 Creating test data...');
  
  try {
    // 1. إنشاء خدمة تجريبية
    const testService = {
      vehicle_id: 'test-vehicle',
      type: 'test',
      description: 'Test service for payments',
      technician: 'test-technician',
      date: new Date().toISOString().split('T')[0],
      cost: '1000.00',
      status: 'completed'
    };
    
    const service = await addService(testService);
    console.log('✅ Test service created:', service);
    
    // 2. إنشاء دفعة تجريبية
    if (service && service.id) {
      const testPayment = {
        service_id: service.id,
        amount: '1000.00',
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        notes: 'Test payment'
      };
      
      const payment = await addPayment(testPayment);
      console.log('✅ Test payment created:', payment);
      
      return { service, payment };
    }
    
    return { service };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return { error: error.message };
  }
};

// دالة لفحص حالة قاعدة البيانات
export const checkDatabaseStatus = async () => {
  console.log('🔍 Checking database status...');
  
  const status = {
    customers: 0,
    vehicles: 0,
    services: 0,
    payments: 0,
    users: 0,
    allApisWorking: true,
    issues: []
  };
  
  try {
    // اختبار جميع الـ APIs
    const customers = await fetchCustomers();
    status.customers = Array.isArray(customers) ? customers.length : 0;
  } catch (error) {
    status.allApisWorking = false;
    status.issues.push(`Customers API: ${error.message}`);
  }
  
  try {
    const vehicles = await fetchVehicles();
    status.vehicles = Array.isArray(vehicles) ? vehicles.length : 0;
  } catch (error) {
    status.allApisWorking = false;
    status.issues.push(`Vehicles API: ${error.message}`);
  }
  
  try {
    const services = await fetchServices();
    status.services = Array.isArray(services) ? services.length : 0;
  } catch (error) {
    status.allApisWorking = false;
    status.issues.push(`Services API: ${error.message}`);
  }
  
  try {
    const payments = await fetchAllPayments();
    status.payments = Array.isArray(payments) ? payments.length : 0;
  } catch (error) {
    status.allApisWorking = false;
    status.issues.push(`Payments API: ${error.message}`);
  }
  
  try {
    const users = await fetchUsers();
    status.users = Array.isArray(users) ? users.length : 0;
  } catch (error) {
    status.allApisWorking = false;
    status.issues.push(`Users API: ${error.message}`);
  }
  
  console.log('📊 Database Status:', status);
  return status;
};