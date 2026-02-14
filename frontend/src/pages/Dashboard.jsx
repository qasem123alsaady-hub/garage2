import React, { useState } from 'react';
import Header from '../components/Layout/Header';
import StatsPanel from '../components/Layout/StatsPanel';
import VehicleList from '../components/Vehicles/VehicleList';
import CustomerList from '../components/Customers/CustomerList';
import VehicleForm from '../components/Vehicles/VehicleForm';
import CustomerForm from '../components/Customers/CustomerForm';
import ServiceForm from '../components/Services/ServiceForm';
import UserManagement from '../components/Admin/UserManagement';
import TechnicianManagement from '../components/Admin/TechnicianManagement';
import RevenueReport from '../components/Reports/RevenueReport';
import VehicleDetails from '../components/Vehicles/VehicleDetails'; // ✅ أضفنا مكون تفاصيل المركبة
import CustomerDetails from '../components/Customers/CustomerDetails'; // ✅ أضفنا مكون تفاصيل العميل
import PurchaseInvoiceList from '../components/Invoices/PurchaseInvoiceList';
import PurchaseInvoiceForm from '../components/Invoices/PurchaseInvoiceForm';
import InvoiceDetails from '../components/Invoices/InvoiceDetails';
import { useDataFetch } from '../hooks/useDataFetch'; 
import { generatePurchaseInvoicePDF } from '../utils/generateInvoicePDF';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslation } from '../hooks/useTranslation';
import { downloadExcelReport } from '../services/api';

