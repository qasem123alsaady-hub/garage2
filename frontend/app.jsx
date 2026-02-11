// app.jsx - الكود الكامل المحسن والمصحح
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { translations } from './translations';
import { userPermissions } from './permissions';
import PrintHeader from '../PrintHeader';

// تحديد عنوان الـ API بشكل ديناميكي ليعمل على المتصفحات العادية والموبايل
const API_HOSTNAME = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
const API_BASE = `http://${API_HOSTNAME}/car-garage/backend/api`;

// مكون الشعار الذكي الذي يعالج أخطاء التحميل
const Logo = ({ src, language, height = '50px' }) => {
  const [error, setError] = useState(false);
  
  // إعادة تعيين حالة الخطأ عند تغيير المصدر
  useEffect(() => {
    setError(false);
  }, [src]);

  const style = {
    height: height, 
    maxWidth: '100%',
    [language === 'ar' ? 'marginLeft' : 'marginRight']: '10px',
    objectFit: 'contain'
  };
  
  if (error) {
    return (
      <div className="logo-icon" style={{
        ...style,
        width: height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: parseInt(height) * 0.7 + 'px',
        backgroundColor: '#f3f4f6',
        borderRadius: '50%',
        border: '1px dashed #ccc'
      }}>
        🚗
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt="Logo" 
      style={style} 
      onError={() => {
        console.warn("تعذر تحميل الشعار، سيتم عرض الرمز البديل.");
        setError(true);
      }}
    />
  );
};

function CarGarageManagement() {
  // States للمستخدمين والمصادقة
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('garage_user') || sessionStorage.getItem('garage_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoginOpen, setIsLoginOpen] = useState(() => {
    return !(localStorage.getItem('garage_user') || sessionStorage.getItem('garage_user'));
  });
  
  // بيانات تسجيل الدخول
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  // States الأساسية
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // States لإدارة المستخدمين (الفنيين)
  const [technicians, setTechnicians] = useState([]);
  const [isTechnicianManagementOpen, setIsTechnicianManagementOpen] = useState(false);
  const [isTechnicianFormOpen, setIsTechnicianFormOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [newTechnician, setNewTechnician] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'technician'
  });
  const [editTechnician, setEditTechnician] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'technician'
  });

  // States لإدارة حسابات الأدمن
  const [isAdminAccountsOpen, setIsAdminAccountsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // States للنماذج
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentsHistoryOpen, setIsPaymentsHistoryOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  
  // States للتقارير
  const [isVehicleReportOpen, setIsVehicleReportOpen] = useState(false);
  const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
  const [isRevenueReportOpen, setIsRevenueReportOpen] = useState(false);
  
  // States للبيانات الجديدة
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'pending',
    customer_id: ''
  });

  const [editVehicle, setEditVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'pending',
    customer_id: ''
  });
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [editCustomer, setEditCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [newService, setNewService] = useState({
    vehicle_id: '',
    type: '',
    description: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'pending',
    payment_status: 'pending'
  });

  // States للدفعات
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceForPayments, setSelectedServiceForPayments] = useState(null);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  const [revenueReportDateRange, setRevenueReportDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const [editSinglePaymentData, setEditSinglePaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: '',
    transactionId: '',
    notes: ''
  });

  // States للتقارير
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const [customerReportDateRange, setCustomerReportDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState({
    totalVehicles: 0,
    inService: 0,
    completed: 0,
    pending: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0
  });

  // إضافة state للغة
  const [language, setLanguage] = useState('ar');

  // إضافة state للدفع الشامل
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);
  const [bulkPaymentData, setBulkPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  const t = translations[language];

  // البيانات التجريبية
  const demoData = {
    customers: [
      { 
        id: 'c1', 
        name: 'أحمد السيد', 
        phone: '0123456789', 
        email: 'ahmed@example.com', 
        address: 'القاهرة',
        created_at: '2024-01-15 10:00:00'
      },
      { 
        id: 'c2', 
        name: 'محمد عبدالله', 
        phone: '0123456790', 
        email: 'mohamed@example.com', 
        address: 'الجيزة',
        created_at: '2024-01-16 11:00:00'
      },
      { 
        id: 'c3', 
        name: 'فاطمة أحمد', 
        phone: '0123456791', 
        email: 'fatima@example.com', 
        address: 'الإسكندرية',
        created_at: '2024-01-17 12:00:00'
      }
    ],
    vehicles: [
      { 
        id: 'v1', 
        make: 'تويوتا', 
        model: 'كامري', 
        year: 2022, 
        license_plate: 'أ ب ج 123', 
        status: 'in-service', 
        customer_id: 'c1' 
      },
      { 
        id: 'v2', 
        make: 'هيونداي', 
        model: 'سوناتا', 
        year: 2021, 
        license_plate: 'د هـ و 456', 
        status: 'completed', 
        customer_id: 'c2' 
      },
      { 
        id: 'v3', 
        make: 'نيسان', 
        model: 'صني', 
        year: 2020, 
        license_plate: 'ز ح ط 789', 
        status: 'pending', 
        customer_id: 'c3' 
      }
    ],
    services: [
      { 
        id: 's1', 
        vehicle_id: 'v1', 
        type: 'تغيير الزيت', 
        description: 'تغيير زيت المحرك والفلاتر', 
        status: 'completed', 
        technician: 'أحمد محمد', 
        date: '2024-01-15', 
        cost: 150, 
        amount_paid: 150, 
        remaining_amount: 0, 
        payment_status: 'paid' 
      },
      { 
        id: 's2', 
        vehicle_id: 'v1', 
        type: 'خدمة الفرامل', 
        description: 'فحص وتغيير فرامل', 
        status: 'in-service', 
        technician: 'محمد علي', 
        date: '2024-01-20', 
        cost: 300, 
        amount_paid: 150, 
        remaining_amount: 150, 
        payment_status: 'partial' 
      },
      { 
        id: 's3', 
        vehicle_id: 'v2', 
        type: 'تغيير الإطارات', 
        description: 'تغيير الإطارات الأمامية', 
        status: 'completed', 
        technician: 'خالد أحمد', 
        date: '2024-01-18', 
        cost: 200, 
        amount_paid: 200, 
        remaining_amount: 0, 
        payment_status: 'paid' 
      }
    ],
    payments: [
      {
        id: 'p1',
        service_id: 's1',
        amount: 150,
        payment_method: 'cash',
        payment_date: '2024-01-15',
        transaction_id: '',
        notes: 'دفعة كاملة'
      },
      {
        id: 'p2',
        service_id: 's2',
        amount: 150,
        payment_method: 'card',
        payment_date: '2024-01-20',
        transaction_id: 'TXN123456',
        notes: 'دفعة أولى'
      }
    ],
    users: [
      { id: 'u1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' },
      { id: 'u2', username: 'user', password: 'user123', name: 'مستخدم عادي', role: 'user' },
      { id: 'u3', username: 'tech', password: 'tech123', name: 'فني متخصص', role: 'technician' },
      { id: 'u4', username: '0123456789', password: '123456', name: 'أحمد السيد', role: 'customer', customer_id: 'c1' },
      { id: 'u5', username: '0123456790', password: '123456', name: 'محمد عبدالله', role: 'customer', customer_id: 'c2' },
      { id: 'u6', username: '0123456791', password: '123456', name: 'فاطمة أحمد', role: 'customer', customer_id: 'c3' }
    ]
  };

  // جلب البيانات من الـ API
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    updateStats();
  }, [vehicles, services, customers]);

  // التحقق من الصلاحيات
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return userPermissions[currentUser.role]?.[permission] || false;
  };

  // دالة محسنة لتحديث الإحصائيات
  const updateStats = () => {
    let filteredVehicles = vehicles;
    let filteredServices = services;
    let filteredCustomers = customers;

    if (currentUser?.role === 'customer' && currentUser.customer_id) {
      filteredVehicles = vehicles.filter(v => v.customer_id === currentUser.customer_id);
      filteredServices = services.filter(s => 
        filteredVehicles.some(v => v.id === s.vehicle_id)
      );
      filteredCustomers = customers.filter(c => c.id === currentUser.customer_id);
    }

    const totalVehicles = filteredVehicles.length;
    const inService = filteredVehicles.filter(v => v.status === 'in-service').length;
    const completed = filteredVehicles.filter(v => v.status === 'completed').length;
    const pending = filteredVehicles.filter(v => v.status === 'pending').length;
    const totalRevenue = filteredServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0);
    const paidRevenue = filteredServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0);
    const pendingRevenue = filteredServices.reduce((sum, service) => sum + parseFloat(service.remaining_amount || 0), 0);
    const totalCustomers = filteredCustomers.length;
    
    setStats({ 
      totalVehicles, 
      inService, 
      completed, 
      pending, 
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalCustomers
    });
  };

  // دالة محسنة لجلب البيانات
  const fetchData = async () => {
    try {
      const [customersResult, vehiclesResult, servicesResult, paymentsResult, usersResult] = await Promise.allSettled([
        fetch(`${API_BASE}/customers.php`).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`${API_BASE}/vehicles.php`).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`${API_BASE}/services.php`).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`${API_BASE}/payments.php`).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`${API_BASE}/users.php?role=technician`).then(res => res.ok ? res.json() : []).catch(() => [])
      ]);

      let customersData = customersResult.status === 'fulfilled' ? customersResult.value : [];
      if (!customersData || customersData.length === 0) {
        customersData = demoData.customers;
      }
      setCustomers(customersData);

      let vehiclesData = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value : [];
      if (!vehiclesData || vehiclesData.length === 0) {
        vehiclesData = demoData.vehicles;
      }
      setVehicles(vehiclesData);

      let servicesData = servicesResult.status === 'fulfilled' ? servicesResult.value : [];
      if (!servicesData || servicesData.length === 0) {
        servicesData = demoData.services;
      }
      setServices(servicesData);

      let paymentsData = paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];
      if (!paymentsData || paymentsData.length === 0) {
        paymentsData = demoData.payments;
      }
      setPayments(paymentsData);

      let usersData = usersResult.status === 'fulfilled' ? usersResult.value.users : [];
      if (!usersData || usersData.length === 0) {
        usersData = demoData.users ? demoData.users.filter(u => u.role === 'technician') : [];
      }
      setTechnicians(usersData);

    } catch (error) {
      console.error('❌ خطأ في جلب البيانات:', error);
      setCustomers(demoData.customers);
      setVehicles(demoData.vehicles);
      setServices(demoData.services);
      setPayments(demoData.payments);
      setTechnicians(demoData.users ? demoData.users.filter(u => u.role === 'technician') : []);
    }
  };

  // تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('${API_BASE}/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: loginData.username,
          password: loginData.password
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const storage = loginData.rememberMe ? localStorage : sessionStorage;
          storage.setItem('garage_user', JSON.stringify(result.user));
          setCurrentUser(result.user);
          setIsLoginOpen(false);
          setLoginData({ username: '', password: '', rememberMe: false });
          alert(t.loginSuccess);
          return;
        }
      }
      
      const user = demoData.users.find(u => u.username === loginData.username && u.password === loginData.password);
      
      if (user) {
        const userData = {
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
          customer_id: user.customer_id
        };
        const storage = loginData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('garage_user', JSON.stringify(userData));
        setCurrentUser(userData);
        setIsLoginOpen(false);
        setLoginData({ username: '', password: '', rememberMe: false });
        alert(t.loginSuccess);
      } else {
        alert(t.invalidCredentials);
      }
    } catch (error) {
      console.error('Login error:', error);
      const user = demoData.users.find(u => u.username === loginData.username && u.password === loginData.password);
      
      if (user) {
        const userData = {
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
          customer_id: user.customer_id
        };
        const storage = loginData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('garage_user', JSON.stringify(userData));
        setCurrentUser(userData);
        setIsLoginOpen(false);
        setLoginData({ username: '', password: '', rememberMe: false });
        alert(t.loginSuccess);
      } else {
        alert(t.invalidCredentials);
      }
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('garage_user');
    sessionStorage.removeItem('garage_user');
    setCurrentUser(null);
    setIsLoginOpen(true);
    setVehicles([]);
    setServices([]);
    setCustomers([]);
    setPayments([]);
    alert(t.logoutSuccess);
  };

  // إضافة العميل
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageCustomers')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!newCustomer.name || !newCustomer.phone) {
        alert('الرجاء إدخال الاسم ورقم الهاتف');
        return;
      }

      const response = await fetch(`${API_BASE}/customers.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          address: newCustomer.address
        })
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم: ' + responseText);
      }

      if (result.success) {
        if (result.customer) {
          setCustomers(prev => {
            const exists = prev.find(c => c.id === result.customer.id);
            if (exists) return prev;
            return [...prev, result.customer];
          });
        }
        
        setIsCustomerFormOpen(false);
        setNewCustomer({ name: '', phone: '', email: '', address: '' });
        
        let successMessage = `✅ ${t.customerAdded}`;
        if (result.user_account) {
          successMessage += `\n✅ ${t.userAccountCreatedForCustomer}\n👤 ${t.username}: ${result.user_account.username}\n🔐 ${t.password}: ${result.user_account.password}`;
        }
        alert(successMessage);
        
        updateStats();

      } else {
        if (result.message && (result.message.includes('موجود') || result.message.includes('مسجل') || result.error_code === 'PHONE_EXISTS')) {
          alert(t.customerExists);
        } else {
          alert('❌ خطأ في إضافة العميل: ' + (result.message || 'سبب غير معروف'));
        }
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة العميل:', error);
      
      const newCustomerWithId = {
        ...newCustomer,
        id: 'c' + Date.now() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      
      setCustomers(prev => {
        const exists = prev.find(c => c.phone === newCustomer.phone);
        if (exists) {
          alert(t.customerExists);
          return prev;
        }
        return [...prev, newCustomerWithId];
      });
      
      setIsCustomerFormOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      
      alert(`✅ ${t.customerAddedLocal}`);
      
      updateStats();
    }
  };

  // تعديل عميل
  const handleEditCustomer = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageCustomers')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!editCustomer.name || !editCustomer.phone) {
        alert('الرجاء إدخال الاسم ورقم الهاتف');
        return;
      }

      const response = await fetch(`${API_BASE}/customers.php`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: selectedCustomer.id,
          name: editCustomer.name,
          phone: editCustomer.phone,
          email: editCustomer.email,
          address: editCustomer.address
        })
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم: ' + responseText);
      }

      if (result.success) {
        setCustomers(prev => 
          prev.map(c => 
            c.id === selectedCustomer.id 
              ? { ...c, ...editCustomer }
              : c
          )
        );
        
        setIsEditCustomerModalOpen(false);
        setEditCustomer({ name: '', phone: '', email: '', address: '' });
        setSelectedCustomer(null);
        
        alert(`✅ ${t.customerUpdated}`);
        
        updateStats();

      } else {
        alert('❌ خطأ في تحديث العميل: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث العميل:', error);
      
      setCustomers(prev => 
        prev.map(c => 
          c.id === selectedCustomer.id 
            ? { ...c, ...editCustomer }
            : c
        )
      );
      
      setIsEditCustomerModalOpen(false);
      setEditCustomer({ name: '', phone: '', email: '', address: '' });
      setSelectedCustomer(null);
      
      alert(`✅ تم تحديث العميل بنجاح (البيانات المحلية)`);
      
      updateStats();
    }
  };

  // فتح نموذج تعديل العميل
  const openEditCustomerModal = (customer) => {
    setSelectedCustomer(customer);
    setEditCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsEditCustomerModalOpen(true);
  };

  // دوال إدارة المستخدمين (الفنيين)
  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${API_BASE}/users.php?role=technician`);
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data.users || []);
      } else {
        console.error('Error fetching technicians:', response.status);
        if (technicians.length === 0) {
          const demoTechnicians = demoData.users.filter(u => u.role === 'technician');
          setTechnicians(demoTechnicians);
        }
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      if (technicians.length === 0) {
        const demoTechnicians = demoData.users.filter(u => u.role === 'technician');
        setTechnicians(demoTechnicians);
      }
    }
  };

  // إضافة فني جديد
  const handleAddTechnician = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageUsers')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!newTechnician.username || !newTechnician.password || !newTechnician.name) {
        alert('الرجاء إدخال الاسم، اسم المستخدم، وكلمة المرور');
        return;
      }

      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          username: newTechnician.username,
          password: newTechnician.password,
          name: newTechnician.name,
          email: newTechnician.email,
          role: 'technician'
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchTechnicians();
        setIsTechnicianFormOpen(false);
        setNewTechnician({ username: '', password: '', name: '', email: '', role: 'technician' });
        alert(`✅ ${t.technicianAdded}`);
      } else {
        alert('❌ خطأ في إضافة الفني: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة الفني:', error);
      alert('حدث خطأ في إضافة الفني: ' + error.message);
    }
  };

  // تعديل بيانات فني
  const handleEditTechnician = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageUsers') || !selectedTechnician) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!editTechnician.username || !editTechnician.name) {
        alert('الرجاء إدخال الاسم واسم المستخدم');
        return;
      }

      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedTechnician.id,
          username: editTechnician.username,
          name: editTechnician.name,
          email: editTechnician.email,
          password: editTechnician.password || undefined,
          role: 'technician'
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchTechnicians();
        setIsTechnicianFormOpen(false);
        setSelectedTechnician(null);
        setEditTechnician({ username: '', password: '', name: '', email: '', role: 'technician' });
        alert(`✅ ${t.technicianUpdated}`);
      } else {
        alert('❌ خطأ في تحديث الفني: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث الفني:', error);
      alert('حدث خطأ في تحديث الفني: ' + error.message);
    }
  };

  // حذف فني
  const handleDeleteTechnician = async (userId) => {
    if (!hasPermission('canManageUsers') || !confirm(t.confirmTechnicianDelete)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        await fetchTechnicians();
        alert(`✅ ${t.technicianDeleted}`);
      } else {
        alert('❌ خطأ في حذف الفني: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في حذف الفني:', error);
      alert('حدث خطأ في حذف الفني: ' + error.message);
    }
  };

  // فتح نموذج تعديل الفني
  const openEditTechnicianModal = (technician) => {
    setSelectedTechnician(technician);
    setEditTechnician({
      username: technician.username,
      name: technician.name,
      email: technician.email || '',
      password: '',
      role: 'technician'
    });
    setIsTechnicianFormOpen(true);
  };

  // جلب جميع المستخدمين من قاعدة البيانات
  const loadAllUsers = async () => {
    try {
      console.log('🔄 جاري جلب جميع المستخدمين من قاعدة البيانات...');
      
      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 حالة الاستجابة:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ استجابة الخادم:', errorText);
        throw new Error(`خطأ في الاتصال: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('📦 نص الاستجابة الخام:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('الخادم لم يرسل بيانات JSON صحيحة');
      }
      
      console.log('📦 البيانات المستقبلة من الـ API:', data);
      
      let users = [];
      
      if (Array.isArray(data)) {
        users = data;
      } else if (data && typeof data === 'object') {
        if (data.users && Array.isArray(data.users)) {
          users = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          users = data.data;
        } else if (data.message === 'No users found.' || data.message === 'لا توجد مستخدمين') {
          users = [];
        } else {
          if (data.id || data.username) {
            users = [data];
          } else {
            console.warn('⚠️ صيغة البيانات غير متوقعة:', data);
            users = [];
          }
        }
      }
      
      users = users.filter(user => user && user.id);
      
      console.log('✅ تم جلب ' + users.length + ' مستخدم من قاعدة البيانات');
      console.log('المستخدمون:', users);
      
      setAllUsers(users);
      
      if (users.length === 0) {
        console.warn('⚠️ لا توجد مستخدمين في قاعدة البيانات');
      }
      
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين من قاعدة البيانات:', error);
      alert('❌ خطأ في الاتصال بقاعدة البيانات:\n' + error.message + '\n\nتأكد من:\n1. أن الخادم يعمل\n2. أن ملف users.php موجود في المسار الصحيح\n3. أن قاعدة البيانات تحتوي على جدول users');
      setAllUsers([]);
    }
  };

  // إعادة تعيين كلمة المرور للمستخدم
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    console.log('🔄 جاري إعادة تعيين كلمة المرور للمستخدم:', selectedUser.username);
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      alert(t.passwordMismatch);
      return;
    }
    
    if (resetPasswordData.newPassword.length < 6) {
      alert(t.passwordTooShort);
      return;
    }
    
    try {
      console.log('📤 إرسال طلب تحديث كلمة المرور...');
      console.log('البيانات المرسلة:', {
        id: selectedUser.id,
        username: selectedUser.username,
        name: selectedUser.name,
        role: selectedUser.role,
        password: resetPasswordData.newPassword
      });
      
      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          username: selectedUser.username,
          name: selectedUser.name,
          role: selectedUser.role,
          password: resetPasswordData.newPassword
        })
      });

      const responseText = await response.text();
      console.log('📥 استجابة الخادم:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل الاستجابة:', parseError);
        throw new Error('استجابة غير صحيحة من الخادم');
      }

      if (result.success) {
        console.log('✅ تم تحديث كلمة المرور بنجاح');
        
        const updatedUsers = allUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, password: resetPasswordData.newPassword }
            : user
        );
        setAllUsers(updatedUsers);
        setSelectedUser({ ...selectedUser, password: resetPasswordData.newPassword });
        
        setIsResetPasswordModalOpen(false);
        setResetPasswordData({ newPassword: '', confirmPassword: '' });
        
        alert(`✅ ${t.passwordResetSuccess}\n\nكلمة المرور الجديدة: ${resetPasswordData.newPassword}`);
      } else {
        console.error('❌ فشل تحديث كلمة المرور:', result.message);
        alert('❌ خطأ في إعادة تعيين كلمة المرور: ' + (result.message || 'سبب غير معروف'));
      }
    } catch (error) {
      console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
      alert('❌ حدث خطأ: ' + error.message);
    }
  };

  // حذف المستخدم
  const handleDeleteUser = async (userId) => {
    if (!confirm(t.deleteAccountConfirm)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/users.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        const updatedUsers = allUsers.filter(user => user.id !== userId);
        setAllUsers(updatedUsers);
        
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
        
        alert(`✅ ${t.accountDeletedSuccess}`);
      } else {
        alert('❌ خطأ في حذف الحساب: ' + (result.message || 'سبب غير معروف'));
      }
    } catch (error) {
      console.error('❌ خطأ في حذف الحساب:', error);
      alert('حدث خطأ: ' + error.message);
    }
  };

  // الحصول على اسم الدور بناءً على اللغة
  const getRoleLabel = (role) => {
    const roleMap = {
      admin: language === 'ar' ? 'مدير' : 'Admin',
      technician: language === 'ar' ? 'فني' : 'Technician',
      customer: language === 'ar' ? 'عميل' : 'Customer',
      user: language === 'ar' ? 'مستخدم' : 'User'
    };
    return roleMap[role] || role;
  };

  // إضافة مركبة جديدة
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageVehicles')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!newVehicle.make || !newVehicle.model || !newVehicle.license_plate || !newVehicle.customer_id) {
        alert('الرجاء إدخال جميع البيانات المطلوبة: الماركة، الموديل، اللوحة، والعمل');
        return;
      }

      const response = await fetch(`${API_BASE}/vehicles.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          license_plate: newVehicle.license_plate,
          status: newVehicle.status,
          customer_id: newVehicle.customer_id
        })
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم: ' + responseText);
      }

      if (result.success) {
        await fetchData();
        
        setIsVehicleFormOpen(false);
        setNewVehicle({ 
          make: '', 
          model: '', 
          year: new Date().getFullYear(), 
          license_plate: '', 
          status: 'pending', 
          customer_id: '' 
        });
        
        alert(`✅ ${t.vehicleAdded}`);
        
        updateStats();

      } else {
        if (result.message && (result.message.includes('موجود') || result.message.includes('مسجل') || result.error_code === 'LICENSE_PLATE_EXISTS')) {
          alert(t.vehicleExists);
        } else {
          alert('❌ خطأ في إضافة المركبة: ' + (result.message || 'سبب غير معروف'));
        }
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة المركبة:', error);
      
      const newVehicleWithId = {
        ...newVehicle,
        id: 'v' + Date.now() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      
      setVehicles(prev => {
        const exists = prev.find(v => v.license_plate === newVehicle.license_plate);
        if (exists) {
          alert(t.vehicleExists);
          return prev;
        }
        return [...prev, newVehicleWithId];
      });
      
      setIsVehicleFormOpen(false);
      setNewVehicle({ 
        make: '', 
        model: '', 
        year: new Date().getFullYear(), 
        license_plate: '', 
        status: 'pending', 
        customer_id: '' 
      });
      
      alert(`✅ تم إضافة المركبة بنجاح (البيانات المحلية)`);
      
      updateStats();
    }
  };

  // تعديل مركبة
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageVehicles')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!editVehicle.make || !editVehicle.model || !editVehicle.license_plate || !editVehicle.customer_id) {
        alert('الرجاء إدخال جميع البيانات المطلوبة: الماركة، الموديل، اللوحة، والعمل');
        return;
      }

      const response = await fetch(`${API_BASE}/vehicles.php?id=${selectedVehicle.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          make: editVehicle.make,
          model: editVehicle.model,
          year: editVehicle.year,
          license_plate: editVehicle.license_plate,
          status: editVehicle.status,
          customer_id: editVehicle.customer_id
        })
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم: ' + responseText);
      }

      if (result.success) {
        await fetchData();
        
        setIsEditVehicleModalOpen(false);
        setEditVehicle({ 
          make: '', 
          model: '', 
          year: new Date().getFullYear(), 
          license_plate: '', 
          status: 'pending', 
          customer_id: '' 
        });
        setSelectedVehicle(null);
        
        alert(`✅ ${t.vehicleUpdated}`);
        
        updateStats();

      } else {
        alert('❌ خطأ في تحديث المركبة: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث المركبة:', error);
      
      setIsEditVehicleModalOpen(false);
      setEditVehicle({ 
        make: '', 
        model: '', 
        year: new Date().getFullYear(), 
        license_plate: '', 
        status: 'pending', 
        customer_id: '' 
      });
      setSelectedVehicle(null);
      
      alert(`❌ خطأ في تحديث المركبة: ${error.message}`);
      
      updateStats();
    }
  };

  // فتح نموذج تعديل المركبة
  const openEditVehicleModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      status: vehicle.status,
      customer_id: vehicle.customer_id
    });
    setIsEditVehicleModalOpen(true);
  };

  // إضافة خدمة جديدة
  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageServices')) {
      alert(t.accessDenied);
      return;
    }
    
    try {
      if (!newService.vehicle_id || !newService.type || !newService.description || !newService.technician || !newService.date || !newService.cost) {
        alert('الرجاء إدخال جميع البيانات المطلوبة: المركبة، نوع الخدمة، الوصف، الفني، التاريخ، والتكلفة');
        return;
      }

      const response = await fetch(`${API_BASE}/services.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          vehicle_id: newService.vehicle_id,
          type: newService.type,
          description: newService.description,
          technician: newService.technician,
          date: newService.date,
          cost: newService.cost,
          status: newService.status,
          payment_status: newService.payment_status
        })
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم: ' + responseText);
      }

      if (result.success) {
        await fetchData();
        
        setIsServiceFormOpen(false);
        setNewService({
          vehicle_id: '',
          type: '',
          description: '',
          technician: '',
          date: new Date().toISOString().split('T')[0],
          cost: 0,
          status: 'pending',
          payment_status: 'pending'
        });
        
        alert(`✅ ${t.serviceAdded}`);
        
        updateStats();

      } else {
        alert('❌ خطأ في إضافة الخدمة: ' + (result.message || 'سبب غير معروف'));
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة الخدمة:', error);
      
      const newServiceWithId = {
        ...newService,
        id: 's' + Date.now() + Math.random().toString(36).substr(2, 9),
        amount_paid: 0,
        remaining_amount: newService.cost,
        created_at: new Date().toISOString()
      };
      
      setServices(prev => {
        return [...prev, newServiceWithId];
      });
      
      setIsServiceFormOpen(false);
      setNewService({
        vehicle_id: '',
        type: '',
        description: '',
        technician: '',
        date: new Date().toISOString().split('T')[0],
        cost: 0,
        status: 'pending',
        payment_status: 'pending'
      });
      
      alert(`✅ تم إضافة الخدمة بنجاح (البيانات المحلية)`);
      
      updateStats();
    }
  };

  // دالة جلب الدفعات
  const fetchPayments = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE}/payments.php?service_id=${serviceId}`);
      if (response.ok) {
        const paymentsData = await response.json();
        setPayments(paymentsData);
      } else {
        console.error('Error fetching payments:', response.status);
        const servicePayments = demoData.payments.filter(p => p.service_id === serviceId);
        setPayments(servicePayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      const servicePayments = demoData.payments.filter(p => p.service_id === serviceId);
      setPayments(servicePayments);
    }
  };

  // فتح سجل الدفعات
  const openPaymentsHistory = (service) => {
    setSelectedServiceForPayments(service);
    fetchPayments(service.id);
    setIsPaymentsHistoryOpen(true);
  };

  // فتح نموذج تعديل دفعة فردية
  const openEditSinglePaymentModal = (payment) => {
    setSelectedPaymentForEdit(payment);
    setEditSinglePaymentData({
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      transactionId: payment.transaction_id || '',
      notes: payment.notes || ''
    });
    setIsEditPaymentModalOpen(true);
  };

  // معالجة تعديل دفعة فردية
  const handleEditSinglePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedPaymentForEdit) return;
    
    try {
      const amount = parseFloat(editSinglePaymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
        return;
      }

      const updateData = {
        payment_id: selectedPaymentForEdit.id,
        amount: amount,
        payment_method: editSinglePaymentData.paymentMethod,
        payment_date: editSinglePaymentData.paymentDate,
        transaction_id: editSinglePaymentData.paymentMethod !== 'cash' ? editSinglePaymentData.transactionId : '',
        notes: editSinglePaymentData.notes || ''
      };

      const response = await fetch(`${API_BASE}/payments.php`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedPayments = payments.map(payment => 
          payment.id === selectedPaymentForEdit.id 
            ? { 
                ...payment, 
                amount: amount,
                payment_method: editSinglePaymentData.paymentMethod,
                payment_date: editSinglePaymentData.paymentDate,
                transaction_id: editSinglePaymentData.paymentMethod !== 'cash' ? editSinglePaymentData.transactionId : '',
                notes: editSinglePaymentData.notes || ''
              }
            : payment
        );
        setPayments(updatedPayments);
        
        await fetchData();
        
        if (selectedServiceForPayments) {
          await fetchPayments(selectedServiceForPayments.id);
        }
        
        setIsEditPaymentModalOpen(false);
        setSelectedPaymentForEdit(null);
        alert(`✅ ${t.paymentUpdated}`);
      } else {
        alert('❌ خطأ في تحديث الدفعة: ' + (result.message || 'سبب غير معروف'));
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الدفعة:', error);
      alert('حدث خطأ في تحديث الدفعة: ' + error.message);
    }
  };

  // حذف دفعة
  const handleDeletePayment = async (paymentId) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      const response = await fetch(`${API_BASE}/payments.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedPayments = payments.filter(payment => payment.id !== paymentId);
        setPayments(updatedPayments);
        
        await fetchData();
        
        if (selectedServiceForPayments) {
          await fetchPayments(selectedServiceForPayments.id);
        }
        
        alert(`✅ ${t.paymentDeleted}`);
      } else {
        alert('خطأ في حذف الدفعة: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('حدث خطأ في حذف الدفعة: ' + error.message);
    }
  };

  // حذف خدمة
  const handleDeleteService = async (serviceId) => {
    if (!confirm(t.confirmServiceDelete)) return;
    
    try {
      const response = await fetch(`${API_BASE}/services.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: serviceId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedServices = services.filter(service => service.id !== serviceId);
        setServices(updatedServices);
        
        const updatedPayments = payments.filter(payment => payment.service_id !== serviceId);
        setPayments(updatedPayments);
        
        alert(t.serviceDeleted);
      } else {
        alert('خطأ في حذف الخدمة: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('حدث خطأ في حذف الخدمة: ' + error.message);
    }
  };

  // حذف مركبة
  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm(t.confirmVehicleDelete)) return;
    
    try {
      const response = await fetch(`${API_BASE}/vehicles.php?id=${vehicleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedVehicles = vehicles.filter(vehicle => vehicle.id !== vehicleId);
        setVehicles(updatedVehicles);
        
        const updatedServices = services.filter(service => service.vehicle_id !== vehicleId);
        setServices(updatedServices);
        
        const serviceIdsToDelete = services.filter(s => s.vehicle_id === vehicleId).map(s => s.id);
        const updatedPayments = payments.filter(payment => !serviceIdsToDelete.includes(payment.service_id));
        setPayments(updatedPayments);
        
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
          setSelectedVehicle(null);
        }
        
        alert(t.vehicleDeleted);
      } else {
        alert('خطأ في حذف المركبة: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('حدث خطأ في حذف المركبة: ' + error.message);
    }
  };

  // حذف عميل
  const handleDeleteCustomer = async (customerId) => {
    if (!confirm(t.confirmCustomerDelete)) return;
    
    try {
      const response = await fetch(`${API_BASE}/customers.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: customerId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedCustomers = customers.filter(customer => customer.id !== customerId);
        setCustomers(updatedCustomers);
        
        const updatedVehicles = vehicles.filter(vehicle => vehicle.customer_id !== customerId);
        setVehicles(updatedVehicles);
        
        const vehicleIdsToDelete = vehicles.filter(v => v.customer_id === customerId).map(v => v.id);
        const updatedServices = services.filter(service => !vehicleIdsToDelete.includes(service.vehicle_id));
        setServices(updatedServices);
        
        const serviceIdsToDelete = services.filter(s => vehicleIdsToDelete.includes(s.vehicle_id)).map(s => s.id);
        const updatedPayments = payments.filter(payment => !serviceIdsToDelete.includes(payment.service_id));
        setPayments(updatedPayments);
        
        if (selectedCustomer && selectedCustomer.id === customerId) {
          setSelectedCustomer(null);
        }
        
        alert(t.customerDeleted);
      } else {
        alert('خطأ في حذف العميل: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('حدث خطأ في حذف العميل: ' + error.message);
    }
  };

  // دالة طباعة إيصال الدفع
  const handlePrintReceipt = (payment, service) => {
    if (!service) return;
    
    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
    const customer = vehicle ? customers.find(c => c.id === vehicle.customer_id) : null;
    
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${t.receipt} - ${payment.id}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px; margin: 0; }
              .receipt-container { 
                  background: white;
                  border-radius: 16px;
                  padding: 40px; 
                  max-width: 700px; 
                  margin: 0 auto; 
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  position: relative;
                  overflow: hidden;
              }
              .receipt-container::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 6px;
                  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              }
              .header { text-align: center; margin-bottom: 40px; }
              .logo { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 10px; }
              .app-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
              .receipt-badge { 
                  background: #eff6ff; 
                  color: #1d4ed8; 
                  padding: 6px 16px; 
                  border-radius: 20px; 
                  font-weight: bold; 
                  font-size: 14px;
                  display: inline-block;
                  border: 1px solid #dbeafe;
              }
              
              .meta-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 12px;
                  border: 1px solid #e2e8f0;
              }
              .meta-item { display: flex; flex-direction: column; }
              .meta-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
              .meta-value { font-size: 15px; font-weight: 600; color: #0f172a; }
              
              .details-section { margin-bottom: 30px; }
              .detail-row { 
                  display: flex; 
                  justify-content: space-between; 
                  padding: 16px 0; 
                  border-bottom: 1px solid #f1f5f9;
              }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #475569; font-weight: 500; }
              .detail-value { font-weight: 600; color: #0f172a; text-align: ${language === 'ar' ? 'left' : 'right'}; max-width: 60%; }
              
              .amount-box {
                  background: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 12px;
                  padding: 24px;
                  text-align: center;
                  margin: 30px 0;
              }
              .amount-label { color: #166534; font-size: 14px; margin-bottom: 4px; font-weight: 500; }
              .amount-value { color: #15803d; font-size: 36px; font-weight: 800; letter-spacing: -1px; }
              .payment-method { color: #166534; font-size: 13px; margin-top: 4px; opacity: 0.8; }
              
              .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
              .signature-box { text-align: center; }
              .signature-line { width: 200px; border-top: 2px solid #e2e8f0; margin-top: 50px; }
              .signature-label { color: #94a3b8; font-size: 13px; margin-top: 8px; font-weight: 500; }
              
              .thank-you { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 13px; }

              @media print {
                  body { background: white; padding: 0; }
                  .receipt-container { box-shadow: none; border: none; padding: 0; max-width: 100%; border-radius: 0; }
                  .receipt-container::before { display: none; }
                  .no-print { display: none; }
                  .amount-box { border: 1px solid #ddd; background: #f9f9f9; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div class="logo">
                      <img src="${t.logo}" alt="Logo" style="height: 120px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<span style=\'font-size:80px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;\'>🚗</span>');">
                      ${t.appName}
                  </div>
                  <div class="app-subtitle">${t.appSubtitle}</div>
                  <div class="receipt-badge">${t.garageReceipt}</div>
              </div>
              
              <div class="meta-grid">
                  <div class="meta-item">
                      <span class="meta-label">${t.receiptNumber}</span>
                      <span class="meta-value">#${payment.id}</span>
                  </div>
                  <div class="meta-item" style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <span class="meta-label">${t.date}</span>
                      <span class="meta-value">${payment.payment_date}</span>
                  </div>
              </div>
              
              <div class="details-section">
                  <div class="detail-row">
                      <span class="detail-label">${t.receivedFrom}</span>
                      <span class="detail-value">${customer ? customer.name : (language === 'ar' ? 'عميل نقدي' : 'Cash Customer')}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">${t.forService}</span>
                      <span class="detail-value">${getServiceTypeLabel(service.type)}</span>
                  </div>
                  ${vehicle ? `
                  <div class="detail-row">
                      <span class="detail-label">${language === 'ar' ? 'المركبة' : 'Vehicle'}</span>
                      <span class="detail-value">${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                      <span class="detail-label">${t.remaining}</span>
                      <span class="detail-value">$${parseFloat(service.remaining_amount || 0).toFixed(2)}</span>
                      <span class="detail-value" style="color: #dc2626;">$${parseFloat(service.remaining_amount || 0).toFixed(2)}</span>
                  </div>
                  ${payment.notes ? `
                  <div class="detail-row">
                      <span class="detail-label">${t.notes}</span>
                      <span class="detail-value">${payment.notes}</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="amount-box">
                  <div class="amount-label">${t.paidAmount}</div>
                  <div class="amount-value">$${parseFloat(payment.amount).toFixed(2)}</div>
                  <div class="payment-method">
                      ${payment.payment_method === 'cash' ? t.cash : payment.payment_method === 'card' ? t.card : payment.payment_method === 'transfer' ? t.transfer : t.check}
                      ${payment.transaction_id ? ` - ${payment.transaction_id}` : ''}
                  </div>
              </div>
              
              <div class="footer">
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${t.signature}</div>
                  </div>
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${language === 'ar' ? 'ختم الشركة' : 'Company Stamp'}</div>
                  </div>
              </div>
              
              <div class="thank-you">
                  ${language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}
              </div>
          </div>
          <script>
              window.onload = function() { window.print(); }
              window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  // دالة طباعة فاتورة الخدمة
  const handlePrintServiceInvoice = (service) => {
    if (!service) return;
    
    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
    const customer = vehicle ? customers.find(c => c.id === vehicle.customer_id) : null;
    
    const totalAmount = parseFloat(service.cost);
    const taxRate = 0.05;
    const subtotal = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - subtotal;

    const invoiceContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'فاتورة' : 'Invoice'} - ${service.id}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: white; padding: 20px; margin: 0; color: #1f2937; }
              .invoice-container { 
                  max-width: 800px; 
                  margin: 0 auto; 
                  border: 1px solid #e5e7eb;
                  padding: 40px;
              }
              .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
              .logo-section { flex: 1; }
              .logo { font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 4px; }
              .invoice-title { font-size: 32px; font-weight: bold; color: #3b82f6; text-transform: uppercase; text-align: ${language === 'ar' ? 'left' : 'right'}; }
              
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .info-box h3 { font-size: 14px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
              .info-label { font-weight: 600; color: #4b5563; }
              
              .service-details { margin-bottom: 40px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background: #f3f4f6; padding: 12px; text-align: ${language === 'ar' ? 'right' : 'left'}; font-weight: 600; color: #374151; }
              .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
              
              .totals { margin-left: auto; width: 300px; }
              .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .total-row.final { border-bottom: none; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #3b82f6; margin-top: 10px; padding-top: 10px; }
              
              .footer { margin-top: 60px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              
              @media print {
                  body { padding: 0; }
                  .invoice-container { border: none; padding: 0; }
                  .no-print { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <div class="header">
                  <div class="logo-section">
                      <div class="logo">
                          <img src="${t.logo}" alt="Logo" style="height: 120px; vertical-align: middle; margin-${language === 'ar' ? 'left' : 'right'}: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<span style=\'font-size:80px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;\'>🚗</span>');">
                          ${t.appName}
                      </div>
                      <div style="color: #6b7280;">${t.appSubtitle}</div>
                  </div>
                  <div>
                      <div class="invoice-title">${language === 'ar' ? 'فاتورة' : 'INVOICE'}</div>
                      <div style="text-align: ${language === 'ar' ? 'left' : 'right'}; margin-top: 10px;">
                          <div>#${service.id}</div>
                          <div>${service.date}</div>
                      </div>
                  </div>
              </div>
              
              <div class="info-grid">
                  <div class="info-box">
                      <h3>${language === 'ar' ? 'معلومات العميل' : 'Bill To'}</h3>
                      <div class="info-row"><span class="info-label">${t.name}:</span> <span>${customer ? customer.name : '-'}</span></div>
                      <div class="info-row"><span class="info-label">${t.phone}:</span> <span>${customer ? customer.phone : '-'}</span></div>
                      <div class="info-row"><span class="info-label">${t.address}:</span> <span>${customer ? customer.address : '-'}</span></div>
                  </div>
                  <div class="info-box">
                      <h3>${language === 'ar' ? 'معلومات المركبة' : 'Vehicle Info'}</h3>
                      <div class="info-row"><span class="info-label">${t.makeModel}:</span> <span>${vehicle ? `${vehicle.make} ${vehicle.model}` : '-'}</span></div>
                      <div class="info-row"><span class="info-label">${t.licensePlate}:</span> <span>${vehicle ? vehicle.license_plate : '-'}</span></div>
                      <div class="info-row"><span class="info-label">${t.year}:</span> <span>${vehicle ? vehicle.year : '-'}</span></div>
                  </div>
              </div>
              
              <div class="service-details">
                  <table class="table">
                      <thead>
                          <tr>
                              <th>${language === 'ar' ? 'الوصف' : 'Description'}</th>
                              <th>${language === 'ar' ? 'الفني' : 'Technician'}</th>
                              <th>${language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td>
                                  <strong>${getServiceTypeLabel(service.type)}</strong>
                                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${service.description}</div>
                              </td>
                              <td>${service.technician}</td>
                              <td>$${parseFloat(service.cost).toFixed(2)}</td>
                              <td>$${subtotal.toFixed(2)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              
              <div class="totals">
                  <div class="total-row">
                      <span>${language === 'ar' ? 'المبلغ قبل الضريبة' : 'Subtotal'}</span>
                      <span>$${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                      <span>${language === 'ar' ? 'الضريبة (5%)' : 'Tax (5%)'}</span>
                      <span>$${taxAmount.toFixed(2)}</span>
                  </div>
                  <div class="total-row final">
                      <span>${language === 'ar' ? 'المجموع' : 'Total'}</span>
                      <span>$${parseFloat(service.cost).toFixed(2)}</span>
                      <span>$${totalAmount.toFixed(2)}</span>
                  </div>
              </div>
              
              <div class="footer">
                  <p>${language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</p>
              </div>
          </div>
          <script>
              window.onload = function() { window.print(); }
              window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  // معالجة الدفع
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedService) return;
    
    try {
      const paymentAmount = parseFloat(paymentData.amount) || 0;
      const serviceCost = parseFloat(selectedService.cost) || 0;
      const currentPaid = parseFloat(selectedService.amount_paid) || 0;
      const maxAmount = serviceCost - currentPaid;
      
      if (paymentAmount <= 0) {
        alert('يرجى إدخال مبلغ صحيح للدفع');
        return;
      }

      if (paymentAmount > maxAmount) {
        alert(`لا يمكن دفع أكثر من $${maxAmount} (المتبقي)`);
        return;
      }

      const paymentDataToSend = {
        service_id: selectedService.id,
        amount: paymentAmount,
        payment_method: paymentData.paymentMethod,
        transaction_id: paymentData.paymentMethod !== 'cash' ? paymentData.transactionId : '',
        notes: paymentData.notes || '',
        payment_date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch(`${API_BASE}/payments.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentDataToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل الاتصال: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        
        setIsPaymentOpen(false);
        setSelectedService(null);
        setPaymentData({
          amount: 0,
          paymentMethod: 'cash',
          transactionId: '',
          notes: ''
        });
        
        if (result.payment_status === 'partial') {
          alert(`✅ ${t.paymentPartialSuccess}\n${t.paid}: $${paymentAmount}\n${t.remaining}: $${result.remaining_amount}`);
        } else {
          alert(`✅ ${t.paymentFullSuccess}`);
        }
      } else {
        alert('❌ خطأ في تسجيل الدفع: ' + (result.message || 'سبب غير معروف'));
      }
    } catch (error) {
      console.error('❌ خطأ في عملية الدفع:', error);
      alert('حدث خطأ في تسجيل الدفع: ' + error.message);
    }
  };

  // معالجة الدفع الشامل
  const handleBulkPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) return;
    
    try {
      const paymentAmount = parseFloat(bulkPaymentData.amount) || 0;
      
      const vehicleServices = getServicesForVehicle(selectedVehicle.id);
      
      const servicesWithRemaining = vehicleServices.filter(service => {
        const remaining = parseFloat(service.remaining_amount) || 0;
        return remaining > 0 && service.payment_status !== 'paid';
      });
      
      if (servicesWithRemaining.length === 0) {
        alert('لا توجد خدمات معلقة الدفع لهذه المركبة');
        setIsBulkPaymentOpen(false);
        return;
      }
      
      const totalRemaining = servicesWithRemaining.reduce((sum, service) => {
        const remaining = parseFloat(service.remaining_amount) || 0;
        return sum + remaining;
      }, 0);
      
      if (paymentAmount <= 0) {
        alert('يرجى إدخال مبلغ صحيح للدفع');
        return;
      }

      if (paymentAmount > totalRemaining) {
        alert(`لا يمكن دفع أكثر من $${totalRemaining.toFixed(2)} (إجمالي المبلغ المتبقي)`);
        return;
      }
      
      if (paymentAmount === totalRemaining) {
        let processedServices = 0;
        let totalPaid = 0;
        
        for (const service of servicesWithRemaining) {
          const serviceRemaining = parseFloat(service.remaining_amount) || parseFloat(service.cost);
          
          const paymentDataToSend = {
            service_id: service.id,
            amount: serviceRemaining,
            payment_method: bulkPaymentData.paymentMethod,
            transaction_id: bulkPaymentData.paymentMethod !== 'cash' ? bulkPaymentData.transactionId : '',
            notes: `${bulkPaymentData.notes || ''} - دفعة شاملة لخدمات المركبة`,
            payment_date: new Date().toISOString().split('T')[0]
          };

          const response = await fetch(`${API_BASE}/payments.php`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(paymentDataToSend)
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              processedServices++;
              totalPaid += serviceRemaining;
            }
          }
        }
        
        await fetchData();
        
        setIsBulkPaymentOpen(false);
        setBulkPaymentData({
          amount: 0,
          paymentMethod: 'cash',
          transactionId: '',
          notes: ''
        });
        
        alert(`✅ ${t.bulkPaymentFullSuccess}\n${t.servicesCount}: ${processedServices}\n${t.totalPaid}: $${totalPaid.toFixed(2)}`);
        
      } else {
        const paymentRatio = paymentAmount / totalRemaining;
        let processedServices = 0;
        let totalPaid = 0;
        
        for (const service of servicesWithRemaining) {
          const serviceRemaining = parseFloat(service.remaining_amount) || parseFloat(service.cost);
          const servicePayment = serviceRemaining * paymentRatio;
          
          const paymentDataToSend = {
            service_id: service.id,
            amount: servicePayment,
            payment_method: bulkPaymentData.paymentMethod,
            transaction_id: bulkPaymentData.paymentMethod !== 'cash' ? bulkPaymentData.transactionId : '',
            notes: `${bulkPaymentData.notes || ''} - دفعة جزئية شاملة`,
            payment_date: new Date().toISOString().split('T')[0]
          };

          const response = await fetch(`${API_BASE}/payments.php`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(paymentDataToSend)
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              processedServices++;
              totalPaid += servicePayment;
            }
          }
        }
        
        await fetchData();
        
        setIsBulkPaymentOpen(false);
        setBulkPaymentData({
          amount: 0,
          paymentMethod: 'cash',
          transactionId: '',
          notes: ''
        });
        
        alert(`✅ ${t.bulkPaymentPartialSuccess}\n${t.servicesCount}: ${processedServices}\n${t.totalPaid}: $${totalPaid.toFixed(2)}\n${t.remaining}: $${(totalRemaining - paymentAmount).toFixed(2)}`);
      }
      
    } catch (error) {
      console.error('❌ خطأ في عملية الدفع الشامل:', error);
      alert('حدث خطأ في تسجيل الدفع الشامل: ' + error.message);
    }
  };

  // فتح نموذج الدفع
  const openPaymentModal = (service) => {
    setSelectedService(service);
    const remaining = parseFloat(service.remaining_amount) || 0;
    setPaymentData({
      amount: remaining,
      paymentMethod: 'cash',
      transactionId: '',
      notes: ''
    });
    setIsPaymentOpen(true);
  };

  // فتح نموذج الدفع الشامل
  const openBulkPaymentModal = () => {
    if (!selectedVehicle) return;
    
    const vehicleServices = getServicesForVehicle(selectedVehicle.id);
    const servicesWithRemaining = vehicleServices.filter(service => {
      const remaining = parseFloat(service.remaining_amount) || 0;
      return remaining > 0 && service.payment_status !== 'paid';
    });
    
    if (servicesWithRemaining.length === 0) {
      alert(t.noServicesForBulkPayment);
      return;
    }
    
    const totalRemaining = servicesWithRemaining.reduce((sum, service) => {
      const remaining = parseFloat(service.remaining_amount) || 0;
      return sum + remaining;
    }, 0);
    
    setBulkPaymentData({
      amount: totalRemaining,
      paymentMethod: 'cash',
      transactionId: '',
      notes: `دفع شامل لجميع خدمات ${selectedVehicle.make} ${selectedVehicle.model}`
    });
    setIsBulkPaymentOpen(true);
  };

  // دالة للحصول على الإيرادات المدفوعة للعملاء في فترة زمنية
  const getPaidRevenuesByCustomer = () => {
    const paidRevenues = {};
    
    customers.forEach(customer => {
      const customerVehicles = getCustomerVehicles(customer.id);
      const customerServices = getCustomerServices(customer.id);
      
      const filteredServices = customerServices.filter(service => {
        if (!revenueReportDateRange.startDate && !revenueReportDateRange.endDate) {
          return true;
        }
        
        const serviceDate = new Date(service.date);
        const startDate = revenueReportDateRange.startDate ? new Date(revenueReportDateRange.startDate) : new Date('1900-01-01');
        const endDate = revenueReportDateRange.endDate ? new Date(revenueReportDateRange.endDate) : new Date();
        
        endDate.setHours(23, 59, 59, 999);
        
        return serviceDate >= startDate && serviceDate <= endDate;
      });
      
      const paidRevenue = filteredServices.reduce((sum, service) => {
        const paid = parseFloat(service.amount_paid) || 0;
        return sum + paid;
      }, 0);
      
      if (paidRevenue > 0) {
        paidRevenues[customer.id] = {
          customer: customer,
          vehicles: customerVehicles,
          services: filteredServices,
          totalPaidRevenue: paidRevenue,
          servicesCount: filteredServices.length
        };
      }
    });
    
    return paidRevenues;
  };

  // دالة للحصول على الإيرادات المعلقة للعملاء في فترة زمنية
  const getPendingRevenuesByCustomer = () => {
    const pendingRevenues = {};
    
    customers.forEach(customer => {
      const customerVehicles = getCustomerVehicles(customer.id);
      const customerServices = getCustomerServices(customer.id);
      
      const filteredServices = customerServices.filter(service => {
        if (!revenueReportDateRange.startDate && !revenueReportDateRange.endDate) {
          return true;
        }
        
        const serviceDate = new Date(service.date);
        const startDate = revenueReportDateRange.startDate ? new Date(revenueReportDateRange.startDate) : new Date('1900-01-01');
        const endDate = revenueReportDateRange.endDate ? new Date(revenueReportDateRange.endDate) : new Date();
        
        endDate.setHours(23, 59, 59, 999);
        
        return serviceDate >= startDate && serviceDate <= endDate;
      });
      
      const pendingRevenue = filteredServices.reduce((sum, service) => {
        const remaining = parseFloat(service.remaining_amount) || 0;
        return sum + remaining;
      }, 0);
      
      if (pendingRevenue > 0) {
        pendingRevenues[customer.id] = {
          customer: customer,
          vehicles: customerVehicles,
          services: filteredServices,
          totalPendingRevenue: pendingRevenue,
          servicesCount: filteredServices.length
        };
      }
    });
    
    return pendingRevenues;
  };

  // دالة للحصول على الإيرادات الإجمالية للعملاء في فترة زمنية
  const getTotalRevenuesByCustomer = () => {
    const totalRevenues = {};
    
    customers.forEach(customer => {
      const customerVehicles = getCustomerVehicles(customer.id);
      const customerServices = getCustomerServices(customer.id);
      
      const filteredServices = customerServices.filter(service => {
        if (!revenueReportDateRange.startDate && !revenueReportDateRange.endDate) {
          return true;
        }
        
        const serviceDate = new Date(service.date);
        const startDate = revenueReportDateRange.startDate ? new Date(revenueReportDateRange.startDate) : new Date('1900-01-01');
        const endDate = revenueReportDateRange.endDate ? new Date(revenueReportDateRange.endDate) : new Date();
        
        endDate.setHours(23, 59, 59, 999);
        
        return serviceDate >= startDate && serviceDate <= endDate;
      });
      
      const totalRevenue = filteredServices.reduce((sum, service) => {
        const cost = parseFloat(service.cost) || 0;
        return sum + cost;
      }, 0);
      
      const paidRevenue = filteredServices.reduce((sum, service) => {
        const paid = parseFloat(service.amount_paid) || 0;
        return sum + paid;
      }, 0);
      
      const pendingRevenue = filteredServices.reduce((sum, service) => {
        const remaining = parseFloat(service.remaining_amount) || 0;
        return sum + remaining;
      }, 0);
      
      if (totalRevenue > 0) {
        totalRevenues[customer.id] = {
          customer: customer,
          vehicles: customerVehicles,
          services: filteredServices,
          totalRevenue: totalRevenue,
          paidRevenue: paidRevenue,
          pendingRevenue: pendingRevenue,
          servicesCount: filteredServices.length
        };
      }
    });
    
    return totalRevenues;
  };
  // دالة تصدير البيانات إلى CSV (Excel)
  const exportToCSV = (rows, filename) => {
    const processRow = (row) => {
      return row.map(val => {
        if (val === null || val === undefined) return '';
        let result = String(val).replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0) {
          result = '"' + result + '"';
        }
        return result;
      }).join(',');
    };

    const csvContent = '\uFEFF' + rows.map(processRow).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // دالة تصدير البيانات إلى Excel (XML) لدعم تعدد الأوراق
  const exportToExcel = (sheets, filename) => {
    let workbookXML = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
 </Styles>`;

    for (const [sheetName, rows] of Object.entries(sheets)) {
      workbookXML += `<Worksheet ss:Name="${sheetName}">
  <Table>`;
      
      for (const row of rows) {
        workbookXML += `<Row>`;
        for (const cell of row) {
          let cellValue = cell;
          let type = 'String';
          
          if (typeof cell === 'number') {
            type = 'Number';
          } else if (cell === null || cell === undefined) {
            cellValue = '';
          }
          
          // Escape XML characters
          const escapedValue = String(cellValue)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

          workbookXML += `<Cell><Data ss:Type="${type}">${escapedValue}</Data></Cell>`;
        }
        workbookXML += `</Row>`;
      }
      
      workbookXML += `</Table>
 </Worksheet>`;
    }

    workbookXML += `</Workbook>`;

    const blob = new Blob([workbookXML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".xls");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصدير تقرير الإيرادات
  const handleExportRevenueReport = () => {
    const paidRevenues = getPaidRevenuesByCustomer();
    const pendingRevenues = getPendingRevenuesByCustomer();
    const totalRevenues = getTotalRevenuesByCustomer();
    
    const totalPaidRevenue = Object.values(paidRevenues).reduce((sum, item) => sum + item.totalPaidRevenue, 0);
    const totalPendingRevenue = Object.values(pendingRevenues).reduce((sum, item) => sum + item.totalPendingRevenue, 0);
    const totalRevenue = Object.values(totalRevenues).reduce((sum, item) => sum + item.totalRevenue, 0);

    // الورقة الأولى: التقرير الرئيسي
    const mainRows = [
      [t.revenueReport],
      [t.reportDate, new Date().toLocaleDateString()],
      [],
      [t.revenueReportTitle],
      [t.totalRevenue, totalRevenue.toFixed(2)],
      [t.paidRevenue, totalPaidRevenue.toFixed(2)],
      [t.pendingRevenue, totalPendingRevenue.toFixed(2)],
      [],
      [t.paidRevenue],
      ['#', t.name, t.phone, t.servicesCount, t.paidAmount]
    ];

    let i = 1;
    Object.values(paidRevenues).forEach(item => {
      mainRows.push([
        i++,
        item.customer.name,
        item.customer.phone,
        item.servicesCount,
        item.totalPaidRevenue.toFixed(2)
      ]);
    });

    mainRows.push([]);
    mainRows.push([t.pendingRevenue]);
    mainRows.push(['#', t.name, t.phone, t.servicesCount, t.pendingAmount]);

    i = 1;
    Object.values(pendingRevenues).forEach(item => {
      mainRows.push([
        i++,
        item.customer.name,
        item.customer.phone,
        item.servicesCount,
        item.totalPendingRevenue.toFixed(2)
      ]);
    });

    // الورقة الثانية: تفاصيل الخدمات المعلقة
    const pendingServicesRows = [];
    pendingServicesRows.push([language === 'ar' ? 'تفاصيل الخدمات المعلقة' : 'Pending Services Details']);
    pendingServicesRows.push([
      language === 'ar' ? 'العميل' : 'Customer',
      language === 'ar' ? 'المركبة' : 'Vehicle',
      t.serviceType,
      t.date,
      t.cost,
      t.paid,
      t.remaining
    ]);

    Object.values(pendingRevenues).forEach(item => {
      item.services.forEach(service => {
        const vehicle = vehicles.find(v => v.id === service.vehicle_id);
        const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '-';
        const remaining = parseFloat(service.remaining_amount) || 0;
        
        pendingServicesRows.push([
          item.customer.name,
          vehicleName,
          getServiceTypeLabel(service.type),
          service.date,
          service.cost,
          service.amount_paid || 0,
          remaining.toFixed(2)
        ]);
      });
    });

    // الورقة الثالثة: تفاصيل الخدمات المكتملة
    const completedServicesRows = [];
    completedServicesRows.push([language === 'ar' ? 'تفاصيل الخدمات المكتملة' : 'Completed Services Details']);
    completedServicesRows.push([
      language === 'ar' ? 'العميل' : 'Customer',
      language === 'ar' ? 'المركبة' : 'Vehicle',
      t.serviceType,
      t.date,
      t.cost,
      t.paid,
      t.remaining
    ]);

    customers.forEach(customer => {
      const customerServices = getCustomerServices(customer.id);
      const filteredServices = customerServices.filter(service => {
        if (service.status !== 'completed') return false;
        
        if (!revenueReportDateRange.startDate && !revenueReportDateRange.endDate) return true;
        
        const serviceDate = new Date(service.date);
        const startDate = revenueReportDateRange.startDate ? new Date(revenueReportDateRange.startDate) : new Date('1900-01-01');
        const endDate = revenueReportDateRange.endDate ? new Date(revenueReportDateRange.endDate) : new Date();
        endDate.setHours(23, 59, 59, 999);
        
        return serviceDate >= startDate && serviceDate <= endDate;
      });

      filteredServices.forEach(service => {
        const vehicle = vehicles.find(v => v.id === service.vehicle_id);
        const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '-';
        const remaining = parseFloat(service.remaining_amount) || 0;
        
        completedServicesRows.push([customer.name, vehicleName, getServiceTypeLabel(service.type), service.date, service.cost, service.amount_paid || 0, remaining.toFixed(2)]);
      });
    });

    const sheets = {
      [language === 'ar' ? 'التقرير العام' : 'General Report']: mainRows,
      [language === 'ar' ? 'الخدمات المعلقة' : 'Pending Services']: pendingServicesRows,
      [language === 'ar' ? 'الخدمات المكتملة' : 'Completed Services']: completedServicesRows
    };

    exportToExcel(sheets, `revenue_report_${new Date().toISOString().split('T')[0]}`);
  };

  // تصدير تقرير المركبة
  const handleExportVehicleReport = () => {
    if (!selectedVehicle) return;
    const filteredServices = getFilteredServicesForVehicle(selectedVehicle.id);
    const customer = getCustomerById(selectedVehicle.customer_id);
    
    const rows = [
      [t.vehicleReport],
      [t.reportDate, new Date().toLocaleDateString()],
      [],
      [t.vehicleInfo],
      [t.makeModel, `${selectedVehicle.make} ${selectedVehicle.model}`],
      [t.year, selectedVehicle.year],
      [t.licensePlate, selectedVehicle.license_plate],
      [t.status, selectedVehicle.status],
      [],
      [t.customerInfo],
      [t.name, customer ? customer.name : '-'],
      [t.phone, customer ? customer.phone : '-'],
      [],
      [t.serviceHistory],
      [t.serviceType, t.date, t.technician, t.status, t.paymentStatus, t.cost, t.paid, t.remaining]
    ];

    filteredServices.forEach(service => {
      rows.push([
        getServiceTypeLabel(service.type),
        service.date,
        service.technician,
        service.status,
        service.payment_status,
        service.cost,
        service.amount_paid || 0,
        service.remaining_amount || service.cost
      ]);
    });

    rows.push([]);
    rows.push([t.totalCost, getFilteredTotalCostForVehicle(selectedVehicle.id).toFixed(2)]);

    exportToCSV(rows, `vehicle_report_${selectedVehicle.license_plate}`);
  };

  // تصدير تقرير العميل
  const handleExportCustomerReport = () => {
    if (!selectedCustomer) return;
    const customerStats = getCustomerStats(selectedCustomer.id);
    const filteredServices = getFilteredCustomerServices(selectedCustomer.id);

    const rows = [
      [t.customerReport],
      [t.reportDate, new Date().toLocaleDateString()],
      [],
      [t.customerInfo],
      [t.name, selectedCustomer.name],
      [t.phone, selectedCustomer.phone],
      [t.email, selectedCustomer.email || '-'],
      [],
      [t.customerStats],
      [t.totalVehicles, customerStats.totalVehicles],
      [t.totalServices, customerStats.totalServices],
      [t.totalCost, customerStats.totalCost.toFixed(2)],
      [t.totalPaid, customerStats.totalPaid.toFixed(2)],
      [t.amountDue, customerStats.filteredRemaining.toFixed(2)],
      [],
      [t.serviceHistory],
      [t.vehicles, t.serviceType, t.date, t.technician, t.cost, t.paid, t.remaining]
    ];

    filteredServices.forEach(service => {
      const vehicle = vehicles.find(v => v.id === service.vehicle_id);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '-';
      rows.push([
        vehicleName,
        getServiceTypeLabel(service.type),
        service.date,
        service.technician,
        service.cost,
        service.amount_paid || 0,
        service.remaining_amount || service.cost
      ]);
    });

    exportToCSV(rows, `customer_report_${selectedCustomer.name}`);
  };

  // دالة لطباعة تقرير الإيرادات
  const handlePrintRevenueReport = () => {
    const paidRevenues = getPaidRevenuesByCustomer();
    const pendingRevenues = getPendingRevenuesByCustomer();
    const totalRevenues = getTotalRevenuesByCustomer();
    
    const totalPaidRevenue = Object.values(paidRevenues).reduce((sum, item) => sum + item.totalPaidRevenue, 0);
    const totalPendingRevenue = Object.values(pendingRevenues).reduce((sum, item) => sum + item.totalPendingRevenue, 0);
    const totalRevenue = Object.values(totalRevenues).reduce((sum, item) => sum + item.totalRevenue, 0);
    
    const dateRangeText = revenueReportDateRange.startDate && revenueReportDateRange.endDate 
      ? `${language === 'ar' ? 'للفترة من' : 'For period from'} ${revenueReportDateRange.startDate} ${language === 'ar' ? 'إلى' : 'to'} ${revenueReportDateRange.endDate}`
      : revenueReportDateRange.startDate 
        ? `${language === 'ar' ? 'من تاريخ' : 'From'} ${revenueReportDateRange.startDate}`
        : revenueReportDateRange.endDate 
          ? `${language === 'ar' ? 'حتى تاريخ' : 'Until'} ${revenueReportDateRange.endDate}`
          : `${language === 'ar' ? 'جميع الفترات' : 'All periods'}`;

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'تقرير الإيرادات' : 'Revenue Report'} - GaragePro</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 10px; 
              }
              .date-range {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
                  margin: 20px 0;
                  text-align: center;
                  font-weight: bold;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 20px 0; 
              }
              th, td { 
                  border: 1px solid #ddd; 
                  padding: 12px; 
                  text-align: ${language === 'ar' ? 'right' : 'left'}; 
              }
              th { 
                  background-color: #f2f2f2; 
                  font-weight: bold;
              }
              .total-row { 
                  font-weight: bold; 
                  background-color: #f8f9fa; 
              }
              .customer-name {
                  font-weight: 600;
                  color: #1e40af;
              }
              .paid-amount {
                  color: #16a34a;
                  font-weight: bold;
              }
              .pending-amount {
                  color: #ef4444;
                  font-weight: bold;
              }
              .total-amount {
                  color: #3b82f6;
                  font-weight: bold;
              }
              .no-data {
                  text-align: center;
                  padding: 40px;
                  color: #6b7280;
                  font-size: 18px;
              }
              .summary {
                  background: #f0f9ff;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                  border: 1px solid #bae6fd;
              }
              .paid-summary {
                  background: #f0fdf4;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                  border: 1px solid #bbf7d0;
              }
              .pending-summary {
                  background: #fef2f2;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                  border: 1px solid #fecaca;
              }
              @media print {
                  .no-print { display: none; }
                  body { margin: 0; }
                  .header { border-bottom: 2px solid #000; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 80px; margin-bottom: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div style=\'font-size:60px; margin-bottom: 10px;\'>🚗</div>');">
              <h1>${language === 'ar' ? 'تقرير الإيرادات' : 'Revenue Report'}</h1>
              <p>${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              <div class="date-range">${dateRangeText}</div>
          </div>
          
          <div class="summary">
              <h3>${language === 'ar' ? 'ملخص الإيرادات الإجمالي' : 'Total Revenue Summary'}</h3>
              <table>
                  <tr>
                      <td>${language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}:</td>
                      <td class="total-amount">$${totalRevenue.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'الإيرادات المدفوعة' : 'Paid Revenue'}:</td>
                      <td class="paid-amount">$${totalPaidRevenue.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'الإيرادات المعلقة' : 'Pending Revenue'}:</td>
                      <td class="pending-amount">$${totalPendingRevenue.toFixed(2)}</td>
                  </tr>
              </table>
          </div>
          
          <div class="paid-summary">
              <h3>${language === 'ar' ? 'الإيرادات المدفوعة' : 'Paid Revenue'}</h3>
              <p>${language === 'ar' ? 'عدد العملاء الذين سددوا إيرادات' : 'Number of customers who paid revenue'}: ${Object.keys(paidRevenues).length}</p>
              <p>${language === 'ar' ? 'إجمالي الإيرادات المدفوعة' : 'Total paid revenue'}: <span class="paid-amount">$${totalPaidRevenue.toFixed(2)}</span></p>
          </div>
          
          ${Object.keys(paidRevenues).length > 0 ? `
          <table>
              <thead>
                  <tr>
                      <th>#</th>
                      <th>${language === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                      <th>${language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</th>
                      <th>${language === 'ar' ? 'عدد الخدمات' : 'Number of Services'}</th>
                      <th>${language === 'ar' ? 'الإيرادات المدفوعة' : 'Paid Revenue'}</th>
                  </tr>
              </thead>
              <tbody>
                  ${Object.values(paidRevenues).map((item, index) => `
                      <tr>
                          <td>${index + 1}</td>
                          <td class="customer-name">${item.customer.name}</td>
                          <td>${item.customer.phone}</td>
                          <td>${item.servicesCount}</td>
                          <td class="paid-amount">$${item.totalPaidRevenue.toFixed(2)}</td>
                      </tr>
                  `).join('')}
                  <tr class="total-row">
                      <td colspan="3">${language === 'ar' ? 'الإجمالي' : 'Total'}</td>
                      <td>${Object.values(paidRevenues).reduce((sum, item) => sum + item.servicesCount, 0)}</td>
                      <td class="paid-amount">$${totalPaidRevenue.toFixed(2)}</td>
                  </tr>
              </tbody>
          </table>
          ` : `
          <div class="no-data">
              <h3>${language === 'ar' ? 'لا توجد إيرادات مدفوعة في الفترة المحددة' : 'No paid revenue in the selected period'}</h3>
          </div>
          `}
          
          <div class="pending-summary">
              <h3>${language === 'ar' ? 'الإيرادات المعلقة' : 'Pending Revenue'}</h3>
              <p>${language === 'ar' ? 'عدد العملاء المعلق عليهم إيرادات' : 'Number of customers with pending revenue'}: ${Object.keys(pendingRevenues).length}</p>
              <p>${language === 'ar' ? 'إجمالي الإيرادات المعلقة' : 'Total pending revenue'}: <span class="pending-amount">$${totalPendingRevenue.toFixed(2)}</span></p>
          </div>
          
          ${Object.keys(pendingRevenues).length > 0 ? `
          <table>
              <thead>
                  <tr>
                      <th>#</th>
                      <th>${language === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                      <th>${language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</th>
                      <th>${language === 'ar' ? 'عدد الخدمات' : 'Number of Services'}</th>
                      <th>${language === 'ar' ? 'الإيرادات المعلقة' : 'Pending Revenue'}</th>
                  </tr>
              </thead>
              <tbody>
                  ${Object.values(pendingRevenues).map((item, index) => `
                      <tr>
                          <td>${index + 1}</td>
                          <td class="customer-name">${item.customer.name}</td>
                          <td>${item.customer.phone}</td>
                          <td>${item.servicesCount}</td>
                          <td class="pending-amount">$${item.totalPendingRevenue.toFixed(2)}</td>
                      </tr>
                  `).join('')}
                  <tr class="total-row">
                      <td colspan="3">${language === 'ar' ? 'الإجمالي' : 'Total'}</td>
                      <td>${Object.values(pendingRevenues).reduce((sum, item) => sum + item.servicesCount, 0)}</td>
                      <td class="pending-amount">$${totalPendingRevenue.toFixed(2)}</td>
                  </tr>
              </tbody>
          </table>
          
          <div style="margin-top: 30px;">
              <h3>${language === 'ar' ? 'تفاصيل الخدمات المعلقة' : 'Pending Services Details'}</h3>
              ${Object.values(pendingRevenues).map(item => `
                  <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 10px 0; border: 1px solid #e2e8f0;">
                      <h4 style="margin-top: 0; color: #1e40af;">${item.customer.name} - ${item.customer.phone}</h4>
                      <table style="font-size: 12px;">
                          <thead>
                              <tr>
                                  <th>${language === 'ar' ? 'المركبة' : 'Vehicle'}</th>
                                  <th>${language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</th>
                                  <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                  <th>${language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                                  <th>${language === 'ar' ? 'المدفوع' : 'Paid'}</th>
                                  <th>${language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${item.services.map(service => {
                                const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                                const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'غير معروف' : 'Unknown');
                                const remaining = parseFloat(service.remaining_amount) || 0;
                                return `
                                    <tr>
                                        <td>${vehicleName}</td>
                                        <td>${getServiceTypeLabel(service.type)}</td>
                                        <td>${service.date}</td>
                                        <td>$${service.cost}</td>
                                        <td>$${service.amount_paid || 0}</td>
                                        <td class="pending-amount">$${remaining.toFixed(2)}</td>
                                    </tr>
                                `;
                              }).join('')}
                          </tbody>
                      </table>
                  </div>
              `).join('')}
          </div>
          ` : `
          <div class="no-data">
              <h3>${language === 'ar' ? 'لا توجد إيرادات معلقة في الفترة المحددة' : 'No pending revenue in the selected period'}</h3>
          </div>
          `}
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  ${language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-${language === 'ar' ? 'right' : 'left'}: 10px;">
                  ${language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
          </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  // دالة مبسطة للحصول على العميل بواسطة ID
  const getCustomerById = (id) => {
    return customers.find(customer => customer.id === id);
  };

  // دالة مبسطة للحصول على خدمات المركبة
  const getServicesForVehicle = (vehicleId) => {
    return services.filter(service => service.vehicle_id === vehicleId);
  };

  // دالة مبسطة للحصول على التكلفة الإجمالية للمركبة
  const getTotalCostForVehicle = (vehicleId) => {
    return getServicesForVehicle(vehicleId)
      .reduce((total, service) => total + parseFloat(service.cost || 0), 0);
  };

  // دالة مبسطة للحصول على المبلغ المدفوع للمركبة
  const getTotalPaidForVehicle = (vehicleId) => {
    return getServicesForVehicle(vehicleId)
      .reduce((total, service) => total + parseFloat(service.amount_paid || 0), 0);
  };

  // دالة مبسطة للحصول على مركبات العميل
  const getCustomerVehicles = (customerId) => {
    return vehicles.filter(vehicle => vehicle.customer_id === customerId);
  };

  // دالة مبسطة للحصول على خدمات العميل
  const getCustomerServices = (customerId) => {
    const customerVehicles = getCustomerVehicles(customerId);
    return services.filter(service => 
      customerVehicles.some(vehicle => vehicle.id === service.vehicle_id)
    );
  };

  // دالة مبسطة لتصفية المركبات
  const getFilteredVehicles = () => {
    let filtered = vehicles.filter(vehicle => {
      const matchesSearch = 
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (currentUser?.role === 'customer' && currentUser.customer_id) {
      filtered = filtered.filter(vehicle => vehicle.customer_id === currentUser.customer_id);
    }

    return filtered;
  };

  const filteredVehicles = getFilteredVehicles();

  // دالة مبسطة لتصفية العملاء
  const getFilteredCustomers = () => {
    let filtered = customers;

    if (currentUser?.role === 'customer' && currentUser.customer_id) {
      filtered = filtered.filter(customer => customer.id === currentUser.customer_id);
    }

    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();

  // الحصول على المركبات المتاحة لإضافة الخدمة
  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => vehicle.status !== 'completed');
  };

  // الحصول على الخدمات المصفاة حسب الفترة الزمنية للمركبة
  const getFilteredServicesForVehicle = (vehicleId) => {
    const allServices = getServicesForVehicle(vehicleId);
    
    if (!reportDateRange.startDate && !reportDateRange.endDate) {
      return allServices;
    }
    
    return allServices.filter(service => {
      const serviceDate = new Date(service.date);
      const startDate = reportDateRange.startDate ? new Date(reportDateRange.startDate) : new Date('1900-01-01');
      const endDate = reportDateRange.endDate ? new Date(reportDateRange.endDate) : new Date();
      
      endDate.setHours(23, 59, 59, 999);
      
      return serviceDate >= startDate && serviceDate <= endDate;
    });
  };

  // الحصول على الخدمات المصفاة للعميل حسب الفترة
  const getFilteredCustomerServices = (customerId) => {
    const allServices = getCustomerServices(customerId);
    
    if (!customerReportDateRange.startDate && !customerReportDateRange.endDate) {
      return allServices;
    }
    
    return allServices.filter(service => {
      const serviceDate = new Date(service.date);
      const startDate = customerReportDateRange.startDate ? new Date(customerReportDateRange.startDate) : new Date('1900-01-01');
      const endDate = customerReportDateRange.endDate ? new Date(customerReportDateRange.endDate) : new Date();
      
      endDate.setHours(23, 59, 59, 999);
      
      return serviceDate >= startDate && serviceDate <= endDate;
    });
  };

  // حساب التكلفة الإجمالية للمركبة مع الفلترة
  const getFilteredTotalCostForVehicle = (vehicleId) => {
    return getFilteredServicesForVehicle(vehicleId)
      .reduce((total, service) => total + parseFloat(service.cost || 0), 0);
  };

  // حساب الإحصائيات للعميل
  const getCustomerStats = (customerId) => {
    const customerVehicles = getCustomerVehicles(customerId);
    const customerServices = getCustomerServices(customerId);
    const filteredServices = getFilteredCustomerServices(customerId);
    
    return {
      totalVehicles: customerVehicles.length,
      totalServices: customerServices.length,
      filteredServices: filteredServices.length,
      totalCost: customerServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0),
      totalPaid: customerServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0),
      totalRemaining: customerServices.reduce((sum, service) => sum + parseFloat(service.remaining_amount || 0), 0),
      filteredCost: filteredServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0),
      filteredPaid: filteredServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0),
      filteredRemaining: filteredServices.reduce((sum, service) => sum + parseFloat(service.remaining_amount || 0), 0)
    };
  };

  // دالة إنشاء تقرير المركبة
  const generateVehicleReport = (vehicle) => {
    if (!hasPermission('canGenerateReports')) {
      alert(t.accessDenied);
      return;
    }

    const vehicleServices = getServicesForVehicle(vehicle.id);
    const customer = getCustomerById(vehicle.customer_id);
    
    const reportData = {
      vehicle: vehicle,
      customer: customer,
      services: vehicleServices,
      totalCost: getTotalCostForVehicle(vehicle.id),
      totalPaid: getTotalPaidForVehicle(vehicle.id),
      totalRemaining: getTotalCostForVehicle(vehicle.id) - getTotalPaidForVehicle(vehicle.id),
      servicesCount: vehicleServices.length,
      completedServices: vehicleServices.filter(s => s.status === 'completed').length,
      pendingServices: vehicleServices.filter(s => s.status === 'pending').length,
      inServiceServices: vehicleServices.filter(s => s.status === 'in-service').length,
      paidServices: vehicleServices.filter(s => s.payment_status === 'paid').length,
      unpaidServices: vehicleServices.filter(s => s.payment_status === 'pending').length,
      partiallyPaid: vehicleServices.filter(s => s.payment_status === 'partial').length,
      averageCost: vehicleServices.length > 0 ? getTotalCostForVehicle(vehicle.id) / vehicleServices.length : 0,
      mostCommonService: getMostCommonService(vehicleServices)
    };

    return reportData;
  };

  // دالة إنشاء تقرير العميل
  const generateCustomerReport = (customer) => {
    if (!hasPermission('canGenerateReports')) {
      alert(t.accessDenied);
      return;
    }

    const customerVehicles = getCustomerVehicles(customer.id);
    const customerServices = getCustomerServices(customer.id);
    
    const reportData = {
      customer: customer,
      vehicles: customerVehicles,
      services: customerServices,
      totalCost: customerServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0),
      totalPaid: customerServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0),
      totalRemaining: customerServices.reduce((sum, service) => sum + parseFloat(service.remaining_amount || 0), 0),
      vehiclesCount: customerVehicles.length,
      servicesCount: customerServices.length,
      completedServices: customerServices.filter(s => s.status === 'completed').length,
      pendingServices: customerServices.filter(s => s.status === 'pending').length,
      inServiceServices: customerServices.filter(s => s.status === 'in-service').length,
      paidServices: customerServices.filter(s => s.payment_status === 'paid').length,
      unpaidServices: customerServices.filter(s => s.payment_status === 'pending').length,
      partiallyPaid: customerServices.filter(s => s.payment_status === 'partial').length,
      averageCost: customerServices.length > 0 ? customerServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0) / customerServices.length : 0,
      mostCommonService: getMostCommonService(customerServices)
    };

    return reportData;
  };

  // دالة مساعدة للحصول على الخدمة الأكثر شيوعاً
  const getMostCommonService = (servicesArray) => {
    if (servicesArray.length === 0) return null;
    
    const serviceCounts = {};
    servicesArray.forEach(service => {
      serviceCounts[service.type] = (serviceCounts[service.type] || 0) + 1;
    });
    
    return Object.keys(serviceCounts).reduce((a, b) => 
      serviceCounts[a] > serviceCounts[b] ? a : b
    );
  };

  // دالة مساعدة للحصول على اسم الخدمة المترجم
  const getServiceTypeLabel = (typeKey) => {
    // استخدام كائن الترجمة الحالي (t) لترجمة المفتاح
    // إذا لم يتم العثور على ترجمة، يتم إرجاع المفتاح نفسه
    return t[typeKey] || typeKey;
  };

  // طباعة تقرير المركبة
  const handlePrintVehicleReport = async () => {
    if (!selectedVehicle) return;
    
    const filteredServices = getFilteredServicesForVehicle(selectedVehicle.id);
    
    const allPayments = payments.filter(p => 
      filteredServices.some(service => service.id === p.service_id)
    );
    
    const dateRangeText = reportDateRange.startDate && reportDateRange.endDate 
      ? ` ${language === 'ar' ? 'للفترة من' : 'for period from'} ${reportDateRange.startDate} ${language === 'ar' ? 'إلى' : 'to'} ${reportDateRange.endDate}`
      : reportDateRange.startDate 
        ? ` ${language === 'ar' ? 'من تاريخ' : 'from'} ${reportDateRange.startDate}`
        : reportDateRange.endDate 
          ? ` ${language === 'ar' ? 'حتى تاريخ' : 'until'} ${reportDateRange.endDate}`
          : '';

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'تقرير المركبة' : 'Vehicle Report'} - ${selectedVehicle.make} ${selectedVehicle.model}</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 10px; 
              }
              .date-range {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
                  margin: 10px 0;
                  text-align: center;
                  font-weight: bold;
              }
              .section { 
                  margin-bottom: 20px; 
              }
              .section h3 { 
                  background: #f5f5f5; 
                  padding: 10px; 
                  border-${language === 'ar' ? 'right' : 'left'}: 4px solid #3b82f6; 
                  margin-bottom: 10px;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 10px 0; 
              }
              th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: ${language === 'ar' ? 'right' : 'left'}; 
              }
              th { 
                  background-color: #f2f2f2; 
              }
              .total { 
                  font-weight: bold; 
                  font-size: 18px; 
	                  color: #10b981; 
	              }
	              .remaining-total {
	                  font-weight: bold; 
	                  font-size: 18px; 
	                  color: #dc2626; /* Red color */
	              }
              .summary {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 15px 0;
              }
              .status-badge, .payment-badge {
                  padding: 4px 8px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 500;
              }
              .status-pending { background: #dbeafe; color: #1d4ed8; }
              .status-in-service { background: #fed7aa; color: #ea580c; }
              .status-completed { background: #bbf7d0; color: #16a34a; }
              .payment-paid { background: #bbf7d0; color: #16a34a; }
              .payment-pending { background: #fed7aa; color: #ea580c; }
              .payment-partial { background: #fef3c7; color: #d97706; }
              .payment-method-badge {
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 11px;
                  background: #f3f4f6;
              }
              .payments-table {
                  font-size: 12px;
              }
              .payments-table th {
                  background: #e5e7eb;
              }
              @media print {
                  .no-print { display: none; }
                  body { margin: 0; }
                  .header { border-bottom: 2px solid #000; }
                  .section { page-break-inside: avoid; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 150px; margin-bottom: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div style=\'font-size:100px; margin-bottom: 10px;\'>🚗</div>');">
              <h1>${language === 'ar' ? 'تقرير مركبة - GaragePro Manager' : 'Vehicle Report - GaragePro Manager'}</h1>
              <p>${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              ${dateRangeText ? `<div class="date-range">${dateRangeText}</div>` : ''}
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'الماركة والموديل' : 'Make & Model'}</td><td>${selectedVehicle.make} ${selectedVehicle.model}</td></tr>
                  <tr><td>${language === 'ar' ? 'السنة' : 'Year'}</td><td>${selectedVehicle.year}</td></tr>
                  <tr><td>${language === 'ar' ? 'لوحة الرخصة' : 'License Plate'}</td><td>${selectedVehicle.license_plate}</td></tr>
                  <tr><td>${language === 'ar' ? 'الحالة' : 'Status'}</td><td><span class="status-badge ${selectedVehicle.status === 'in-service' ? 'status-in-service' : selectedVehicle.status === 'completed' ? 'status-completed' : 'status-pending'}">${selectedVehicle.status === 'in-service' ? (language === 'ar' ? 'قيد الخدمة' : 'In Service') : selectedVehicle.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') : (language === 'ar' ? 'قيد الانتظار' : 'Pending')}</span></td></tr>
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h3>
              <table>
                  ${(() => {
                    const customer = getCustomerById(selectedVehicle.customer_id);
                    return customer ? `
                      <tr><td>${language === 'ar' ? 'الاسم' : 'Name'}</td><td>${customer.name}</td></tr>
                      <tr><td>${language === 'ar' ? 'الهاتف' : 'Phone'}</td><td>${customer.phone}</td></tr>
                      <tr><td>${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</td><td>${customer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</td></tr>
                    ` : `<tr><td colspan="2">${language === 'ar' ? 'لا توجد معلومات عن المالك' : 'No owner information available'}</td></tr>`;
                  })()}
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الخدمات' : 'Service History'} ${dateRangeText}</h3>
              ${filteredServices.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>${language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</th>
                            <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${language === 'ar' ? 'الفني' : 'Technician'}</th>
                            <th>${language === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</th>
                            <th>${language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            <th>${language === 'ar' ? 'المدفوع' : 'Paid'}</th>
                            <th>${language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredServices.map(service => `
                            <tr>
                                <td>${getServiceTypeLabel(service.type)}</td>
                                <td>${service.date}</td>
                                <td>${service.technician}</td>
                                <td><span class="status-badge ${service.status === 'completed' ? 'status-completed' : service.status === 'in-progress' ? 'status-in-service' : 'status-pending'}">${service.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') : service.status === 'in-progress' ? (language === 'ar' ? 'قيد التنفيذ' : 'In Progress') : (language === 'ar' ? 'مجدول' : 'Scheduled')}</span></td>
                                <td><span class="payment-badge ${service.payment_status === 'paid' ? 'payment-paid' : service.payment_status === 'partial' ? 'payment-partial' : 'payment-pending'}">${service.payment_status === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') : service.payment_status === 'partial' ? (language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid') : (language === 'ar' ? 'غير مدفوع' : 'Unpaid')}</span></td>
                                <td>$${service.cost}</td>
                                <td>$${service.amount_paid || 0}</td>
                                <td>$${service.remaining_amount || service.cost}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
              ` : `<p style="text-align: center; color: #6b7280; padding: 20px;">${language === 'ar' ? 'لا توجد خدمات في الفترة المحددة' : 'No services in the selected period'}</p>`}
          </div>

          ${allPayments.length > 0 ? `
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الدفعات التفصيلي' : 'Detailed Payment History'} ${dateRangeText}</h3>
              <table class="payments-table">
                  <thead>
                      <tr>
                          <th>${language === 'ar' ? 'الخدمة' : 'Service'}</th>
                          <th>${language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</th>
                          <th>${language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                          <th>${language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                          <th>${language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</th>
                          <th>${language === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${allPayments.map(payment => {
                        const service = filteredServices.find(s => s.id === payment.service_id);
                        const serviceName = service ? service.type : (language === 'ar' ? 'خدمة غير معروفة' : 'Unknown Service');
                        return `
                          <tr>
                              <td>${serviceName}</td>
                              <td>${payment.payment_date}</td>
                              <td style="color: #10b981; font-weight: bold;">$${payment.amount}</td>
                              <td>
                                <span class="payment-method-badge">
                                  ${payment.payment_method === 'cash' ? (language === 'ar' ? '💵 نقدي' : '💵 Cash') : 
                                   payment.payment_method === 'card' ? (language === 'ar' ? '💳 بطاقة' : '💳 Card') :
                                   payment.payment_method === 'transfer' ? (language === 'ar' ? '🏦 تحويل' : '🏦 Transfer') : (language === 'ar' ? '📄 شيك' : '📄 Check')}
                                </span>
                              </td>
                              <td>${payment.transaction_id || '-'}</td>
                              <td>${payment.notes || '-'}</td>
                          </tr>
                        `;
                      }).join('')}
                  </tbody>
                  <tfoot>
                      <tr>
                          <td colspan="2" style="font-weight: bold;">${language === 'ar' ? 'المجموع' : 'Total'}:</td>
                          <td style="font-weight: bold; color: #10b981;">
                              $${allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                          </td>
                          <td colspan="3"></td>
                      </tr>
                  </tfoot>
              </table>
          </div>
          ` : ''}
          
          <div class="summary">
              <h3>${language === 'ar' ? 'ملخص التقرير' : 'Report Summary'}</h3>
              <table>
                  <tr>
                      <td>${language === 'ar' ? 'عدد الخدمات في الفترة' : 'Services in Period'}</td>
                      <td>${filteredServices.length}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'إجمالي عدد الخدمات' : 'Total Services'}</td>
                      <td>${getServicesForVehicle(selectedVehicle.id).length}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'التكلفة الإجمالية في الفترة' : 'Total Cost in Period'}</td>
                      <td class="total">$${getFilteredTotalCostForVehicle(selectedVehicle.id).toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'المبلغ المدفوع في الفترة' : 'Amount Paid in Period'}</td>
                      <td>$${filteredServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0).toFixed(2)}</td>
                  </tr>

	                  <tr>
	                      <td>${language === 'ar' ? 'المبلغ المتبقي على المركبة' : 'Remaining Balance on Vehicle'}</td>
		                      <td class="remaining-total">$${(getTotalCostForVehicle(selectedVehicle.id) - getTotalPaidForVehicle(selectedVehicle.id)).toFixed(2)}</td>
	                  </tr>
                  ${allPayments.length > 0 ? `
                  <tr>
                      <td>${language === 'ar' ? 'عدد الدفعات المسجلة' : 'Number of Payments'}</td>
                      <td>${allPayments.length}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'المبلغ المتبقي في الفترة' : 'Remaining Amount in Period'}</td>
                      <td>$${filteredServices.reduce((sum, service) => sum + parseFloat(service.remaining_amount || 0), 0).toFixed(2)}</td>
                  </tr>
                  ` : ''}
              </table>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  ${language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-${language === 'ar' ? 'right' : 'left'}: 10px;">
                  ${language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
          </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  // طباعة تقرير العميل
  const handlePrintCustomerReport = async () => {
    if (!selectedCustomer) return;
    
    const customerVehicles = getCustomerVehicles(selectedCustomer.id);
    const filteredServices = getFilteredCustomerServices(selectedCustomer.id);
    const allPayments = payments.filter(p => 
      filteredServices.some(service => service.id === p.service_id)
    );
    const customerStats = getCustomerStats(selectedCustomer.id);
    
    const dateRangeText = customerReportDateRange.startDate && customerReportDateRange.endDate 
      ? ` ${language === 'ar' ? 'للفترة من' : 'for period from'} ${customerReportDateRange.startDate} ${language === 'ar' ? 'إلى' : 'to'} ${customerReportDateRange.endDate}`
      : customerReportDateRange.startDate 
        ? ` ${language === 'ar' ? 'من تاريخ' : 'from'} ${customerReportDateRange.startDate}`
        : customerReportDateRange.endDate 
          ? ` ${language === 'ar' ? 'حتى تاريخ' : 'until'} ${customerReportDateRange.endDate}`
          : '';

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'تقرير العميل' : 'Customer Report'} - ${selectedCustomer.name}</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 10px; 
              }
              .date-range {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
                  margin: 10px 0;
                  text-align: center;
                  font-weight: bold;
              }
              .section { 
                  margin-bottom: 20px; 
              }
              .section h3 { 
                  background: #f5f5f5; 
                  padding: 10px; 
                  border-${language === 'ar' ? 'right' : 'left'}: 4px solid #3b82f6; 
                  margin-bottom: 10px;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 10px 0; 
              }
              th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: ${language === 'ar' ? 'right' : 'left'}; 
              }
              th { 
                  background-color: #f2f2f2; 
              }
              .total { 
                  font-weight: bold; 
                  font-size: 18px; 
                  color: #10b981; 
              }
              .remaining { 
                  font-weight: bold; 
                  font-size: 18px; 
                  color: #ef4444; 
              }
              .summary {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 15px 0;
              }
              .status-badge, .payment-badge {
                  padding: 4px 8px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 500;
              }
              .status-pending { background: #dbeafe; color: #1d4ed8; }
              .status-in-service { background: #fed7aa; color: #ea580c; }
              .status-completed { background: #bbf7d0; color: #16a34a; }
              .payment-paid { background: #bbf7d0; color: #16a34a; }
              .payment-pending { background: #fed7aa; color: #ea580c; }
              .payment-partial { background: #fef3c7; color: #d97706; }
              .payment-method-badge {
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 11px;
                  background: #f3f4f6;
              }
              .payments-table {
                  font-size: 12px;
              }
              .payments-table th {
                  background: #e5e7eb;
              }
              .vehicle-section {
                  background: #f8fafc;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                  border: 1px solid #e2e8f0;
              }
              @media print {
                  .no-print { display: none; }
                  body { margin: 0; }
                  .header { border-bottom: 2px solid #000; }
                  .section { page-break-inside: avoid; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 150px; margin-bottom: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div style=\'font-size:100px; margin-bottom: 10px;\'>🚗</div>');">
              <h1>${language === 'ar' ? 'تقرير عميل - GaragePro Manager' : 'Customer Report - GaragePro Manager'}</h1>
              <p>${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
              ${dateRangeText ? `<div class="date-range">${dateRangeText}</div>` : ''}
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات العميل' : 'Customer Information'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'الاسم' : 'Name'}</td><td>${selectedCustomer.name}</td></tr>
                  <tr><td>${language === 'ar' ? 'الهاتف' : 'Phone'}</td><td>${selectedCustomer.phone}</td></tr>
                  <tr><td>${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</td><td>${selectedCustomer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</td></tr>
                  <tr><td>${language === 'ar' ? 'العنوان' : 'Address'}</td><td>${selectedCustomer.address || (language === 'ar' ? 'غير متوفر' : 'Not available')}</td></tr>
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'المركبات المسجلة' : 'Registered Vehicles'} (${customerVehicles.length})</h3>
              ${customerVehicles.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>${language === 'ar' ? 'الماركة والموديل' : 'Make & Model'}</th>
                            <th>${language === 'ar' ? 'السنة' : 'Year'}</th>
                            <th>${language === 'ar' ? 'لوحة الرخصة' : 'License Plate'}</th>
                            <th>${language === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${language === 'ar' ? 'عدد الخدمات' : 'Number of Services'}</th>
                            <th>${language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerVehicles.map(vehicle => {
                          const vehicleServices = getServicesForVehicle(vehicle.id);
                          const totalCost = vehicleServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0);
                          return `
                            <tr>
                                <td>${vehicle.make} ${vehicle.model}</td>
                                <td>${vehicle.year}</td>
                                <td>${vehicle.license_plate}</td>
                                <td><span class="status-badge ${vehicle.status === 'in-service' ? 'status-in-service' : vehicle.status === 'completed' ? 'status-completed' : 'status-pending'}">${vehicle.status === 'in-service' ? (language === 'ar' ? 'قيد الخدمة' : 'In Service') : vehicle.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') : (language === 'ar' ? 'قيد الانتظار' : 'Pending')}</span></td>
                                <td>${vehicleServices.length}</td>
                                <td>$${totalCost.toFixed(2)}</td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
              ` : `<p style="text-align: center; color: #6b7280; padding: 20px;">${language === 'ar' ? 'لا توجد مركبات مسجلة لهذا العميل' : 'No vehicles registered for this customer'}</p>`}
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الخدمات' : 'Service History'} ${dateRangeText}</h3>
              ${filteredServices.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>${language === 'ar' ? 'المركبة' : 'Vehicle'}</th>
                            <th>${language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</th>
                            <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${language === 'ar' ? 'الفني' : 'Technician'}</th>
                            <th>${language === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</th>
                            <th>${language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            <th>${language === 'ar' ? 'المدفوع' : 'Paid'}</th>
                            <th>${language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredServices.map(service => {
                          const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                          const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'مركبة غير معروفة' : 'Unknown Vehicle');
                          return `
                            <tr>
                                <td>${vehicleName}</td>
                                <td>${getServiceTypeLabel(service.type)}</td>
                                <td>${service.date}</td>
                                <td>${service.technician}</td>
                                <td><span class="status-badge ${service.status === 'completed' ? 'status-completed' : service.status === 'in-progress' ? 'status-in-service' : 'status-pending'}">${service.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') : service.status === 'in-progress' ? (language === 'ar' ? 'قيد التنفيذ' : 'In Progress') : (language === 'ar' ? 'مجدول' : 'Scheduled')}</span></td>
                                <td><span class="payment-badge ${service.payment_status === 'paid' ? 'payment-paid' : service.payment_status === 'partial' ? 'payment-partial' : 'payment-pending'}">${service.payment_status === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') : service.payment_status === 'partial' ? (language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid') : (language === 'ar' ? 'غير مدفوع' : 'Unpaid')}</span></td>
                                <td>$${service.cost}</td>
                                <td>$${service.amount_paid || 0}</td>
                                <td>$${service.remaining_amount || service.cost}</td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
              ` : `<p style="text-align: center; color: #6b7280; padding: '20px';">${language === 'ar' ? 'لا توجد خدمات في الفترة المحددة' : 'No services in the selected period'}</p>`}
          </div>

          ${allPayments.length > 0 ? `
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الدفعات التفصيلي' : 'Detailed Payment History'} ${dateRangeText}</h3>
              <table class="payments-table">
                  <thead>
                      <tr>
                          <th>${language === 'ar' ? 'المركبة' : 'Vehicle'}</th>
                          <th>${language === 'ar' ? 'الخدمة' : 'Service'}</th>
                          <th>${language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}</th>
                          <th>${language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                          <th>${language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                          <th>${language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</th>
                          <th>${language === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${allPayments.map(payment => {
                        const service = filteredServices.find(s => s.id === payment.service_id);
                        const serviceName = service ? service.type : (language === 'ar' ? 'خدمة غير معروفة' : 'Unknown Service');
                        const vehicle = service ? vehicles.find(v => v.id === service.vehicle_id) : null;
                        const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'مركبة غير معروفة' : 'Unknown Vehicle');
                        return `
                          <tr>
                              <td>${vehicleName}</td>
                              <td>${serviceName}</td>
                              <td>${payment.payment_date}</td>
                              <td style="color: #10b981; font-weight: bold;">$${payment.amount}</td>
                              <td>
                                <span class="payment-method-badge">
                                  ${payment.payment_method === 'cash' ? (language === 'ar' ? '💵 نقدي' : '💵 Cash') : 
                                   payment.payment_method === 'card' ? (language === 'ar' ? '💳 بطاقة' : '💳 Card') :
                                   payment.payment_method === 'transfer' ? (language === 'ar' ? '🏦 تحويل' : '🏦 Transfer') : (language === 'ar' ? '📄 شيك' : '📄 Check')}
                                </span>
                              </td>
                              <td>${payment.transaction_id || '-'}</td>
                              <td>${payment.notes || '-'}</td>
                          </tr>
                        `;
                      }).join('')}
                  </tbody>
                  <tfoot>
                      <tr>
                          <td colspan="3" style="font-weight: bold;">${language === 'ar' ? 'المجموع' : 'Total'}:</td>
                          <td style="font-weight: bold; color: #10b981;">
                              $${allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                          </td>
                          <td colspan="3"></td>
                      </tr>
                  </tfoot>
              </table>
          </div>
          ` : ''}
          
          <div class="summary">
              <h3>${language === 'ar' ? 'ملخص التقرير' : 'Report Summary'}</h3>
              <table>
                  <tr>
                      <td>${language === 'ar' ? 'عدد المركبات' : 'Number of Vehicles'}</td>
                      <td>${customerStats.totalVehicles}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'إجمالي عدد الخدمات' : 'Total Services'}</td>
                      <td>${customerStats.totalServices}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'عدد الخدمات في الفترة' : 'Services in Period'}</td>
                      <td>${customerStats.filteredServices}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</td>
                      <td class="total">$${customerStats.totalCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'التكلفة في الفترة' : 'Cost in Period'}</td>
                      <td class="total">$${customerStats.filteredCost.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'المبلغ المدفوع إجمالاً' : 'Total Amount Paid'}</td>
                      <td>$${customerStats.totalPaid.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'المبلغ المدفوع في الفترة' : 'Amount Paid in Period'}</td>
                      <td>$${customerStats.filteredPaid.toFixed(2)}</td>
                  </tr>
                  ${allPayments.length > 0 ? `
                  <tr>
                      <td>${language === 'ar' ? 'عدد الدفعات المسجلة' : 'Number of Payments'}</td>
                      <td>${allPayments.length}</td>
                  </tr>
                  <tr>
                      <td>${language === 'ar' ? 'إجمالي المبالغ المدفوعة' : 'Total Payments Amount'}</td>
                      <td class="total">$${allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  <!-- إضافة المبلغ المستحق -->
                  <tr>
                      <td><strong>${language === 'ar' ? 'المبلغ المستحق على العميل' : 'Amount Due from Customer'}</strong></td>
                      <td class="remaining"><strong>$${customerStats.filteredRemaining.toFixed(2)}</strong></td>
                  </tr>
              </table>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  ${language === 'ar' ? 'طباعة التقرير' : 'Print Report'}
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-${language === 'ar' ? 'right' : 'left'}: 10px;">
                  ${language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
          </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  // إعادة تعيين الفلترة
  const resetReportDateRange = () => {
    setReportDateRange({
      startDate: '',
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  const resetCustomerReportDateRange = () => {
    setCustomerReportDateRange({
      startDate: '',
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  const resetRevenueReportDateRange = () => {
    setRevenueReportDateRange({
      startDate: '',
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  // مكون بادج الحالة
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'in-service': { 
        class: 'status-in-service', 
        label: language === 'ar' ? 'قيد الخدمة' : 'In Service' 
      },
      'completed': { 
        class: 'status-completed', 
        label: language === 'ar' ? 'مكتمل' : 'Completed' 
      },
      'pending': { 
        class: 'status-pending', 
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending' 
      },
      'in-progress': { 
        class: 'status-in-service', 
        label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' 
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  // مكون بادج الدفع
  const PaymentBadge = ({ status, amountPaid, cost }) => {
    const paymentConfig = {
      'paid': { 
        class: 'payment-paid', 
        label: language === 'ar' ? 'مدفوع' : 'Paid', 
        icon: '✅' 
      },
      'pending': { 
        class: 'payment-pending', 
        label: language === 'ar' ? 'غير مدفوع' : 'Unpaid', 
        icon: '⏳' 
      },
      'partial': { 
        class: 'payment-partial', 
        label: language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid', 
        icon: '💰' 
      }
    };
    
    const config = paymentConfig[status] || paymentConfig.pending;
    
    return (
      <span className={`payment-badge ${config.class}`}>
        <span style={{marginLeft: '4px'}}>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // إذا لم يكن المستخدم مسجل الدخول، عرض واجهة تسجيل الدخول
  if (!currentUser) {
    return (
      <div className="min-h-screen auth-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="auth-modal">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo">
                <Logo src={t.logo} language={language} height="60px" />
                <div>
                  <div className="logo-text">{t.appName}</div>
                  <div className="logo-subtitle">{t.appSubtitle}</div>
                </div>
              </div>
              <h2 className="auth-title">{t.login}</h2>
              <p className="auth-description">{t.loginToContinue}</p>
              <div style={{background: '#f3f4f6', padding: '10px', borderRadius: '8px', marginTop: '10px', fontSize: '12px'}}>
                <strong>بيانات تجريبية:</strong><br/>
                admin / admin123 (مدير)<br/>
                user / user123 (مستخدم)<br/>
                tech / tech123 (فني)<br/>
                0123456789 / 123456 (عميل أحمد السيد)<br/>
                0123456790 / 123456 (عميل محمد عبدالله)<br/>
                0123456791 / 123456 (عميل فاطمة أحمد)
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label">{t.username}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  placeholder={t.username}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.password}</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder={t.password}
                />
              </div>
              
              <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                  style={{width: 'auto', cursor: 'pointer'}}
                />
                <label htmlFor="rememberMe" style={{cursor: 'pointer', userSelect: 'none', fontSize: '14px', color: '#4b5563'}}>
                  {t.rememberMe}
                </label>
              </div>
              
              <button type="submit" className="btn btn-primary auth-btn">
                {t.login}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم مسجل الدخول، عرض التطبيق الرئيسي
  return (
    <div className="min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PrintHeader t={t} />
      {/* الهيدر */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Logo src={t.logo} language={language} height="50px" />
              <div>
                <div className="logo-text">{t.appName}</div>
                <div className="logo-subtitle">{t.appSubtitle}</div>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="user-info">
                <span className="user-name">
                  {t.welcome}, {currentUser.name}
                </span>
                <span className={`user-role role-${currentUser.role}`}>
                  {currentUser.role === 'admin' ? 'مدير' : 
                   currentUser.role === 'technician' ? 'فني' : 
                   currentUser.role === 'customer' ? 'عميل' : 'مستخدم'}
                </span>
              </div>
              
              <button 
                className="btn btn-outline" 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                style={{marginRight: '10px'}}
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
              
              {hasPermission('canManageCustomers') && (
                <button className="btn btn-secondary" onClick={() => setIsCustomerFormOpen(true)}>
                  <span>➕</span> {t.addCustomer}
                </button>
              )}
              
              {hasPermission('canManageVehicles') && (
                <button className="btn btn-primary" onClick={() => setIsVehicleFormOpen(true)}>
                  {t.addVehicle}
                </button>
              )}
              
              {hasPermission('canManageUsers') && (
                <button className="btn btn-warning" onClick={() => {
                  loadAllUsers();
                  setIsAdminAccountsOpen(true);
                }}>
                  <span>👥</span> {t.adminAccounts}
                </button>
              )}
              
              {hasPermission('canManageUsers') && (
                <button className="btn btn-info" onClick={() => {
                  setSelectedTechnician(null);
                  setNewTechnician({ username: '', password: '', name: '', email: '', role: 'technician' });
                  setIsTechnicianFormOpen(true);
                }}>
                  <span>👷</span> {t.addTechnician}
                </button>
              )}
              
              {hasPermission('canManageServices') && (
                <button className="btn btn-success" onClick={() => setIsServiceFormOpen(true)}>
                  <span>➕</span> {t.addService}
                </button>
              )}
              
              {/* إضافة زر تقرير الإيرادات هنا */}
              {hasPermission('canViewRevenueReport') && (
  <button 
    className="btn btn-purple" 
    onClick={() => setIsRevenueReportOpen(true)}
    style={{background: '#8b5cf6', color: 'white', border: 'none'}}
  >
    <span>💰</span> {t.revenueReport}
  </button>
)}
              
              <button className="btn btn-outline btn-danger" onClick={handleLogout}>
                <span>🚪</span> {t.logout}
              </button>
            </div>
          </div>

          {/* شريط البحث والتصفية */}
          {hasPermission('canViewAllVehicles') && (
            <div className="search-container">
              <div className="search-box">
                <div className="search-icon">🔍</div>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="search-box">
                <div className="filter-icon">⚡</div>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">{t.allStatus}</option>
                  <option value="pending">{t.pendingStatus}</option>
                  <option value="in-service">{t.inServiceStatus}</option>
                  <option value="completed">{t.completedStatus}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* الإحصائيات */}
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-blue">🚗</div>
              <div className="stat-text">
                <div className="stat-label">{t.totalVehicles}</div>
                <div className="stat-value">{stats.totalVehicles}</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-orange">🔧</div>
              <div className="stat-text">
                <div className="stat-label">{t.inService}</div>
                <div className="stat-value">{stats.inService}</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-green">✅</div>
              <div className="stat-text">
                <div className="stat-label">{t.completed}</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
            </div>
          </div>
          
          {hasPermission('canViewAllCustomers') && (
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon stat-icon-purple">👥</div>
                <div className="stat-text">
                  <div className="stat-label">{t.totalCustomers}</div>
                  <div className="stat-value">{stats.totalCustomers}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* إحصائيات الإيرادات */}
        <div className="stats-grid" style={{marginTop: '16px'}}>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-green">💰</div>
              <div className="stat-text">
                <div className="stat-label">{t.paidRevenue}</div>
                <div className="stat-value">${stats.paidRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-orange">⏳</div>
              <div className="stat-text">
                <div className="stat-label">{t.pendingRevenue}</div>
                <div className="stat-value">${stats.pendingRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon stat-icon-blue">📈</div>
              <div className="stat-text">
                <div className="stat-label">{t.totalRevenue}</div>
                <div className="stat-value">${stats.paidRevenue + stats.pendingRevenue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container">
        <div className="main-content">
          {/* القائمة الجانبية */}
          <div className="sidebar">
            {hasPermission('canViewAllVehicles') && (
              <>
                <h2 className="sidebar-title">{t.vehicles} ({filteredVehicles.length})</h2>
                
                <div className="vehicles-list">
                  {filteredVehicles.map(vehicle => {
                    const customer = getCustomerById(vehicle.customer_id);
                    return (
                      <div
                        key={vehicle.id}
                        className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setSelectedCustomer(null);
                        }}
                      >
                        <div className="vehicle-header">
                          <h3 className="vehicle-name">{vehicle.make} {vehicle.model}</h3>
                          <div style={{display: 'flex', gap: '8px'}}>
                            {hasPermission('canManageVehicles') && (
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditVehicleModal(vehicle);
                                }}
                                style={{padding: '4px 8px', fontSize: '12px'}}
                                title={t.editVehicle}
                              >
                                ✏️
                              </button>
                            )}
                            {hasPermission('canDelete') && (
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVehicle(vehicle.id);
                                }}
                                style={{padding: '4px 8px', fontSize: '12px'}}
                                title={t.deleteVehicle}
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="vehicle-details">
                          <div className="vehicle-info">
                            <span className="vehicle-year">{t.year}: {vehicle.year}</span>
                            <StatusBadge status={vehicle.status} />
                          </div>
                          <p className="vehicle-plate">{t.licensePlate}: {vehicle.license_plate}</p>
                          {customer && (
                            <p className="vehicle-customer">{t.customer}: {customer.name}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* قائمة العملاء */}
            {hasPermission('canViewAllCustomers') && (
              <div style={{marginTop: '24px'}}>
                <h2 className="sidebar-title">{t.customers} ({filteredCustomers.length})</h2>
                
                <div className="vehicles-list">
                  {filteredCustomers.map(customer => {
                    const customerVehicles = getCustomerVehicles(customer.id);
                    const customerServices = getCustomerServices(customer.id);
                    const totalCost = customerServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0);
                    const totalPaid = customerServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0);
                    const totalRemaining = totalCost - totalPaid;
                    
                    return (
                      <div
                        key={customer.id}
                        className={`vehicle-card ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setSelectedVehicle(null);
                        }}
                      >
                        <div className="vehicle-header">
                          <h3 className="vehicle-name">{customer.name}</h3>
                          <div style={{display: 'flex', gap: '8px'}}>
                            {hasPermission('canManageCustomers') && (
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditCustomerModal(customer);
                                }}
                                style={{padding: '4px 8px', fontSize: '12px'}}
                                title={t.editCustomer}
                              >
                                ✏️
                              </button>
                            )}
                            {hasPermission('canDelete') && (
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomer(customer.id);
                                }}
                                style={{padding: '4px 8px', fontSize: '12px'}}
                                title={t.deleteCustomer}
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="vehicle-details">
                          <div className="vehicle-info">
                            <span className="vehicle-year">{t.phone}: {customer.phone}</span>
                            <span className="status-badge status-completed">
                              {customerVehicles.length} {t.vehiclesCount}
                            </span>
                          </div>
                          <p className="vehicle-plate">{t.email}: {customer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</p>
                          {totalRemaining > 0 && (
                            <p className="vehicle-customer" style={{color: '#ef4444', fontWeight: 'bold'}}>
                              {t.dueAmount}: ${totalRemaining.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* التفاصيل الرئيسية */}
          <div className="detail-content">
            {selectedVehicle ? (
              <>
                {/* الهيدر التفصيلي */}
                <div className="detail-header">
                  <div>
                    <h2 className="detail-title">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <p className="detail-subtitle">{t.licensePlate}: {selectedVehicle.license_plate}</p>
                  </div>
                  <div className="detail-actions">
                    {hasPermission('canGenerateReports') && (
                      <button 
                        className="btn btn-info"
                        onClick={() => setIsVehicleReportOpen(true)}
                      >
                        <span>📊</span> {t.report}
                      </button>
                    )}
                    {hasPermission('canManageVehicles') && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => openEditVehicleModal(selectedVehicle)}
                      >
                        <span>✏️</span> {t.editVehicle}
                      </button>
                    )}
                    {hasPermission('canManageServices') && (
                      <button 
                        className="btn btn-success"
                        onClick={() => {
                          setNewService({
                            ...newService,
                            vehicle_id: selectedVehicle.id
                          });
                          setIsServiceFormOpen(true);
                        }}
                      >
                        <span>➕</span> {t.addService}
                      </button>
                    )}
                    {hasPermission('canManagePayments') && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => openBulkPaymentModal()}
                      >
                        <span>💰</span> {t.bulkPayment}
                      </button>
                    )}
                    {hasPermission('canDelete') && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteVehicle(selectedVehicle.id)}
                      >
                        <span>🗑️</span> {t.deleteVehicle}
                      </button>
                    )}
                  </div>
                </div>

                {/* المحتوى التفصيلي */}
                <div className="detail-body">
                  <div className="detail-grid">
                    {/* معلومات المركبة */}
                    <div>
                      <div className="card">
                        <h3 className="card-title">
                          <span>🚗</span> {t.vehicleInfo}
                        </h3>
                        <div className="info-grid">
                          <div className="info-row">
                            <span className="info-label">{t.makeModel}</span>
                            <span className="info-value">{selectedVehicle.make} {selectedVehicle.model}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.year}</span>
                            <span className="info-value">{selectedVehicle.year}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.licensePlate}</span>
                            <span className="info-value">{selectedVehicle.license_plate}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.status}</span>
                            <StatusBadge status={selectedVehicle.status} />
                          </div>
                          {/* إضافة إحصائيات الدفع للمركبة */}
                          <div className="info-row">
                            <span className="info-label">{t.totalRemainingAmount}</span>
                            <span className="info-value" style={{color: '#ef4444', fontWeight: 'bold'}}>
                              ${(getTotalCostForVehicle(selectedVehicle.id) - getTotalPaidForVehicle(selectedVehicle.id)).toFixed(2)}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.servicesCountForBulkPayment}</span>
                            <span className="info-value">
                              {getServicesForVehicle(selectedVehicle.id).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* معلومات العميل */}
                      {(() => {
                        const customer = getCustomerById(selectedVehicle.customer_id);
                        return customer ? (
                          <div className="card" style={{marginTop: '24px'}}>
                            <h3 className="card-title">
                              <span>👤</span> {t.customerInfo}
                            </h3>
                            <div className="info-grid">
                              <div className="info-row">
                                <span className="info-label">{t.name}</span>
                                <span className="info-value">{customer.name}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">{t.phone}</span>
                                <span className="info-value">{customer.phone}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">{t.email}</span>
                                <span className="info-value">{customer.email}</span>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* سجل الخدمات مع السكرول */}
                    <div className="card">
                      <div className="services-header">
                        <h3 className="services-title">
                          <span>🔧</span> {t.serviceHistory}
                        </h3>
                        <div className="services-total">
                          ${getTotalPaidForVehicle(selectedVehicle.id).toFixed(2)} / ${getTotalCostForVehicle(selectedVehicle.id).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="services-scroll-container">
                        {getServicesForVehicle(selectedVehicle.id).length > 0 ? (
                          getServicesForVehicle(selectedVehicle.id).map(service => (
                            <div key={service.id} className="service-item">
                              <div className="service-header">
                                <div>
                                  <span className="service-type">{getServiceTypeLabel(service.type)}</span>
                                  <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                    <StatusBadge status={service.status} />
                                    <PaymentBadge 
                                      status={service.payment_status} 
                                      amountPaid={service.amount_paid} 
                                      cost={service.cost} 
                                    />
                                  </div>
                                </div>
                                <div style={{textAlign: language === 'ar' ? 'right' : 'left'}}>
                                  <span className="service-cost">${service.cost}</span>
                                  {service.amount_paid > 0 && (
                                    <div style={{fontSize: '12px', color: '#10b981'}}>
                                      {t.paid}: ${service.amount_paid}
                                    </div>
                                  )}
                                  {service.remaining_amount > 0 && (
                                    <div style={{fontSize: '12px', color: '#ef4444'}}>
                                      {t.remaining}: ${service.remaining_amount}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="service-meta">
                                <span className="service-meta-item">
                                  <span>📅</span> {service.date}
                                </span>
                                <span className="service-meta-item">
                                  <span>👤</span> {service.technician}
                                </span>
                              </div>
                              <p className="service-description">{service.description}</p>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px'}}>
                                <div style={{display: 'flex', gap: '8px'}}>
                                  <button
                                    onClick={() => handlePrintServiceInvoice(service)}
                                    className="btn btn-outline"
                                    style={{padding: '6px 12px', fontSize: '12px', borderColor: '#3b82f6', color: '#3b82f6'}}
                                    title={language === 'ar' ? 'طباعة فاتورة' : 'Print Invoice'}
                                  >
                                    📄 {language === 'ar' ? 'فاتورة' : 'Invoice'}
                                  </button>
                                  {hasPermission('canManagePayments') && service.payment_status !== 'paid' && service.remaining_amount > 0 && (
                                    <button
                                      onClick={() => openPaymentModal(service)}
                                      className="btn btn-success"
                                      style={{padding: '6px 12px', fontSize: '12px'}}
                                    >
                                      💳 {t.pay}
                                    </button>
                                  )}
                                  
                                  {(service.payment_status === 'paid' || service.payment_status === 'partial') && (
                                    <button
                                      onClick={() => openPaymentsHistory(service)}
                                      className="btn btn-outline"
                                      style={{padding: '6px 12px', fontSize: '12px'}}
                                    >
                                      📋 {t.paymentHistory}
                                    </button>
                                  )}
                                </div>
                                {hasPermission('canDelete') && (
                                  <button
                                    onClick={() => handleDeleteService(service.id)}
                                    className="btn btn-danger"
                                    style={{padding: '6px 12px', fontSize: '12px'}}
                                    title={t.deleteService}
                                  >
                                    ❌
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-services">
                            <div style={{textAlign: 'center', padding: '40px 20px', color: '#6b7280'}}>
                              <div style={{fontSize: '48px', marginBottom: '16px'}}>🔧</div>
                              <p>{t.noServices}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : selectedCustomer ? (
              <>
                {/* هيدر تفاصيل العميل */}
                <div className="detail-header">
                  <div>
                    <h2 className="detail-title">
                      {selectedCustomer.name}
                    </h2>
                    <p className="detail-subtitle">{t.phone}: {selectedCustomer.phone}</p>
                  </div>
                  <div className="detail-actions">
                    {hasPermission('canGenerateReports') && (
                      <button 
                        className="btn btn-info"
                        onClick={() => setIsCustomerReportOpen(true)}
                      >
                        <span>📊</span> {t.report}
                      </button>
                    )}
                    {hasPermission('canManageCustomers') && (
                      <button 
                        className="btn btn-outline"
                        onClick={() => openEditCustomerModal(selectedCustomer)}
                      >
                        <span>✏️</span> {t.editCustomer}
                      </button>
                    )}
                    {hasPermission('canDelete') && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                      >
                        <span>🗑️</span> {t.deleteCustomer}
                      </button>
                    )}
                  </div>
                </div>

                {/* محتوى تفاصيل العميل */}
                <div className="detail-body">
                  <div className="detail-grid">
                    {/* معلومات العميل */}
                    <div>
                      <div className="card">
                        <h3 className="card-title">
                          <span>👤</span> {t.customerInfo}
                        </h3>
                        <div className="info-grid">
                          <div className="info-row">
                            <span className="info-label">{t.name}</span>
                            <span className="info-value">{selectedCustomer.name}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.phone}</span>
                            <span className="info-value">{selectedCustomer.phone}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.email}</span>
                            <span className="info-value">{selectedCustomer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">{t.address}</span>
                            <span className="info-value">{selectedCustomer.address || (language === 'ar' ? 'غير متوفر' : 'Not available')}</span>
                          </div>
                        </div>
                      </div>

                      {/* إحصائيات العميل */}
                      <div className="card" style={{marginTop: '24px'}}>
                        <h3 className="card-title">
                          <span>📊</span> {t.customerStats}
                        </h3>
                        <div className="info-grid">
                          {(() => {
                            const customerVehicles = getCustomerVehicles(selectedCustomer.id);
                            const customerServices = getCustomerServices(selectedCustomer.id);
                            const totalCost = customerServices.reduce((sum, service) => sum + parseFloat(service.cost || 0), 0);
                            const totalPaid = customerServices.reduce((sum, service) => sum + parseFloat(service.amount_paid || 0), 0);
                            const totalRemaining = totalCost - totalPaid;
                            
                            return (
                              <>
                                <div className="info-row">
                                  <span className="info-label">{t.totalVehicles}</span>
                                  <span className="info-value">{customerVehicles.length}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-label">{t.totalServices}</span>
                                  <span className="info-value">{customerServices.length}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-label">{t.totalCost}</span>
                                  <span className="info-value" style={{color: '#10b981', fontWeight: 'bold'}}>
                                    ${totalCost.toFixed(2)}
                                  </span>
                                </div>
                                <div className="info-row">
                                  <span className="info-label">{t.totalPaid}</span>
                                  <span className="info-value" style={{color: '#3b82f6', fontWeight: 'bold'}}>
                                    ${totalPaid.toFixed(2)}
                                  </span>
                                </div>
                                <div className="info-row">
                                  <span className="info-label">{t.amountDue}</span>
                                  <span className="info-value" style={{color: '#ef4444', fontWeight: 'bold'}}>
                                    ${totalRemaining.toFixed(2)}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* مركبات العميل */}
                    <div className="card">
                      <div className="services-header">
                        <h3 className="services-title">
                          <span>🚗</span> {t.vehicles} ({getCustomerVehicles(selectedCustomer.id).length})
                        </h3>
                      </div>
                      
                      <div className="services-scroll-container">
                        {getCustomerVehicles(selectedCustomer.id).length > 0 ? (
                          getCustomerVehicles(selectedCustomer.id).map(vehicle => (
                            <div key={vehicle.id} className="service-item">
                              <div className="service-header">
                                <div>
                                  <span className="service-type">{vehicle.make} {vehicle.model}</span>
                                  <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                    <StatusBadge status={vehicle.status} />
                                    <span className="status-badge status-completed">
                                      {getServicesForVehicle(vehicle.id).length} {language === 'ar' ? 'خدمات' : 'services'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{textAlign: language === 'ar' ? 'right' : 'left'}}>
                                  <span className="service-cost" style={{color: '#10b981'}}>
                                    ${getTotalCostForVehicle(vehicle.id).toFixed(2)}
                                  </span>
                                  <div style={{fontSize: '12px', color: '#3b82f6'}}>
                                    {t.paid}: ${getTotalPaidForVehicle(vehicle.id).toFixed(2)}
                                  </div>
                                  {getTotalCostForVehicle(vehicle.id) - getTotalPaidForVehicle(vehicle.id) > 0 && (
                                    <div style={{fontSize: '12px', color: '#ef4444'}}>
                                      {t.remaining}: ${(getTotalCostForVehicle(vehicle.id) - getTotalPaidForVehicle(vehicle.id)).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="service-meta">
                                <span className="service-meta-item">
                                  <span>📅</span> {t.year}: {vehicle.year}
                                </span>
                                <span className="service-meta-item">
                                  <span>🔢</span> {t.licensePlate}: {vehicle.license_plate}
                                </span>
                              </div>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px'}}>
                                <button
                                  onClick={() => setSelectedVehicle(vehicle)}
                                  className="btn btn-outline"
                                  style={{padding: '6px 12px', fontSize: '12px'}}
                                >
                                  👀 {t.viewDetails}
                                </button>
                                {hasPermission('canDelete') && (
                                  <button
                                    onClick={() => handleDeleteVehicle(vehicle.id)}
                                    className="btn btn-danger"
                                    style={{padding: '6px 12px', fontSize: '12px'}}
                                    title={t.deleteVehicle}
                                  >
                                    ❌
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-services">
                            <div style={{textAlign: 'center', padding: '40px 20px', color: '#6b7280'}}>
                              <div style={{fontSize: '48px', marginBottom: '16px'}}>🚗</div>
                              <p>{t.noVehicles}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <h3 className="empty-title">{t.welcome}</h3>
                <p className="empty-description">{t.selectVehicleCustomer}</p>
                <div style={{display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px'}}>
                  {hasPermission('canManageVehicles') && (
                    <button 
                      onClick={() => setIsVehicleFormOpen(true)}
                      className="btn btn-primary"
                    >
                      <span>➕</span> {t.addVehicle}
                    </button>
                  )}
                  {hasPermission('canManageCustomers') && (
                    <button 
                      onClick={() => setIsCustomerFormOpen(true)}
                      className="btn btn-secondary"
                    >
                      <span>➕</span> {t.addCustomer}
                    </button>
                  )}
                  {hasPermission('canManageServices') && (
                    <button 
                      onClick={() => setIsServiceFormOpen(true)}
                      className="btn btn-success"
                    >
                      <span>➕</span> {t.addService}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* نموذج تقرير الإيرادات */}
      {isRevenueReportOpen && (
        <div className="modal-overlay">
          <div className="modal report-modal" style={{maxWidth: '800px', maxHeight: '95vh', width: '95%', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header" style={{flexShrink: 0}}>
              <h3 className="modal-title">💰 {t.revenueReport}</h3>
              <button className="modal-close" onClick={() => {
                setIsRevenueReportOpen(false);
                resetRevenueReportDateRange();
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body-scrollable" style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
              <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
                {/* قسم المعلومات */}
                <div style={{marginBottom: '20px'}}>
                  <div style={{padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#8b5cf6'}}>
                      {t.revenueReportTitle}
                    </h3>
                    <p style={{color: '#6b7280', fontSize: '14px'}}>
                      {t.revenueReportDescription}
                    </p>
                  </div>

                  {/* خيارات الفترة الزمنية */}
                  <div style={{marginBottom: '20px'}}>
                    <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>
                      📅 {t.dateRange}
                    </h4>
                    
                    <div className="responsive-grid-2" style={{marginBottom: '12px'}}>
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.fromDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={revenueReportDateRange.startDate}
                          onChange={(e) => setRevenueReportDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.toDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={revenueReportDateRange.endDate}
                          onChange={(e) => setRevenueReportDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    {/* أزرار الفترات السريعة */}
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px'}}>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => setRevenueReportDateRange({
                          startDate: '',
                          endDate: new Date().toISOString().split('T')[0]
                        })}
                      >
                        {t.all}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 7);
                          setRevenueReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.week}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setMonth(start.getMonth() - 1);
                          setRevenueReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.month}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setFullYear(start.getFullYear() - 1);
                          setRevenueReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.year}
                      </button>
                    </div>

                    {/* ملخص الفلترة */}
                    {revenueReportDateRange.startDate || revenueReportDateRange.endDate ? (
                      <div style={{
                        background: '#f0f9ff',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '14px', fontWeight: '500', color: '#0369a1', marginBottom: '4px'}}>
                          📊 {t.filterSummary}:
                        </div>
                        <div style={{fontSize: '12px', color: '#075985'}}>
                          ${language === 'ar' ? 'عرض الإيرادات للفترة المحددة' : 'Showing revenue for selected period'}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#f0f9ff',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '12px', color: '#0369a1', textAlign: 'center'}}>
                          💡 ${language === 'ar' ? 'جميع الإيرادات' : 'All revenue'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ملخص الإيرادات */}
                <div style={{marginBottom: '24px'}}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>
                    📈 ${language === 'ar' ? 'ملخص الإيرادات' : 'Revenue Summary'}
                  </h4>
                  
                  <div className="responsive-grid-3" style={{marginBottom: '16px'}}>
                    <div style={{
                      background: '#f0fdf4',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid #bbf7d0',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '12px', color: '#166534', marginBottom: '8px'}}>
                        ✅ ${language === 'ar' ? 'الإيرادات المدفوعة' : 'Paid Revenue'}
                      </div>
                      <div style={{fontSize: '24px', fontWeight: 'bold', color: '#16a34a'}}>
                        ${(() => {
                          const paidRevenues = getPaidRevenuesByCustomer();
                          return Object.values(paidRevenues).reduce((sum, item) => sum + item.totalPaidRevenue, 0).toFixed(2);
                        })()}
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#fef2f2',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid #fecaca',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '12px', color: '#991b1b', marginBottom: '8px'}}>
                        ⏳ ${language === 'ar' ? 'الإيرادات المعلقة' : 'Pending Revenue'}
                      </div>
                      <div style={{fontSize: '24px', fontWeight: 'bold', color: '#dc2626'}}>
                        ${(() => {
                          const pendingRevenues = getPendingRevenuesByCustomer();
                          return Object.values(pendingRevenues).reduce((sum, item) => sum + item.totalPendingRevenue, 0).toFixed(2);
                        })()}
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#eff6ff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid #bfdbfe',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '12px', color: '#1e40af', marginBottom: '8px'}}>
                        📊 ${language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                      </div>
                      <div style={{fontSize: '24px', fontWeight: 'bold', color: '#3b82f6'}}>
                        ${(() => {
                          const totalRevenues = getTotalRevenuesByCustomer();
                          return Object.values(totalRevenues).reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* قائمة الإيرادات المدفوعة */}
                <div style={{marginBottom: '24px'}}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#16a34a'}}>
                    ✅ ${language === 'ar' ? 'الإيرادات المدفوعة' : 'Paid Revenue'}
                  </h4>
                  <div className="services-scroll-container" style={{maxHeight: '400px'}}>
                    {(() => {
                      const paidRevenues = getPaidRevenuesByCustomer();
                      const totalPaidRevenue = Object.values(paidRevenues).reduce((sum, item) => sum + item.totalPaidRevenue, 0);
                      
                      if (Object.keys(paidRevenues).length === 0) {
                        return (
                          <div style={{
                            textAlign: 'center',
                            color: '#6b7280',
                            padding: '40px 20px',
                            backgroundColor: 'white',
                            borderRadius: '6px'
                          }}>
                            <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
                            <p>{language === 'ar' ? 'لا توجد إيرادات مدفوعة في الفترة المحددة' : 'No paid revenue in the selected period'}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          {/* ملخص الإيرادات المدفوعة */}
                          <div style={{
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            border: '1px solid #10b981'
                          }}>
                            <div style={{textAlign: 'center'}}>
                              <div style={{fontSize: '12px', color: '#065f46', marginBottom: '4px'}}>
                                {language === 'ar' ? 'إجمالي الإيرادات المدفوعة' : 'Total Paid Revenue'}
                              </div>
                              <div style={{fontSize: '28px', fontWeight: 'bold', color: '#059669'}}>
                                $${totalPaidRevenue.toFixed(2)}
                              </div>
                              <div style={{fontSize: '12px', color: '#065f46', marginTop: '4px'}}>
                                {language === 'ar' ? 'عبر' : 'Across'} {Object.keys(paidRevenues).length} {language === 'ar' ? 'عميل' : 'customers'}
                              </div>
                            </div>
                          </div>
                          
                          {/* قائمة العملاء */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {Object.values(paidRevenues).map((item, index) => (
                              <div key={item.customer.id} style={{
                                background: 'white',
                                borderRadius: '8px',
                                border: '2px solid #bbf7d0',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '16px',
                                  background: '#f0fdf4',
                                  borderBottom: '1px solid #bbf7d0'
                                }}>
                                  <div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                                      <span style={{
                                        width: '24px',
                                        height: '24px',
                                        background: '#10b981',
                                        color: 'white',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        {index + 1}
                                      </span>
                                      <span style={{fontWeight: '600', fontSize: '15px', color: '#065f46'}}>
                                        {item.customer.name}
                                      </span>
                                    </div>
                                    <div style={{fontSize: '12px', color: '#6b7280', marginLeft: '32px'}}>
                                      📞 {item.customer.phone}
                                    </div>
                                  </div>
                                  <div style={{textAlign: language === 'ar' ? 'left' : 'right'}}>
                                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#059669'}}>
                                      $${item.totalPaidRevenue.toFixed(2)}
                                    </div>
                                    <div style={{fontSize: '12px', color: '#6b7280'}}>
                                      {item.servicesCount} {language === 'ar' ? 'خدمة' : 'services'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* تفاصيل الخدمات المدفوعة */}
                                <div style={{padding: '12px', fontSize: '13px', background: '#fafdfc'}}>
                                  {item.services.slice(0, 3).map(service => {
                                    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                                    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'غير معروف' : 'Unknown');
                                    return (
                                      <div key={service.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #e5e7eb'
                                      }}>
                                        <div>
                                          <span style={{fontWeight: '500', color: '#065f46'}}>{service.type}</span>
                                          <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '2px'}}>
                                            {vehicleName} • {service.date}
                                          </div>
                                        </div>
                                        <div style={{textAlign: language === 'ar' ? 'left' : 'right'}}>
                                          <div style={{color: '#059669', fontWeight: '500'}}>
                                            $${service.amount_paid || 0}
                                          </div>
                                          <div style={{fontSize: '11px', color: '#9ca3af'}}>
                                            ${language === 'ar' ? 'من' : 'of'} $${service.cost}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {item.services.length > 3 && (
                                    <div style={{
                                      textAlign: 'center',
                                      padding: '8px',
                                      color: '#6b7280',
                                      fontSize: '12px'
                                    }}>
                                      + {item.services.length - 3} {language === 'ar' ? 'خدمة إضافية' : 'more services'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* قائمة الإيرادات المعلقة */}
                <div style={{marginBottom: '16px'}}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#dc2626'}}>
                    ⏳ ${language === 'ar' ? 'الإيرادات المعلقة' : 'Pending Revenue'}
                  </h4>
                  <div className="services-scroll-container" style={{maxHeight: '400px'}}>
                    {(() => {
                      const pendingRevenues = getPendingRevenuesByCustomer();
                      const totalPendingRevenue = Object.values(pendingRevenues).reduce((sum, item) => sum + item.totalPendingRevenue, 0);
                      
                      if (Object.keys(pendingRevenues).length === 0) {
                        return (
                          <div style={{
                            textAlign: 'center',
                            color: '#6b7280',
                            padding: '40px 20px',
                            backgroundColor: 'white',
                            borderRadius: '6px'
                          }}>
                            <div style={{fontSize: '48px', marginBottom: '16px'}}>💰</div>
                            <p>{language === 'ar' ? 'لا توجد إيرادات معلقة في الفترة المحددة' : 'No pending revenue in the selected period'}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          {/* ملخص الإيرادات المعلقة */}
                          <div style={{
                            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            border: '1px solid #f87171'
                          }}>
                            <div style={{textAlign: 'center'}}>
                              <div style={{fontSize: '12px', color: '#991b1b', marginBottom: '4px'}}>
                                {language === 'ar' ? 'إجمالي الإيرادات المعلقة' : 'Total Pending Revenue'}
                              </div>
                              <div style={{fontSize: '28px', fontWeight: 'bold', color: '#dc2626'}}>
                                $${totalPendingRevenue.toFixed(2)}
                              </div>
                              <div style={{fontSize: '12px', color: '#991b1b', marginTop: '4px'}}>
                                {language === 'ar' ? 'عبر' : 'Across'} {Object.keys(pendingRevenues).length} {language === 'ar' ? 'عميل' : 'customers'}
                              </div>
                            </div>
                          </div>
                          
                          {/* قائمة العملاء */}
                          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                            {Object.values(pendingRevenues).map((item, index) => (
                              <div key={item.customer.id} style={{
                                background: 'white',
                                borderRadius: '8px',
                                border: '2px solid #fecaca',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '16px',
                                  background: '#fef2f2',
                                  borderBottom: '1px solid #fecaca'
                                }}>
                                  <div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                                      <span style={{
                                        width: '24px',
                                        height: '24px',
                                        background: '#dc2626',
                                        color: 'white',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        {index + 1}
                                      </span>
                                      <span style={{fontWeight: '600', fontSize: '15px', color: '#991b1b'}}>
                                        {item.customer.name}
                                      </span>
                                    </div>
                                    <div style={{fontSize: '12px', color: '#6b7280', marginLeft: '32px'}}>
                                      📞 {item.customer.phone}
                                    </div>
                                  </div>
                                  <div style={{textAlign: language === 'ar' ? 'left' : 'right'}}>
                                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#dc2626'}}>
                                      $${item.totalPendingRevenue.toFixed(2)}
                                    </div>
                                    <div style={{fontSize: '12px', color: '#6b7280'}}>
                                      {item.servicesCount} {language === 'ar' ? 'خدمة' : 'services'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* تفاصيل الخدمات المعلقة */}
                                <div style={{padding: '12px', fontSize: '13px', background: '#fdf7f7'}}>
                                  {item.services.slice(0, 3).map(service => {
                                    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                                    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'غير معروف' : 'Unknown');
                                    const remaining = parseFloat(service.remaining_amount) || 0;
                                    return (
                                      <div key={service.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #e5e7eb'
                                      }}>
                                        <div>
                                          <span style={{fontWeight: '500', color: '#991b1b'}}>{getServiceTypeLabel(service.type)}</span>
                                          <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '2px'}}>
                                            {vehicleName} • {service.date}
                                          </div>
                                        </div>
                                        <div style={{textAlign: language === 'ar' ? 'left' : 'right'}}>
                                          <div style={{color: '#dc2626', fontWeight: '500'}}>
                                            $${remaining.toFixed(2)}
                                          </div>
                                          <div style={{fontSize: '11px', color: '#9ca3af'}}>
                                            ${language === 'ar' ? 'من' : 'of'} $${service.cost}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {item.services.length > 3 && (
                                    <div style={{
                                      textAlign: 'center',
                                      padding: '8px',
                                      color: '#6b7280',
                                      fontSize: '12px'
                                    }}>
                                      + {item.services.length - 3} {language === 'ar' ? 'خدمة إضافية' : 'more services'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="form-actions" style={{padding: '20px', borderTop: '1px solid #e5e7eb', flexShrink: 0}}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsRevenueReportOpen(false);
                    resetRevenueReportDateRange();
                  }}
                >
                  {t.close}
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    className="btn btn-success" 
                    onClick={handleExportRevenueReport}
                    style={{background: '#10b981', color: 'white', border: 'none', marginInlineEnd: '8px'}}
                  >
                    📊 Excel
                  </button>
                )}
                <button 
                  className="btn btn-purple" 
                  onClick={handlePrintRevenueReport}
                  style={{background: '#8b5cf6', color: 'white', border: 'none'}}
                >
                  🖨️ {t.printReport}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة عميل جديد */}
      {isCustomerFormOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.addNewCustomer}</h3>
              <button className="modal-close" onClick={() => setIsCustomerFormOpen(false)}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleAddCustomer}>
                <div className="form-group">
                  <label className="form-label">{t.name} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.phone} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.email}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.address}</label>
                  <textarea
                    className="form-textarea"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder={`${t.address} (${t.optional})`}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsCustomerFormOpen(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-secondary">
                    {t.add}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تعديل العميل */}
      {isEditCustomerModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.editCustomer}</h3>
              <button className="modal-close" onClick={() => {
                setIsEditCustomerModalOpen(false);
                setSelectedCustomer(null);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleEditCustomer}>
                <div className="form-group">
                  <label className="form-label">{t.name} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editCustomer.name}
                    onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.phone} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editCustomer.phone}
                    onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.email}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editCustomer.email}
                    onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.address}</label>
                  <textarea
                    className="form-textarea"
                    value={editCustomer.address}
                    onChange={(e) => setEditCustomer({...editCustomer, address: e.target.value})}
                    placeholder={`${t.address} (${t.optional})`}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsEditCustomerModalOpen(false);
                    setSelectedCustomer(null);
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t.update}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة/تعديل فني */}
      {isTechnicianFormOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '500px', borderRadius: '16px', overflow: 'hidden'}}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedTechnician ? t.editTechnician : t.addTechnician}</h3>
              <button className="modal-close" style={{color: '#94a3b8'}} onClick={() => {
                setIsTechnicianFormOpen(false);
                setSelectedTechnician(null);
                setNewTechnician({ username: '', password: '', name: '', email: '', role: 'technician' });
                setEditTechnician({ username: '', password: '', name: '', email: '', role: 'technician' });
              }}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={selectedTechnician ? handleEditTechnician : handleAddTechnician}>
                <div className="form-group">
                  <label className="form-label">{t.name} <span className="required-star">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={selectedTechnician ? editTechnician.name : newTechnician.name}
                    onChange={(e) => selectedTechnician 
                      ? setEditTechnician({...editTechnician, name: e.target.value})
                      : setNewTechnician({...newTechnician, name: e.target.value})
                    }
                    placeholder={t.name}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.username} <span className="required-star">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={selectedTechnician ? editTechnician.username : newTechnician.username}
                    onChange={(e) => selectedTechnician 
                      ? setEditTechnician({...editTechnician, username: e.target.value})
                      : setNewTechnician({...newTechnician, username: e.target.value})
                    }
                    placeholder={t.username}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.email} ({t.optional})</label>
                  <input
                    type="email"
                    className="form-input"
                    value={selectedTechnician ? editTechnician.email : newTechnician.email}
                    onChange={(e) => selectedTechnician 
                      ? setEditTechnician({...editTechnician, email: e.target.value})
                      : setNewTechnician({...newTechnician, email: e.target.value})
                    }
                    placeholder={t.email}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.password} {selectedTechnician ? `(${t.optional})` : <span className='required-star'>*</span>}</label>
                  <input
                    type="password"
                    required={!selectedTechnician}
                    className="form-input"
                    value={selectedTechnician ? editTechnician.password : newTechnician.password}
                    onChange={(e) => selectedTechnician 
                      ? setEditTechnician({...editTechnician, password: e.target.value})
                      : setNewTechnician({...newTechnician, password: e.target.value})
                    }
                    placeholder={selectedTechnician ? t.leaveBlankForNoChange : t.password}
                  />
                  {selectedTechnician && (
                    <p style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                      {t.leaveBlankForNoChange}
                    </p>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsTechnicianFormOpen(false);
                    setSelectedTechnician(null);
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedTechnician ? t.update : t.add}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة مركبة */}
      {isVehicleFormOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.addNewVehicle}</h3>
              <button className="modal-close" onClick={() => setIsVehicleFormOpen(false)}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleAddVehicle}>
                <div className="form-group">
                  <label className="form-label">{t.make} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                    placeholder={t.make}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.model} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    placeholder={t.model}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.year}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear()})}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.licensePlate} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newVehicle.license_plate}
                    onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                    placeholder={t.licensePlate}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.selectCustomer} *</label>
                  <select
                    required
                    className="form-input"
                    value={newVehicle.customer_id}
                    onChange={(e) => setNewVehicle({...newVehicle, customer_id: e.target.value})}
                  >
                    <option value="">{t.selectCustomer}</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.status}</label>
                  <select
                    className="form-input"
                    value={newVehicle.status}
                    onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                  >
                    <option value="pending">{t.statusPending}</option>
                    <option value="in-service">{t.statusInService}</option>
                    <option value="completed">{t.statusCompleted}</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsVehicleFormOpen(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t.add}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تعديل المركبة */}
      {isEditVehicleModalOpen && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.editVehicle}</h3>
              <button className="modal-close" onClick={() => {
                setIsEditVehicleModalOpen(false);
                setSelectedVehicle(null);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleEditVehicle}>
                <div className="form-group">
                  <label className="form-label">{t.make} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editVehicle.make}
                    onChange={(e) => setEditVehicle({...editVehicle, make: e.target.value})}
                    placeholder={t.make}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.model} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editVehicle.model}
                    onChange={(e) => setEditVehicle({...editVehicle, model: e.target.value})}
                    placeholder={t.model}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.year}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editVehicle.year}
                    onChange={(e) => setEditVehicle({...editVehicle, year: parseInt(e.target.value) || new Date().getFullYear()})}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.licensePlate} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editVehicle.license_plate}
                    onChange={(e) => setEditVehicle({...editVehicle, license_plate: e.target.value})}
                    placeholder={t.licensePlate}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.selectCustomer} *</label>
                  <select
                    required
                    className="form-input"
                    value={editVehicle.customer_id}
                    onChange={(e) => setEditVehicle({...editVehicle, customer_id: e.target.value})}
                  >
                    <option value="">{t.selectCustomer}</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.status}</label>
                  <select
                    className="form-input"
                    value={editVehicle.status}
                    onChange={(e) => setEditVehicle({...editVehicle, status: e.target.value})}
                  >
                    <option value="pending">{t.statusPending}</option>
                    <option value="in-service">{t.statusInService}</option>
                    <option value="completed">{t.statusCompleted}</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsEditVehicleModalOpen(false);
                    setSelectedVehicle(null);
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t.update}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة خدمة جديدة */}
      {isServiceFormOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.addNewService}</h3>
              <button className="modal-close" onClick={() => setIsServiceFormOpen(false)}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleAddService}>
                <div className="form-group">
                  <label className="form-label">{t.selectVehicle} *</label>
                  <select
                    required
                    className="form-input"
                    value={newService.vehicle_id}
                    onChange={(e) => setNewService({...newService, vehicle_id: e.target.value})}
                  >
                    <option value="">{t.selectVehicle}</option>
                    {getAvailableVehicles().map(vehicle => {
                      const customer = getCustomerById(vehicle.customer_id);
                      return (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} - {vehicle.license_plate} 
                          {customer && ` (${customer.name})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.serviceType} *</label>
                  <select
                    required
                    className="form-input"
                    value={newService.type}
                    onChange={(e) => setNewService({...newService, type: e.target.value})}
                  >
                    <option value="">{t.selectServiceType}</option>
                    <option value="oilChange">{t.oilChange}</option>
                    <option value="brakeService">{t.brakeService}</option>
                    <option value="tireRotation">{t.tireRotation}</option>
                    <option value="engineRepair">{t.engineRepair}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.description} *</label>
                  <textarea
                    required
                    className="form-textarea"
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    placeholder={t.descriptionPlaceholder}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.technician} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newService.technician}
                    onChange={(e) => setNewService({...newService, technician: e.target.value})}
                    placeholder={t.technicianPlaceholder}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.date} *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={newService.date}
                    onChange={(e) => setNewService({...newService, date: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.cost} *</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={newService.cost}
                    onChange={(e) => setNewService({...newService, cost: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.status}</label>
                  <select
                    className="form-input"
                    value={newService.status}
                    onChange={(e) => setNewService({...newService, status: e.target.value})}
                  >
                    <option value="pending">{t.statusPending}</option>
                    <option value="in-service">{t.statusInService}</option>
                    <option value="completed">{t.statusCompleted}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.paymentStatus}</label>
                  <select
                    className="form-input"
                    value={newService.payment_status}
                    onChange={(e) => setNewService({...newService, payment_status: e.target.value})}
                  >
                    <option value="pending">{t.paymentPending}</option>
                    <option value="partial">{t.paymentPartial}</option>
                    <option value="paid">{t.paymentPaid}</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsServiceFormOpen(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-success">
                    {t.add}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج الدفع */}
      {isPaymentOpen && selectedService && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.payment}</h3>
              <button className="modal-close" onClick={() => {
                setIsPaymentOpen(false);
                setSelectedService(null);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{padding: '12px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px'}}>
                <p style={{fontSize: '14px', fontWeight: '500', marginBottom: '4px'}}>
                  {t.serviceType}: {getServiceTypeLabel(selectedService.type)}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                  {t.cost}: ${selectedService.cost}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                  {t.paid}: ${selectedService.amount_paid || 0}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280'}}>
                  {t.remaining}: ${selectedService.remaining_amount || selectedService.cost}
                </p>
              </div>
              
              <form onSubmit={handlePayment}>
                <div className="form-group">
                  <label className="form-label">{t.amountToPay} ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={selectedService.remaining_amount || selectedService.cost}
                    step="0.01"
                    className="form-input"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    {t.maxAmount}: ${selectedService.remaining_amount || selectedService.cost}
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.paymentMethod}</label>
                  <select
                    required
                    className="form-select"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="card">{t.card}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="check">{t.check}</option>
                  </select>
                </div>
                
                {paymentData.paymentMethod !== 'cash' && (
                  <div className="form-group">
                    <label className="form-label">{t.transactionId}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                      placeholder={t.transactionPlaceholder}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">{t.paymentNotes}</label>
                  <textarea
                    className="form-textarea"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder={t.paymentNotesPlaceholder}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsPaymentOpen(false);
                    setSelectedService(null);
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-success">
                    💳 {t.confirmPayment}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج الدفع الشامل */}
      {isBulkPaymentOpen && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.bulkPaymentTitle}</h3>
              <button className="modal-close" onClick={() => {
                setIsBulkPaymentOpen(false);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{padding: '16px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px'}}>
                <p style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e40af'}}>
                  {selectedVehicle.make} {selectedVehicle.model} - {selectedVehicle.license_plate}
                </p>
                <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>
                  {t.bulkPaymentDescription}
                </p>
              </div>
              
              {/* قائمة الخدمات المشمولة */}
              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>
                  📋 {t.servicesIncluded}
                </h4>
                
                <div style={{maxHeight: '300px', overflowY: 'auto', padding: '8px', background: '#f9fafb', borderRadius: '8px'}}>
                  {(() => {
                    const vehicleServices = getServicesForVehicle(selectedVehicle.id);
                    const servicesWithRemaining = vehicleServices.filter(service => {
                      const remaining = parseFloat(service.remaining_amount) || 0;
                      return remaining > 0 && service.payment_status !== 'paid';
                    });
                    
                    if (servicesWithRemaining.length === 0) {
                      return (
                        <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                          <div style={{fontSize: '48px', marginBottom: '12px'}}>✅</div>
                          <p>{t.noServicesForBulkPayment}</p>
                        </div>
                      );
                    }
                    
                    const totalRemaining = servicesWithRemaining.reduce((sum, service) => {
                      const remaining = parseFloat(service.remaining_amount) || 0;
                      return sum + remaining;
                    }, 0);
                    
                    return (
                      <>
                        <div style={{marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                              <span style={{fontWeight: '600', fontSize: '14px'}}>{t.totalRemainingAmount}</span>
                              <div style={{fontSize: '12px', color: '#6b7280', marginTop: '2px'}}>
                                {t.servicesCountForBulkPayment}: {servicesWithRemaining.length}
                              </div>
                            </div>
                            <span style={{fontSize: '20px', fontWeight: 'bold', color: '#ef4444'}}>
                              ${totalRemaining.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {servicesWithRemaining.map(service => {
                            const remaining = parseFloat(service.remaining_amount) || 0;
                            return (
                              <div key={service.id} style={{
                                padding: '12px',
                                background: 'white',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                  <div>
                                    <div style={{fontWeight: '600', fontSize: '14px'}}>{getServiceTypeLabel(service.type)}</div>
                                    <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
                                      {service.date} | {service.technician}
                                    </div>
                                  </div>
                                  <div style={{textAlign: language === 'ar' ? 'right' : 'left'}}>
                                    <div style={{fontSize: '14px', color: '#1f2937'}}>${service.cost}</div>
                                    <div style={{fontSize: '12px', color: '#ef4444'}}>
                                      {t.remaining}: ${remaining.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <form onSubmit={handleBulkPayment}>
                <div className="form-group">
                  <label className="form-label">{t.amountToPay} ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="form-input"
                    value={bulkPaymentData.amount}
                    onChange={(e) => setBulkPaymentData({...bulkPaymentData, amount: parseFloat(e.target.value) || 0})}
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    {t.maxAmount}: ${(() => {
                      const vehicleServices = getServicesForVehicle(selectedVehicle.id);
                      const servicesWithRemaining = vehicleServices.filter(service => {
                        const remaining = parseFloat(service.remaining_amount) || 0;
                        return remaining > 0 && service.payment_status !== 'paid';
                      });
                      const totalRemaining = servicesWithRemaining.reduce((sum, service) => {
                        const remaining = parseFloat(service.remaining_amount) || 0;
                        return sum + remaining;
                      }, 0);
                      return totalRemaining.toFixed(2);
                    })()}
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.paymentMethod}</label>
                  <select
                    required
                    className="form-select"
                    value={bulkPaymentData.paymentMethod}
                    onChange={(e) => setBulkPaymentData({...bulkPaymentData, paymentMethod: e.target.value})}
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="card">{t.card}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="check">{t.check}</option>
                  </select>
                </div>
                
                {bulkPaymentData.paymentMethod !== 'cash' && (
                  <div className="form-group">
                    <label className="form-label">{t.transactionId}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bulkPaymentData.transactionId}
                      onChange={(e) => setBulkPaymentData({...bulkPaymentData, transactionId: e.target.value})}
                      placeholder={t.transactionPlaceholder}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">{t.paymentNotes}</label>
                  <textarea
                    className="form-textarea"
                    value={bulkPaymentData.notes}
                    onChange={(e) => setBulkPaymentData({...bulkPaymentData, notes: e.target.value})}
                    placeholder={t.paymentNotesPlaceholder}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsBulkPaymentOpen(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-warning">
                    💰 {t.payAllServices}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج سجل الدفعات */}
      {isPaymentsHistoryOpen && selectedServiceForPayments && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '900px'}}>
            <div className="modal-header">
              <h3 className="modal-title">{t.paymentHistory} - {selectedServiceForPayments.type}</h3>
              <button className="modal-close" onClick={() => {
                setIsPaymentsHistoryOpen(false);
                setSelectedServiceForPayments(null);
                setPayments([]);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{padding: '12px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px'}}>
                <p style={{fontSize: '14px', fontWeight: '500', marginBottom: '4px'}}>
                  {t.serviceType}: {getServiceTypeLabel(selectedServiceForPayments.type)}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                  {t.totalCost}: ${selectedServiceForPayments.cost}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                  {t.paid}: ${selectedServiceForPayments.amount_paid || 0}
                </p>
                <p style={{fontSize: '12px', color: '#6b7280'}}>
                  {t.remaining}: ${selectedServiceForPayments.remaining_amount || selectedServiceForPayments.cost}
                </p>
              </div>

              <div className="payments-table-container">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>{t.date}</th>
                      <th>{t.amountToPay}</th>
                      <th>{t.paymentMethod}</th>
                      <th>{t.transactionId}</th>
                      <th>{t.notes}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length > 0 ? (
                      payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{payment.payment_date}</td>
                          <td style={{color: '#10b981', fontWeight: 'bold'}}>${payment.amount}</td>
                          <td>
                            <span className="payment-method-badge">
                              {payment.payment_method === 'cash' ? (language === 'ar' ? '💵 نقدي' : '💵 Cash') : 
                               payment.payment_method === 'card' ? (language === 'ar' ? '💳 بطاقة' : '💳 Card') :
                               payment.payment_method === 'transfer' ? (language === 'ar' ? '🏦 تحويل' : '🏦 Transfer') : (language === 'ar' ? '📄 شيك' : '📄 Check')}
                            </span>
                          </td>
                          <td>{payment.transaction_id || '-'}</td>
                          <td>{payment.notes || '-'}</td>
                          <td>
                            <div style={{display: 'flex', gap: '8px'}}>
                              <button
                                onClick={() => handlePrintReceipt(payment, selectedServiceForPayments)}
                                className="btn btn-outline"
                                style={{padding: '4px 8px', fontSize: '12px', borderColor: '#8b5cf6', color: '#8b5cf6'}}
                                title={t.printReceipt}
                              >
                                🖨️
                              </button>
                              {hasPermission('canEditPayments') && (
                                <button
                                  onClick={() => openEditSinglePaymentModal(payment)}
                                  className="btn btn-outline"
                                  style={{padding: '4px 8px', fontSize: '12px'}}
                                  title={t.edit}
                                >
                                  ✏️ {t.edit}
                                </button>
                              )}
                              {hasPermission('canDelete') && (
                                <button
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="btn btn-danger"
                                  style={{padding: '4px 8px', fontSize: '12px'}}
                                  title={t.delete}
                                >
                                  ❌ {t.delete}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                          {t.noPayments}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {payments.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="1" style={{fontWeight: 'bold'}}>{language === 'ar' ? 'المجموع' : 'Total'}:</td>
                        <td style={{fontWeight: 'bold', color: '#10b981'}}>
                          ${payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                        </td>
                        <td colSpan="4"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="form-actions" style={{marginTop: '20px'}}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsPaymentsHistoryOpen(false);
                    setSelectedServiceForPayments(null);
                    setPayments([]);
                  }}
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تعديل دفعة فردية */}
      {isEditPaymentModalOpen && selectedPaymentForEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{t.editPayment}</h3>
              <button className="modal-close" onClick={() => {
                setIsEditPaymentModalOpen(false);
                setSelectedPaymentForEdit(null);
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{padding: '12px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px'}}>
                <p style={{fontSize: '14px', fontWeight: '500'}}>
                  {t.editPayment}: {selectedServiceForPayments?.type}
                </p>
              </div>
              
              <form onSubmit={handleEditSinglePayment}>
                <div className="form-group">
                  <label className="form-label">{t.amountToPay} ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="form-input"
                    value={editSinglePaymentData.amount}
                    onChange={(e) => setEditSinglePaymentData({
                      ...editSinglePaymentData, 
                      amount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.paymentMethod}</label>
                  <select
                    required
                    className="form-select"
                    value={editSinglePaymentData.paymentMethod}
                    onChange={(e) => setEditSinglePaymentData({
                      ...editSinglePaymentData, 
                      paymentMethod: e.target.value
                    })}
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="card">{t.card}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="check">{t.check}</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.paymentDate}</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={editSinglePaymentData.paymentDate}
                    onChange={(e) => setEditSinglePaymentData({
                      ...editSinglePaymentData, 
                      paymentDate: e.target.value
                    })}
                  />
                </div>
                
                {editSinglePaymentData.paymentMethod !== 'cash' && (
                  <div className="form-group">
                    <label className="form-label">{t.transactionId}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editSinglePaymentData.transactionId}
                      onChange={(e) => setEditSinglePaymentData({
                        ...editSinglePaymentData, 
                        transactionId: e.target.value
                      })}
                      placeholder={t.transactionPlaceholder}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">{t.notes}</label>
                  <textarea
                    className="form-textarea"
                    value={editSinglePaymentData.notes}
                    onChange={(e) => setEditSinglePaymentData({
                      ...editSinglePaymentData, 
                      notes: e.target.value
                    })}
                    placeholder={t.paymentNotesPlaceholder}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsEditPaymentModalOpen(false);
                    setSelectedPaymentForEdit(null);
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    💾 {t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تقرير المركبة */}
      {isVehicleReportOpen && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal report-modal" style={{maxWidth: '700px', maxHeight: '95vh', width: '95%', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header" style={{flexShrink: 0}}>
              <h3 className="modal-title">{t.vehicleReport}</h3>
              <button className="modal-close" onClick={() => {
                setIsVehicleReportOpen(false);
                resetReportDateRange();
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body-scrollable" style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
              <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
                {/* قسم المعلومات الثابتة */}
                <div style={{flexShrink: 0}}>
                  <div style={{padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                    </h3>
                    <p style={{color: '#6b7280', marginBottom: '4px'}}>
                      {t.licensePlate}: {selectedVehicle.license_plate}
                    </p>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
                      <span style={{fontSize: '12px', fontWeight: '500'}}>{t.status}: </span>
                      <StatusBadge status={selectedVehicle.status} />
                    </div>
                  </div>

                  {/* خيارات الفترة الزمنية */}
                  <div style={{marginBottom: '20px'}}>
                    <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>
                      📅 {t.dateRange}
                    </h4>
                    
                    <div className="responsive-grid-2" style={{marginBottom: '12px'}}>
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.fromDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={reportDateRange.startDate}
                          onChange={(e) => setReportDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.toDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={reportDateRange.endDate}
                          onChange={(e) => setReportDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    {/* أزرار الفترات السريعة */}
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px'}}>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => setReportDateRange({
                          startDate: '',
                          endDate: new Date().toISOString().split('T')[0]
                        })}
                      >
                        {t.all}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 7);
                          setReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.week}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setMonth(start.getMonth() - 1);
                          setReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.month}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setFullYear(start.getFullYear() - 1);
                          setReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.year}
                      </button>
                    </div>

                    {/* ملخص الفلترة */}
                    {reportDateRange.startDate || reportDateRange.endDate ? (
                      <div style={{
                        background: '#e8f5e8',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '14px', fontWeight: '500', color: '#16a34a', marginBottom: '4px'}}>
                          📊 {t.filterSummary}:
                        </div>
                        <div style={{fontSize: '12px', color: '#065f46'}}>
                          {t.servicesInPeriod}: {getFilteredServicesForVehicle(selectedVehicle.id).length} {t.ofTotal} {getServicesForVehicle(selectedVehicle.id).length}
                          <br />
                          {t.costInPeriod}: ${getFilteredTotalCostForVehicle(selectedVehicle.id).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#f0f9ff',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '12px', color: '#0369a1', textAlign: 'center'}}>
                          💡 {t.allServices}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* قسم سجل الخدمات مع السكرول */}
                <div style={{marginBottom: '16px'}}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>
                    🔧 {t.serviceHistory}
                  </h4>
                  <div className="services-scroll-container" style={{maxHeight: '400px'}}>
                    {getFilteredServicesForVehicle(selectedVehicle.id).length > 0 ? (
                      getFilteredServicesForVehicle(selectedVehicle.id).map((service) => (
                        <div key={service.id} className="service-item">
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                            <div>
                              <h5 style={{fontWeight: '600', fontSize: '14px', color: '#1f2937'}}>{service.type}</h5>
                              <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                <StatusBadge status={service.status} />
                                <PaymentBadge status={service.payment_status} />
                              </div>
                            </div>
                            <span style={{fontWeight: 'bold', color: '#10b981', fontSize: '14px'}}>$${service.cost}</span>
                          </div>
                          <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '6px'}}>
                            📅 {service.date} | 👤 {service.technician}
                          </p>
                          <p style={{fontSize: '12px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.4'}}>
                            {service.description}
                          </p>
                          {service.payment_status === 'paid' && service.payment_method && (
                            <div style={{fontSize: '11px', color: '#059669', marginBottom: '8px'}}>
                              💳 {language === 'ar' ? 'تم الدفع بواسطة' : 'Paid by'}: {service.payment_method} 
                              {service.transaction_id && ` (${service.transaction_id})`}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: '#6b7280',
                        padding: '40px 20px',
                        backgroundColor: 'white',
                        borderRadius: '6px'
                      }}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>📊</div>
                        {reportDateRange.startDate || reportDateRange.endDate 
                          ? t.noServices 
                          : t.noServices}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* التكلفة الإجمالية */}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  marginTop: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span>{t.totalCost}:</span>
                    <span style={{color: '#10b981', fontSize: '20px'}}>
                      ${getFilteredTotalCostForVehicle(selectedVehicle.id).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="form-actions" style={{padding: '20px', borderTop: '1px solid #e5e7eb', flexShrink: 0}}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsVehicleReportOpen(false);
                    resetReportDateRange();
                  }}
                >
                  {t.close}
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    className="btn btn-success" 
                    onClick={handleExportVehicleReport}
                    disabled={getFilteredServicesForVehicle(selectedVehicle.id).length === 0}
                    style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', marginInlineEnd: '8px'}}
                  >
                    <span>📊</span> Excel
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={handlePrintVehicleReport}
                  disabled={getFilteredServicesForVehicle(selectedVehicle.id).length === 0}
                  style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <span>🖨️</span> {t.printReport}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نموذج تقرير العميل */}
      {isCustomerReportOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal report-modal" style={{maxWidth: '800px', maxHeight: '95vh', width: '95%', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header" style={{flexShrink: 0}}>
              <h3 className="modal-title">{t.customerReport}</h3>
              <button className="modal-close" onClick={() => {
                setIsCustomerReportOpen(false);
                resetCustomerReportDateRange();
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body-scrollable" style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
              <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
                {/* قسم المعلومات الثابتة */}
                <div style={{flexShrink: 0}}>
                  <div style={{padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                      {selectedCustomer.name}
                    </h3>
                    <p style={{color: '#6b7280', marginBottom: '4px'}}>
                      {t.phone}: {selectedCustomer.phone}
                    </p>
                    <p style={{color: '#6b7280', marginBottom: '4px'}}>
                      {t.email}: {selectedCustomer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}
                    </p>
                    <p style={{color: '#6b7280'}}>
                      {t.address}: {selectedCustomer.address || (language === 'ar' ? 'غير متوفر' : 'Not available')}
                    </p>
                  </div>

                  {/* خيارات الفترة الزمنية */}
                  <div style={{marginBottom: '20px'}}>
                    <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151'}}>
                      📅 {t.dateRange}
                    </h4>
                    
                    <div className="responsive-grid-2" style={{marginBottom: '12px'}}>
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.fromDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={customerReportDateRange.startDate}
                          onChange={(e) => setCustomerReportDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">{t.toDate}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={customerReportDateRange.endDate}
                          onChange={(e) => setCustomerReportDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    {/* أزرار الفترات السريعة */}
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px'}}>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => setCustomerReportDateRange({
                          startDate: '',
                          endDate: new Date().toISOString().split('T')[0]
                        })}
                      >
                        {t.all}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 7);
                          setCustomerReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.week}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setMonth(start.getMonth() - 1);
                          setCustomerReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.month}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{fontSize: '12px', padding: '6px 12px'}}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setFullYear(start.getFullYear() - 1);
                          setCustomerReportDateRange({
                            startDate: start.toISOString().split('T')[0],
                            endDate: end.toISOString().split('T')[0]
                          });
                        }}
                      >
                        {t.year}
                      </button>
                    </div>

                    {/* ملخص الفلترة */}
                    {customerReportDateRange.startDate || customerReportDateRange.endDate ? (
                      <div style={{
                        background: '#e8f5e8',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '14px', fontWeight: '500', color: '#16a34a', marginBottom: '4px'}}>
                          📊 {t.filterSummary}:
                        </div>
                        <div style={{fontSize: '12px', color: '#065f46'}}>
                          {t.servicesInPeriod}: {getFilteredCustomerServices(selectedCustomer.id).length} {t.ofTotal} {getCustomerServices(selectedCustomer.id).length}
                          <br />
                          {t.costInPeriod}: ${getCustomerStats(selectedCustomer.id).filteredCost.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: '#f0f9ff',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        marginBottom: '16px'
                      }}>
                        <div style={{fontSize: '12px', color: '#0369a1', textAlign: 'center'}}>
                          💡 {t.allServices}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* قسم سجل الخدمات مع السكرول */}
                <div style={{marginBottom: '16px'}}>
                  <h4 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>
                    🔧 {t.serviceHistory}
                  </h4>
                  <div className="services-scroll-container" style={{maxHeight: '400px'}}>
                    {getFilteredCustomerServices(selectedCustomer.id).length > 0 ? (
                      getFilteredCustomerServices(selectedCustomer.id).map((service) => {
                        const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                        const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : (language === 'ar' ? 'مركبة غير معروفة' : 'Unknown Vehicle');
                        return (
                          <div key={service.id} className="service-item">
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                              <div>
                                <h5 style={{fontWeight: '600', fontSize: '14px', color: '#1f2937'}}>{service.type}</h5>
                                <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                                  {t.vehicles}: {vehicleName}
                                </p>
                                <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                                  <StatusBadge status={service.status} />
                                  <PaymentBadge status={service.payment_status} />
                                </div>
                              </div>
                              <span style={{fontWeight: 'bold', color: '#10b981', fontSize: '14px'}}>$${service.cost}</span>
                            </div>
                            <p style={{fontSize: '12px', color: '#6b7280', marginBottom: '6px'}}>
                              📅 {service.date} | 👤 {service.technician}
                            </p>
                            <p style={{fontSize: '12px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.4'}}>
                              {service.description}
                            </p>
                            {service.payment_status === 'paid' && service.payment_method && (
                              <div style={{fontSize: '11px', color: '#059669', marginBottom: '8px'}}>
                                💳 {language === 'ar' ? 'تم الدفع بواسطة' : 'Paid by'}: {service.payment_method} 
                                {service.transaction_id && ` (${service.transaction_id})`}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: '#6b7280',
                        padding: '40px 20px',
                        backgroundColor: 'white',
                        borderRadius: '6px'
                      }}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>📊</div>
                        {customerReportDateRange.startDate || customerReportDateRange.endDate 
                          ? t.noServices 
                          : t.noServices}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* التكلفة الإجمالية والمبلغ المستحق */}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  marginTop: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '12px'
                  }}>
                    <span>{t.totalCost}:</span>
                    <span style={{color: '#10b981', fontSize: '20px'}}>
                      ${getCustomerStats(selectedCustomer.id).filteredCost.toFixed(2)}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    backgroundColor: '#fef2f2',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <span>{t.amountDueCustomer}:</span>
                    <span style={{color: '#ef4444', fontSize: '20px'}}>
                      ${getCustomerStats(selectedCustomer.id).filteredRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="form-actions" style={{padding: '20px', borderTop: '1px solid #e5e7eb', flexShrink: 0}}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setIsCustomerReportOpen(false);
                    resetCustomerReportDateRange();
                  }}
                >
                  {t.close}
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    className="btn btn-success" 
                    onClick={handleExportCustomerReport}
                    disabled={getFilteredCustomerServices(selectedCustomer.id).length === 0}
                    style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', marginInlineEnd: '8px'}}
                  >
                    <span>📊</span> Excel
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={handlePrintCustomerReport}
                  disabled={getFilteredCustomerServices(selectedCustomer.id).length === 0}
                  style={{display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  <span>🖨️</span> {t.printReport}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* صفحة إدارة حسابات الأدمن */}
      {isAdminAccountsOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '16px'}}>
            {/* رأس الصفحة */}
            <div className="modal-header">
              <h3 className="modal-title">👥 {t.adminAccounts}</h3>
              <button className="modal-close" onClick={() => {
                setIsAdminAccountsOpen(false);
                setSelectedUser(null);
              }}>
                ❌
              </button>
            </div>
            
            {/* محتوى الصفحة */}
            <div className="modal-body" style={{display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', padding: '20px'}}>
              {/* قائمة المستخدمين */}
              <div style={{flex: '0 0 30%', borderRight: language === 'ar' ? 'none' : '1px solid #e5e7eb', borderLeft: language === 'ar' ? '1px solid #e5e7eb' : 'none', overflowY: 'auto', paddingRight: language === 'ar' ? '0' : '16px', paddingLeft: language === 'ar' ? '16px' : '0'}}>
                <h4 style={{marginBottom: '16px', fontWeight: '600', fontSize: '16px'}}>{t.allUsers} ({allUsers.length})</h4>
                {allUsers.length === 0 ? (
                  <p style={{color: '#6b7280', textAlign: 'center', paddingTop: '40px'}}>لا توجد حسابات</p>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {allUsers && allUsers.length > 0 ? allUsers.map(user => (
                      <div
                        key={user.id || user.username}
                        onClick={() => {
                          console.log('✅ تم اختيار المستخدم:', user);
                          setSelectedUser(user);
                        }}
                        style={{
                          padding: '12px',
                          border: selectedUser?.id === user.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedUser?.id === user.id ? '#eff6ff' : '#f9fafb',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{fontWeight: '600', marginBottom: '4px', fontSize: '14px'}}>
                          {user.name && user.name.trim() ? user.name : (user.username || 'بدون اسم')}
                        </div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                          @{user.username || 'بدون اسم مستخدم'}
                        </div>
                        <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '4px'}}>
                          {getRoleLabel(user.role || 'user')}
                        </div>
                      </div>
                    )) : (
                      <div style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>
                        لا توجد حسابات
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* تفاصيل المستخدم */}
              <div style={{flex: 1, overflowY: 'auto', paddingRight: language === 'ar' ? '16px' : '0', paddingLeft: language === 'ar' ? '0' : '16px'}}>
                {selectedUser ? (
                  <div>
                    <h4 style={{marginBottom: '16px', fontWeight: '600', fontSize: '16px'}}>{t.accountDetails}</h4>
                    
                    {/* معلومات المستخدم */}
                    <div style={{backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
                      <div style={{marginBottom: '12px'}}>
                        <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.name}</label>
                        <div style={{fontWeight: '600', fontSize: '15px'}}>
                          {selectedUser.name && selectedUser.name.trim() ? selectedUser.name : (selectedUser.username || t.noName)}
                        </div>
                      </div>
                      
                      <div style={{marginBottom: '12px'}}>
                        <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.username}</label>
                        <div style={{fontWeight: '600', fontSize: '15px'}}>
                          @{selectedUser.username || t.noUsername}
                        </div>
                      </div>
                      
                      <div style={{marginBottom: '12px'}}>
                        <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.userRole}</label>
                        <div style={{fontWeight: '600', fontSize: '15px', display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '6px'}}>
                          {getRoleLabel(selectedUser.role || 'user')}
                        </div>
                      </div>
                      
                      {selectedUser.email && selectedUser.email.trim() && (
                        <div style={{marginBottom: '12px'}}>
                          <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.email}</label>
                          <div style={{fontWeight: '600', fontSize: '15px'}}>{selectedUser.email}</div>
                        </div>
                      )}
                      
                      {selectedUser.created_at && (
                        <div style={{marginBottom: '12px'}}>
                          <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.createdDate}</label>
                          <div style={{fontSize: '14px', color: '#6b7280'}}>
                            {new Date(selectedUser.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </div>
                        </div>
                      )}
                      
                      <div style={{marginBottom: '12px', paddingTop: '12px', borderTop: '1px solid #d1d5db'}}>
                        <label style={{fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px'}}>{t.userId}</label>
                        <div style={{fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace'}}>
                          {selectedUser.id}
                        </div>
                      </div>
                    </div>
                    
                    {/* أزرار الإجراءات */}
                    <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setIsResetPasswordModalOpen(true)}
                        style={{width: '100%', padding: '10px', fontSize: '14px'}}
                      >
                        🔐 {t.resetPassword}
                      </button>
                      
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        style={{width: '100%', padding: '10px', fontSize: '14px'}}
                      >
                        🗑️ {t.delete}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center', color: '#6b7280', paddingTop: '60px'}}>
                    <div style={{fontSize: '64px', marginBottom: '16px'}}>👤</div>
                    <div style={{fontSize: '16px'}}>{t.selectUserToViewDetails}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* زر الإغلاق */}
            <div style={{padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setIsAdminAccountsOpen(false);
                  setSelectedUser(null);
                }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إعادة تعيين كلمة المرور */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '400px', borderRadius: '16px', overflow: 'hidden'}}>
            <div className="modal-header">
              <h3 className="modal-title">🔐 {t.resetPassword}</h3>
              <button className="modal-close" onClick={() => {
                setIsResetPasswordModalOpen(false);
                setResetPasswordData({ newPassword: '', confirmPassword: '' });
              }}>
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              {/* تنبيه */}
              <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b'}}>
                <div style={{fontSize: '14px', color: '#92400e'}}>
                  <strong>المستخدم:</strong> {selectedUser.name || selectedUser.username}
                </div>
              </div>
              
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label">{t.newPassword}</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
                    placeholder={t.newPassword}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t.confirmPassword}</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({...resetPasswordData, confirmPassword: e.target.value})}
                    placeholder={t.confirmPassword}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                  }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    💾 {t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// عرض التطبيق
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<CarGarageManagement />);