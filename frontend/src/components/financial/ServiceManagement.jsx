import React, { useState, useEffect } from 'react';
import AddServiceModal from '../modals/ServiceModal';
import PaymentModal from '../modals/PaymentModal';
import StatusBadge from '../common/StatusBadge';
import PaymentBadge from '../common/PaymentBadge';
import apiService from '../../services/api';

const ServiceManagement = ({ t, isRtl, setPrintData, permissions }) => {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
    fetchVehicles();
    fetchCustomers();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await apiService.services.getAll();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await apiService.vehicles.getAll();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiService.customers.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return '-';
    return `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
  };

  const getCustomerInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return '-';
    const customer = customers.find(c => c.id === vehicle.customer_id);
    return customer ? customer.name : '-';
  };

  const getServiceTypeLabel = (type) => {
    if (!type) return '-';
    
    // Mapping for both new internal keys and legacy Arabic strings
    const mapping = {
      'oil_change': t.oilChange,
      'brake_service': t.brakeService,
      'tire_rotation': t.tireRotation,
      'engine_repair': t.engineRepair,
      'other': t.other,
      // Legacy Arabic mapping
      'تغيير الزيت': t.oilChange,
      'خدمة الفرامل': t.brakeService,
      'تدوير الإطارات': t.tireRotation,
      'إصلاح المحرك': t.engineRepair,
      'أخرى': t.other
    };

    return mapping[type] || type;
  };

  const filteredServices = services.filter(s => 
    s.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.technician.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmServiceDelete)) return;
    try {
      const result = await apiService.services.delete(id);
      if (result.success) {
        fetchServices();
        alert(t.serviceDeleted);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handlePrint = (service) => {
    if (!service) return;
    
    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
    const customer = vehicle ? customers.find(c => c.id === vehicle.customer_id) : null;
    const language = isRtl ? 'ar' : 'en';
    
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.allServices}</h2>
        {permissions.canManageServices && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-info"
          >
            + {t.addNewService}
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
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.serviceType}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.vehicle}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.cost}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.paid} / {t.remaining}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredServices.length > 0 ? filteredServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{getServiceTypeLabel(service.type)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="font-medium text-gray-800">{getVehicleInfo(service.vehicle_id)}</div>
                    <div className="text-xs text-gray-500 mt-1">{getCustomerInfo(service.vehicle_id)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">${service.cost}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col gap-1">
                        <PaymentBadge status={service.payment_status} t={t} />
                        <span className="text-xs font-medium text-gray-500">${service.amount_paid} / ${service.remaining_amount}</span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={service.status} t={t} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {permissions.canManagePayments && (
                      <button 
                          onClick={() => { setSelectedService(service); setShowPaymentModal(true); }}
                          className="action-btn"
                          style={{backgroundColor: '#ecfdf5', color: '#059669'}}
                          title={t.payments}
                      >
                          💰
                      </button>
                    )}
                    {permissions.canManageServices && (
                      <button 
                        onClick={() => { setSelectedService(service); setShowEditModal(true); }}
                        className="action-btn edit"
                        title={t.edit}
                      >
                          ✏️
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrint(service)}
                      className="action-btn"
                      style={{backgroundColor: '#f1f5f9', color: '#475569'}}
                      title={t.print}
                    >
                        🖨️
                    </button>
                    {permissions.canDelete && (
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="action-btn delete"
                        title={t.delete}
                      >
                          🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">{t.noServices}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddServiceModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          fetchServices();
          setShowAddModal(false);
        }}
        vehicles={vehicles}
        customers={customers}
        t={t}
        permissions={permissions}
      />

      <AddServiceModal 
        isOpen={showEditModal} 
        onClose={() => { setShowEditModal(false); setSelectedService(null); }} 
        onSuccess={() => {
          fetchServices();
          setShowEditModal(false);
          setSelectedService(null);
        }}
        vehicles={vehicles}
        customers={customers}
        t={t}
        service={selectedService}
        permissions={permissions}
      />

      {selectedService && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setSelectedService(null); }}
          onSuccess={() => { fetchServices(); setShowPaymentModal(false); setSelectedService(null); }}
          service={selectedService}
          t={t}
          isRtl={isRtl}
          vehicles={vehicles}
          customers={customers}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