const Dashboard = () => {
  const { t, language } = useTranslation();
  const { isAdmin } = usePermissions();
  const {
    vehicles,
    customers,
    services,
    suppliers = [],
    payments, // ✅ أضفنا payments
    invoices = [], // ✅ أضفنا invoices (مع قيمة افتراضية لتجنب الأخطاء)
    addItem,
    updateItem,
    deleteItem,
    loading
  } = useDataFetch();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('vehicles'); // 'vehicles' أو 'customers'
  const [detailsView, setDetailsView] = useState('list'); // 'list', 'vehicleDetails', 'customerDetails'

  const handleAction = (action) => {
    setSelectedVehicle(null);
    setSelectedCustomer(null);
    setSelectedInvoice(null);
    setDetailsView('list'); // العودة للقائمة عند فتح مودال جديد
    switch(action) {
      case 'addVehicle': setActiveModal('vehicle'); break;
      case 'addCustomer': setActiveModal('customer'); break;
      case 'addService': setActiveModal('service'); break;
      case 'manageAccounts': setActiveModal('accounts'); break;
      case 'addTechnician': setActiveModal('technician'); break;
      case 'revenueReport': setActiveModal('revenue'); break;
      case 'viewPurchaseInvoices': setActiveModal('purchaseInvoicesList'); break;
      default: setActiveModal(null);
    }
  };

  // ✅ دالة معالجة اختيار المركبة
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedCustomer(null);
    setDetailsView('vehicleDetails');
  };

  // ✅ دالة معالجة اختيار العميل
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
    setDetailsView('customerDetails');
  };

  // ✅ دالة معالجة تعديل المركبة
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveModal('vehicle');
  };

  // ✅ دالة معالجة تعديل العميل
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveModal('customer');
  };

  // ✅ دالة العودة للقائمة
  const handleBackToList = () => {
    setDetailsView('list');
    setSelectedVehicle(null);
    setSelectedCustomer(null);
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleFormSubmit = async (type, data) => {
    let success = false;
    if (type === 'vehicle') {
      success = selectedVehicle 
        ? await updateItem('vehicles', selectedVehicle.id, data)
        : await addItem('vehicles', data);
    } else if (type === 'customer') {
      success = selectedCustomer
        ? await updateItem('customers', selectedCustomer.id, data)
        : await addItem('customers', data);
    } else if (type === 'service') {
      success = await addItem('services', data);
    } else if (type === 'invoice') {
      success = selectedInvoice
        ? await updateItem('invoices', selectedInvoice.id, data)
        : await addItem('invoices', data);
    }
    
    if (success) {
      setActiveModal(null);
      setSelectedVehicle(null);
      setSelectedCustomer(null);
      setSelectedInvoice(null);
      setDetailsView('list'); // العودة للقائمة بعد الحفظ
    }
  };

  // ✅ دالة معالجة عرض فاتورة الشراء كـ PDF
  const handleViewInvoicePDF = (invoice) => {
    console.log("بدء إنشاء PDF للفاتورة:", invoice);
    try {
      const supplier = suppliers.find(s => s.id === invoice.supplier_id);
      generatePurchaseInvoicePDF(invoice, supplier, t);
    } catch (e) {
      console.error("فشل في استدعاء دالة PDF:", e);
      alert("حدث خطأ غير متوقع عند محاولة عرض الفاتورة.");
    }
  };

  // ✅ جلب خدمات المركبة المختارة
  const getVehicleServices = () => {
    if (!selectedVehicle) return [];
    return services.filter(service => service.vehicle_id === selectedVehicle.id);
  };

  // ✅ جلب مركبات العميل المختار
  const getCustomerVehicles = () => {
    if (!selectedCustomer) return [];
    return vehicles.filter(vehicle => vehicle.customer_id === selectedCustomer.id);
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadExcelReport(language);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert(language === 'ar' ? 'فشل تحميل التقرير. تأكد من اتصال الخادم.' : 'Failed to download report. Check server connection.');
    }
  };

  return (
    <div className="dashboard">
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .side-panel {
            margin-top: 20px;
          }
        }

        @media (max-width: 768px) {
          .search-filter-bar {
            flex-direction: column;
            gap: 10px;
          }
          
          .search-input-wrapper {
            width: 100%;
          }
          
          .search-input {
            width: 100%;
          }
          
          .view-toggle {
            width: 100%;
            display: flex;
          }
          
          .toggle-btn {
            flex: 1;
            text-align: center;
          }
          
          .status-select {
            width: 100%;
          }
          
          .quick-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          
          .btn-quick {
            width: 100%;
            margin: 0 !important;
          }
          
          .welcome-card {
            padding: 15px;
          }
          
          .btn-back {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <Header onAction={handleAction} />
      
      <main className="container main-content">
        {/* ✅ شريط البحث والتصفية - يظهر فقط في وضع القائمة */}
        {detailsView === 'list' && (
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder={
                  viewMode === 'vehicles' 
                    ? (t('searchPlaceholder') || 'ابحث عن مركبة بالماركة، الموديل، أو لوحة الرخصة...')
                    : (t('searchCustomers') || 'ابحث عن عميل بالاسم، الهاتف، أو البريد...')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'vehicles' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('vehicles');
                  setSearchQuery('');
                }}
              >
                {t('vehicles') || 'المركبات'}
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'customers' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('customers');
                  setSearchQuery('');
                }}
              >
                {t('customers') || 'العملاء'}
              </button>
            </div>

            {viewMode === 'vehicles' && (
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-select"
              >
                <option value="all">{t('allStatuses') || 'جميع الحالات'}</option>
                <option value="pending">{t('pending') || 'قيد الانتظار'}</option>
                <option value="in-service">{t('inService') || 'قيد الخدمة'}</option>
                <option value="completed">{t('completed') || 'مكتمل'}</option>
              </select>
            )}
          </div>
        )}

        {/* ✅ زر العودة - يظهر فقط في وضع التفاصيل */}
        {detailsView !== 'list' && (
          <div className="back-to-list" style={{marginBottom: '20px'}}>
            <button 
              onClick={handleBackToList}
              className="btn-back"
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px'
              }}
            >
              ← العودة للقائمة
            </button>
          </div>
        )}

        <StatsPanel />
        
        <div className="dashboard-grid">
          <div className="main-view">
            {/* ✅ عرض مختلف حسب حالة detailsView */}
            {detailsView === 'list' ? (
              <div className="welcome-card">
                <div className="welcome-icon">🚗</div>
                <h2>{t('welcome') || 'مرحباً'}</h2>
                <p>{viewMode === 'vehicles' ? 'اختر مركبة من القائمة لعرض التفاصيل' : 'اختر عميلاً من القائمة لعرض التفاصيل'}</p>
                <div className="quick-actions">
                  <button className="btn-quick btn-service" onClick={() => handleAction('addService')}>
                    ➕ {t('newService') || 'خدمة جديدة'}
                  </button>
                  <button className="btn-quick btn-customer" onClick={() => handleAction('addCustomer')}>
                    ➕ {t('newCustomer') || 'عميل جديد'}
                  </button>
                  <button className="btn-quick btn-vehicle" onClick={() => handleAction('addVehicle')}>
                    ➕ {t('newVehicle') || 'مركبة جديدة'}
                  </button>
                  <button className="btn-quick" onClick={() => handleAction('viewPurchaseInvoices')} style={{backgroundColor: '#6c757d', color: '#fff'}}>
                    🧾 {t('viewPurchaseInvoices') || 'فواتير المشتريات'}
                  </button>
                  <button className="btn-quick" onClick={handleDownloadExcel} style={{backgroundColor: '#217346', color: '#fff'}}>
                    📊 {t('exportExcel') || 'تصدير Excel'}
                  </button>
                </div>
              </div>
            ) : detailsView === 'vehicleDetails' && selectedVehicle ? (
              <VehicleDetails
                vehicle={selectedVehicle}
                services={getVehicleServices()}
                customer={customers.find(c => c.id === selectedVehicle.customer_id)}
                onEdit={() => handleEditVehicle(selectedVehicle)}
                onDelete={() => {
                  if (window.confirm('هل تريد حذف هذه المركبة؟')) {
                    deleteItem('vehicles', selectedVehicle.id);
                    handleBackToList();
                  }
                }}
              />
            ) : detailsView === 'customerDetails' && selectedCustomer ? (
              <CustomerDetails
                customer={selectedCustomer}
                vehicles={getCustomerVehicles()}
                services={services}
                payments={payments}
                onEdit={() => handleEditCustomer(selectedCustomer)}
                onDelete={() => {
                  if (window.confirm('هل تريد حذف هذا العميل؟')) {
                    deleteItem('customers', selectedCustomer.id);
                    handleBackToList();
                  }
                }}
              />
            ) : null}
          </div>

          <aside className="side-panel">
            <div className="panel-section">
              <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{fontSize: '1.2rem', fontWeight: '800'}}>
                  {detailsView === 'list' ? (
                    viewMode === 'vehicles' 
                      ? `${t('vehicles') || 'المركبات'} (${filteredVehicles.length})`
                      : `${t('customers') || 'العملاء'} (${filteredCustomers.length})`
                  ) : detailsView === 'vehicleDetails' ? (
                    'مركبات أخرى'
                  ) : (
                    'عملاء آخرون'
                  )}
                </h3>
              </div>
              
              {loading ? (
                <p>جاري التحميل...</p>
              ) : detailsView === 'list' ? (
                <>
                  {viewMode === 'vehicles' ? (
                    <VehicleList
                      vehicles={filteredVehicles}
                      onSelect={handleSelectVehicle}
                      onEdit={handleEditVehicle}
                      onDelete={(id) => deleteItem('vehicles', id)}
                    />
                  ) : (
                    <CustomerList
                      customers={filteredCustomers}
                      vehicles={vehicles}
                      services={services}
                      onSelect={handleSelectCustomer}
                      onEdit={handleEditCustomer}
                      onDelete={(id) => deleteItem('customers', id)}
                    />
                  )}
                </>
              ) : detailsView === 'vehicleDetails' ? (
                // عرض قائمة المركبات الأخرى (غير المختارة)
                <VehicleList
                  vehicles={vehicles.filter(v => v.id !== selectedVehicle?.id).slice(0, 5)}
                  onSelect={handleSelectVehicle}
                  onEdit={handleEditVehicle}
                  onDelete={(id) => deleteItem('vehicles', id)}
                  compact={true}
                />
              ) : (
                // عرض قائمة العملاء الآخرين (غير المختار)
                <CustomerList
                  customers={customers.filter(c => c.id !== selectedCustomer?.id).slice(0, 5)}
                  vehicles={vehicles}
                  services={services}
                  onSelect={handleSelectCustomer}
                  onEdit={handleEditCustomer}
                  onDelete={(id) => deleteItem('customers', id)}
                  compact={true}
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'vehicle' && (
        <VehicleForm
          isOpen={true}
          onClose={() => { setActiveModal(null); setSelectedVehicle(null); }}
          vehicle={selectedVehicle}
          customers={customers}
          onSubmit={(data) => handleFormSubmit('vehicle', data)}
        />
      )}

      {activeModal === 'customer' && (
        <CustomerForm
          isOpen={true}
          onClose={() => { setActiveModal(null); setSelectedCustomer(null); }}
          customer={selectedCustomer}
          onSubmit={(data) => handleFormSubmit('customer', data)}
        />
      )}

      {activeModal === 'service' && (
        <ServiceForm
          isOpen={true}
          onClose={() => setActiveModal(null)}
          vehicles={vehicles}
          onSubmit={(data) => handleFormSubmit('service', data)}
        />
      )}

      {activeModal === 'accounts' && isAdmin && (
        <UserManagement isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'technician' && isAdmin && (
        <TechnicianManagement isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'revenue' && isAdmin && (
        <RevenueReport isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* Purchase Invoices Modals */}
      {activeModal === 'purchaseInvoicesList' && (
        <PurchaseInvoiceList
          isOpen={true}
          onClose={() => setActiveModal(null)}
          invoices={invoices}
          onAdd={() => { setActiveModal('invoiceForm'); setSelectedInvoice(null); }}
          onEdit={(invoice) => { setSelectedInvoice(invoice); setActiveModal('invoiceForm'); }}
          onView={handleViewInvoicePDF}
          onDelete={(id) => {
            if(window.confirm(t('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
              deleteItem('invoices', id);
            }
          }}
        />
      )}

      {activeModal === 'invoiceForm' && (
        <PurchaseInvoiceForm
          isOpen={true}
          onClose={() => setActiveModal('purchaseInvoicesList')}
          invoice={selectedInvoice}
          onSubmit={(data) => handleFormSubmit('invoice', data)}
        />
      )}

      {/* تم تعطيل هذا الجزء لأن عرض التفاصيل أصبح يتم عبر PDF */}
      {/* {activeModal === 'invoiceDetails' && (
        <InvoiceDetails
          isOpen={true}
          onClose={() => setActiveModal('purchaseInvoicesList')}
          invoice={selectedInvoice}
        />
      )} */}
    </div>
  );
};

export default Dashboard;