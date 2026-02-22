import React, { useState, useEffect } from 'react';
import AddCustomerModal from '../modals/CustomerModal';
import ReportDateRangeModal from '../modals/ReportDateRangeModal';
import apiService from '../../services/api';

const CustomerManagement = ({ t, isRtl, permissions }) => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchAllData();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await apiService.customers.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [vData, sData, pData] = await Promise.all([
        apiService.vehicles.getAll(),
        apiService.services.getAll(),
        apiService.payments.getAll()
      ]);
      setVehicles(vData);
      setServices(sData);
      setPayments(pData);
    } catch (error) {
      console.error("Error fetching supplemental data:", error);
    }
  };

  const handlePrintCustomerReport = (customer, dateRange) => {
    if (!customer) return;
    
    const customerId = customer.id;
    const language = isRtl ? 'ar' : 'en';
    const customerVehicles = vehicles.filter(v => v.customer_id === customerId);
    
    // Filter services by vehicle and date range
    const filteredServices = services.filter(s => {
      const isCustomerVehicle = customerVehicles.some(v => v.id === s.vehicle_id);
      if (!isCustomerVehicle) return false;
      
      const serviceDate = new Date(s.date);
      const startDate = dateRange?.start_date ? new Date(dateRange.start_date) : null;
      const endDate = dateRange?.end_date ? new Date(dateRange.end_date) : null;
      
      return (!startDate || serviceDate >= startDate) && (!endDate || serviceDate <= endDate);
    });

    const getServiceTypeLabel = (type) => {
        const mapping = {
          'oil_change': t.oilChange, 'brake_service': t.brakeService, 'tire_rotation': t.tireRotation,
          'engine_repair': t.engineRepair, 'other': t.other, 'تغيير الزيت': t.oilChange,
          'خدمة الفرامل': t.brakeService, 'تدوير الإطارات': t.tireRotation, 'إصلاح المحرك': t.engineRepair, 'أخرى': t.other
        };
        return mapping[type] || type;
    };

    const customerStats = {
      totalVehicles: customerVehicles.length,
      totalServices: filteredServices.length,
      totalCost: filteredServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0),
      totalPaid: filteredServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
      totalRemaining: filteredServices.reduce((sum, s) => sum + parseFloat(s.remaining_amount || 0), 0)
    };

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${language === 'ar' ? 'تقرير العميل' : 'Customer Report'} - ${customer.name}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .section { margin-bottom: 20px; }
              .section h3 { background: #f5f5f5; padding: 10px; border-${language === 'ar' ? 'right' : 'left'}: 4px solid #3b82f6; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: ${language === 'ar' ? 'right' : 'left'}; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; font-size: 18px; color: #10b981; }
              .remaining { font-weight: bold; font-size: 18px; color: #ef4444; }
              .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
              @media print { .no-print { display: none; } body { margin: 0; } }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 100px; margin-bottom: 10px;" onerror="this.style.display='none';">
              <h1>${language === 'ar' ? 'تقرير عميل - GaragePro Manager' : 'Customer Report - GaragePro Manager'}</h1>
              <p>${t.from}: ${dateRange?.start_date || '-'} ${t.to}: ${dateRange?.end_date || '-'}</p>
              <p>${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات العميل' : 'Customer Information'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'الاسم' : 'Name'}</td><td>${customer.name}</td></tr>
                  <tr><td>${language === 'ar' ? 'الهاتف' : 'Phone'}</td><td>${customer.phone}</td></tr>
                  <tr><td>${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</td><td>${customer.email || '-'}</td></tr>
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الخدمات في الفترة المحددة' : 'Service History in Period'} (${filteredServices.length})</h3>
              <table>
                  <thead>
                      <tr>
                          <th>${t.date}</th>
                          <th>${t.vehicle}</th>
                          <th>${t.serviceType}</th>
                          <th>${t.cost}</th>
                          <th>${t.paid}</th>
                          <th>${t.remaining}</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${filteredServices.map(s => {
                        const v = customerVehicles.find(veh => veh.id === s.vehicle_id);
                        return `
                          <tr>
                              <td>${s.date}</td>
                              <td>${v ? `${v.make} ${v.model}` : '-'}</td>
                              <td>${getServiceTypeLabel(s.type)}</td>
                              <td>$${parseFloat(s.cost).toFixed(2)}</td>
                              <td>$${parseFloat(s.amount_paid).toFixed(2)}</td>
                              <td>$${parseFloat(s.remaining_amount).toFixed(2)}</td>
                          </tr>
                        `;
                      }).join('')}
                  </tbody>
              </table>
          </div>

          <div class="summary">
              <h3>${language === 'ar' ? 'ملخص الفترة' : 'Period Summary'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}</td><td class="total">$${customerStats.totalCost.toFixed(2)}</td></tr>
                  <tr><td>${language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</td><td>$${customerStats.totalPaid.toFixed(2)}</td></tr>
                  <tr><td><strong>${language === 'ar' ? 'المبلغ المستحق' : 'Amount Due'}</strong></td><td class="remaining"><strong>$${customerStats.totalRemaining.toFixed(2)}</strong></td></tr>
              </table>
          </div>
          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmCustomerDelete)) return;
    try {
      const result = await apiService.customers.delete(id);
      if (result.success) {
        fetchCustomers();
        alert(t.customerDeleted);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handlePrintReport = (customer) => {
    setSelectedCustomer(customer);
    setShowReportModal(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.customers}</h2>
        {permissions.canManageCustomers && (
          <button 
            onClick={() => { setSelectedCustomer(null); setShowModal(true); }}
            className="btn btn-primary"
          >
            + {t.addNewCustomer}
          </button>
        )}
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder={t.searchPlaceholder} 
          className="search-input w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.name}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.phone}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.email}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {permissions.canViewIndividualReports && (
                      <button 
                        onClick={() => handlePrintReport(customer)}
                        className="action-btn"
                        style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}
                        title={t.customerReport}
                      >
                        📊
                      </button>
                    )}
                    {permissions.canManageCustomers && (
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setShowModal(true); }}
                        className="action-btn edit"
                        title={t.edit}
                      >
                        ✏️
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="action-btn delete"
                        title={t.delete}
                      >
                        🗑️
                      </button>
                    )}
                    {!permissions.canManageCustomers && !permissions.canDelete && '-'}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">{t.noCustomers}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddCustomerModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelectedCustomer(null); }} 
        onSuccess={() => {
          fetchCustomers();
          setShowModal(false);
          setSelectedCustomer(null);
        }}
        t={t}
        customer={selectedCustomer}
      />

      <ReportDateRangeModal 
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setSelectedCustomer(null); }}
        onConfirm={(range) => {
          handlePrintCustomerReport(selectedCustomer, range);
          setShowReportModal(false);
          setSelectedCustomer(null);
        }}
        t={t}
        title={t.customerReport}
      />
    </div>
  );
};

export default CustomerManagement;
