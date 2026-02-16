import React, { useState, useEffect, useMemo } from 'react';
import { translations } from './utils/translations';
import { userPermissions } from './utils/permissions';
import PrintHeader from './components/common/PrintHeader';
import PrintInvoice from './components/common/PrintInvoice';
import useAuth from './hooks/useAuth';
import apiService from './services/api';

// استيراد المكونات
import SupplierManagement from './components/financial/SupplierManagement';
import EmployeeManagement from './components/financial/EmployeeManagement';
import PurchaseInvoices from './components/financial/PurchaseInvoices';
import FinancialReports from './components/reports/FinancialReports';
import CustomerManagement from './components/financial/CustomerManagement';
import VehicleManagement from './components/financial/VehicleManagement';
import ServiceManagement from './components/financial/ServiceManagement';
import AccountManagement from './components/common/AccountManagement';

// استيراد المودال للاختصارات
import CustomerModal from './components/modals/CustomerModal';
import VehicleModal from './components/modals/VehicleModal';
import ServiceModal from './components/modals/ServiceModal';

const App = () => {
  const { user, loading, login, logout } = useAuth();
  const permissions = useMemo(() => user ? userPermissions[user.role] || userPermissions.customer : null, [user]);
  const [lang, setLang] = useState('ar');
  const [currentView, setCurrentView] = useState('dashboard');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [printData, setPrintData] = useState(null);
  
  // حالات المودال للاختصارات
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [sharedData, setSharedData] = useState({ customers: [], vehicles: [] });

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [stats, setStats] = useState({
    total_customers: 0,
    total_vehicles: 0,
    main_fund: 0,
    active_services: 0,
    total_revenue: 0,
    total_expenses: 0,
    total_pending: 0
  });

  useEffect(() => {
    if (user && currentView === 'dashboard') {
      fetchStats();
    }
  }, [user, currentView]);

  const fetchStats = async () => {
    try {
      const [statsData, customersData, vehiclesData] = await Promise.all([
        apiService.dashboard.getStats(),
        apiService.customers.getAll(),
        apiService.vehicles.getAll()
      ]);

      if (statsData.success) {
        setStats({
          total_customers: Number(statsData.stats.total_customers) || 0,
          total_vehicles: Number(statsData.stats.total_vehicles) || 0,
          main_fund: Number(statsData.stats.main_fund) || 0,
          active_services: Number(statsData.stats.active_services) || 0,
          total_revenue: Number(statsData.stats.total_revenue) || 0,
          total_expenses: Number(statsData.stats.total_expenses) || 0,
          total_pending: Number(statsData.stats.total_pending) || 0
        });
      }
      
      setSharedData({
        customers: Array.isArray(customersData) ? customersData : [],
        vehicles: Array.isArray(vehiclesData) ? vehiclesData : []
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(loginData.username, loginData.password);
    if (!result.success) {
      setError(result.message || t.invalidCredentials);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <img src="./logo.jpg" alt="Logo" className="h-20 w-20 mx-auto rounded-full mb-4 shadow-sm" />
            <h1 className="text-2xl font-bold text-blue-900">{t.appName}</h1>
            <p className="text-gray-500">{t.loginToContinue}</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.username}</label>
              <input 
                type="text" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
              <input 
                type="password" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
            </div>
            
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</div>}
            
            <button 
              type="submit"
              className="btn btn-primary w-full py-3"
            >
              {t.login}
            </button>

            <button 
              type="button"
              onClick={toggleLang}
              className="w-full text-gray-500 text-sm hover:underline"
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // دالة مساعدة لعرض المحتوى بناءً على الاختيار
  const renderContent = () => {
    switch (currentView) {
      case 'customers':
        return <CustomerManagement t={t} isRtl={isRtl} permissions={permissions} />;
      case 'vehicles':
        return <VehicleManagement t={t} isRtl={isRtl} permissions={permissions} />;
      case 'services':
        return <ServiceManagement t={t} isRtl={isRtl} setPrintData={setPrintData} permissions={permissions} />;
      case 'suppliers':
        return <SupplierManagement t={t} isRtl={isRtl} />;
      case 'employees':
        return <EmployeeManagement t={t} isRtl={isRtl} />;
      case 'accounts':
        return <AccountManagement t={t} isRtl={isRtl} />;
      case 'purchase_invoices':
        return <PurchaseInvoices t={t} isRtl={isRtl} setPrintData={setPrintData} />;
      case 'reports':
        return <FinancialReports t={t} isRtl={isRtl} />;
      case 'dashboard':
      default:
        return (
          <div className="p-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.welcome} {user.name}</h1>
            <p className="text-gray-600">{t.appSubtitle}</p>
            
            {/* Quick Shortcuts */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button 
                onClick={() => setShowCustomerModal(true)}
                className="btn btn-primary"
              >
                <span>➕</span> {t.addNewCustomer}
              </button>
              <button 
                onClick={() => setShowVehicleModal(true)}
                className="btn btn-success"
              >
                <span>🚗</span> {t.addNewVehicle}
              </button>
              <button 
                onClick={() => setShowServiceModal(true)}
                className="btn btn-info"
              >
                <span>🔧</span> {t.addNewService}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 text-start">
              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('customers')}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-3xl">👥</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total_customers}</div>
                </div>
                <div className="text-lg font-bold">{t.customers}</div>
                <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('vehicles')}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-3xl">🚗</div>
                  <div className="text-2xl font-bold text-green-600">{stats.total_vehicles}</div>
                </div>
                <div className="text-lg font-bold">{t.vehicles}</div>
                <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-orange-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('services')}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-3xl">⏳</div>
                  <div className="text-2xl font-bold text-orange-600">${stats.total_pending?.toLocaleString()}</div>
                </div>
                <div className="text-lg font-bold">{t.pendingRevenue}</div>
                <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
              </div>

              {permissions.canViewReports && (
                <>
                  <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-emerald-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('reports')}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-3xl">📥</div>
                      <div className="text-2xl font-bold text-emerald-600">${stats.total_revenue.toLocaleString()}</div>
                    </div>
                    <div className="text-lg font-bold">{t.totalIncome}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('reports')}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-3xl">📤</div>
                      <div className="text-2xl font-bold text-red-600">${stats.total_expenses.toLocaleString()}</div>
                    </div>
                    <div className="text-lg font-bold">{t.totalExpenses}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-yellow-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('reports')}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-3xl">💰</div>
                      <div className="text-2xl font-bold text-yellow-600">${stats.main_fund.toLocaleString()}</div>
                    </div>
                    <div className="text-lg font-bold">{t.mainFund}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
                  </div>
                </>
              )}

              {user.role === 'admin' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500 cursor-pointer hover:shadow-md" onClick={() => setCurrentView('accounts')}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-3xl">🛡️</div>
                    <div className="text-2xl font-bold text-purple-600">⚙️</div>
                  </div>
                  <div className="text-lg font-bold">{t.adminAccounts}</div>
                  <div className="text-xs text-gray-400 mt-1">{t.viewDetails}</div>
                </div>
              )}
            </div>

            {/* Modals for Shortcuts */}
            <CustomerModal 
              isOpen={showCustomerModal}
              onClose={() => setShowCustomerModal(false)}
              onSuccess={() => { fetchStats(); setShowCustomerModal(false); }}
              t={t}
            />
            <VehicleModal 
              isOpen={showVehicleModal}
              onClose={() => setShowVehicleModal(false)}
              onSuccess={() => { fetchStats(); setShowVehicleModal(false); }}
              customers={sharedData.customers}
              t={t}
            />
            <ServiceModal 
              isOpen={showServiceModal}
              onClose={() => setShowServiceModal(false)}
              onSuccess={() => { fetchStats(); setShowServiceModal(false); }}
              vehicles={sharedData.vehicles}
              customers={sharedData.customers}
              t={t}
            />
          </div>
        );
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-100 font-sans">
      {/* شريط التنقل العلوي */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
            <img src={t.logo || "./logo.jpg"} alt="Logo" className="h-10 w-10 rounded-full" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-blue-900 leading-none">{t.appName}</h1>
              <span className="text-xs text-gray-500 mt-1">{user.role}</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="px-3 py-1 border rounded hover:bg-gray-50">
                {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">{t.logout}</button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-72px)] print:hidden">
        {/* القائمة الجانبية */}
        <aside className="w-64 bg-white shadow-md hidden md:block overflow-y-auto">
            <div className="p-4 space-y-2">
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className={`w-full text-start px-4 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    🏠 {t.overview}
                </button>

                <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">{t.vehicles}</div>
                
                <button 
                    onClick={() => setCurrentView('customers')}
                    className={`w-full text-start px-4 py-2 rounded ${currentView === 'customers' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    👥 {t.customers}
                </button>

                <button 
                    onClick={() => setCurrentView('vehicles')}
                    className={`w-full text-start px-4 py-2 rounded ${currentView === 'vehicles' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    🚗 {t.vehicles}
                </button>

                <button 
                    onClick={() => setCurrentView('services')}
                    className={`w-full text-start px-4 py-2 rounded ${currentView === 'services' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    🔧 {t.allServices}
                </button>
                
                {permissions.canViewReports && (
                  <>
                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">{t.financialManagement}</div>
                    
                    <button 
                        onClick={() => setCurrentView('suppliers')}
                        className={`w-full text-start px-4 py-2 rounded ${currentView === 'suppliers' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        📦 {t.supplierManagement}
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('purchase_invoices')}
                        className={`w-full text-start px-4 py-2 rounded ${currentView === 'purchase_invoices' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        🧾 {t.purchaseInvoices}
                    </button>

                    <button 
                        onClick={() => setCurrentView('reports')}
                        className={`w-full text-start px-4 py-2 rounded ${currentView === 'reports' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        📊 {t.reports}
                    </button>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">{t.employeeManagement}</div>
                    
                    <button 
                        onClick={() => setCurrentView('employees')}
                        className={`w-full text-start px-4 py-2 rounded ${currentView === 'employees' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        👥 {t.employeeManagement}
                    </button>

                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">{t.adminAccounts}</div>
                    
                    <button 
                        onClick={() => setCurrentView('accounts')}
                        className={`w-full text-start px-4 py-2 rounded ${currentView === 'accounts' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        🛡️ {t.adminAccounts}
                    </button>
                  </>
                )}
            </div>
        </aside>

        {/* منطقة المحتوى الرئيسي */}
        <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
        </main>
      </div>
      
      {/* مكون الطباعة المخفي */}
      <div className="hidden print:block">
        {printData ? (
          <PrintInvoice 
            t={t} 
            service={printData.service} 
            vehicle={printData.vehicle} 
            customer={printData.customer} 
          />
        ) : (
          <PrintHeader t={t} />
        )}
      </div>
    </div>
  );
};

export default App;
