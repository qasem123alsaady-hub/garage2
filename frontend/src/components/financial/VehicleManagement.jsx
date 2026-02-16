import React, { useState, useEffect } from 'react';
import AddVehicleModal from '../modals/VehicleModal';
import VehiclePaymentModal from '../modals/VehiclePaymentModal';
import StatusBadge from '../common/StatusBadge';
import apiService from '../../services/api';

const VehicleManagement = ({ t, isRtl, permissions }) => {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
    fetchServices();
  }, []);

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

  const fetchServices = async () => {
    try {
      const data = await apiService.services.getAll();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const handlePrintVehicleReport = (vehicle) => {
    if (!vehicle) return;
    
    const language = isRtl ? 'ar' : 'en';
    const vehicleServices = services.filter(s => s.vehicle_id === vehicle.id);
    const customer = customers.find(c => c.id === vehicle.customer_id);
    
    const getServiceTypeLabel = (type) => {
        const mapping = {
          'oil_change': t.oilChange, 'brake_service': t.brakeService, 'tire_rotation': t.tireRotation,
          'engine_repair': t.engineRepair, 'other': t.other, 'تغيير الزيت': t.oilChange,
          'خدمة الفرامل': t.brakeService, 'تدوير الإطارات': t.tireRotation, 'إصلاح المحرك': t.engineRepair, 'أخرى': t.other
        };
        return mapping[type] || type;
    };

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${language === 'ar' ? 'تقرير المركبة' : 'Vehicle Report'} - ${vehicle.make} ${vehicle.model}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .section { margin-bottom: 20px; }
              .section h3 { background: #f5f5f5; padding: 10px; border-${language === 'ar' ? 'right' : 'left'}: 4px solid #3b82f6; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: ${language === 'ar' ? 'right' : 'left'}; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; font-size: 18px; color: #10b981; }
              @media print { .no-print { display: none; } body { margin: 0; } }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 100px; margin-bottom: 10px;" onerror="this.style.display='none';">
              <h1>${language === 'ar' ? 'تقرير مركبة - GaragePro Manager' : 'Vehicle Report - GaragePro Manager'}</h1>
              <p>${language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'الماركة والموديل' : 'Make & Model'}</td><td>${vehicle.make} ${vehicle.model}</td></tr>
                  <tr><td>${language === 'ar' ? 'السنة' : 'Year'}</td><td>${vehicle.year}</td></tr>
                  <tr><td>${language === 'ar' ? 'لوحة الرخصة' : 'License Plate'}</td><td>${vehicle.license_plate}</td></tr>
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h3>
              <table>
                  <tr><td>${language === 'ar' ? 'الاسم' : 'Name'}</td><td>${customer ? customer.name : '-'}</td></tr>
                  <tr><td>${language === 'ar' ? 'الهاتف' : 'Phone'}</td><td>${customer ? customer.phone : '-'}</td></tr>
              </table>
          </div>
          
          <div class="section">
              <h3>${language === 'ar' ? 'سجل الخدمات' : 'Service History'}</h3>
              ${vehicleServices.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>${language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</th>
                            <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            <th>${language === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vehicleServices.map(s => `
                            <tr>
                                <td>${getServiceTypeLabel(s.type)}</td>
                                <td>${s.date}</td>
                                <td>$${parseFloat(s.cost).toFixed(2)}</td>
                                <td>${s.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
              ` : '<p>لا توجد خدمات مسجلة لهذه المركبة</p>'}
          </div>
          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const filteredVehicles = vehicles.filter(v => 
    v.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.license_plate.includes(searchTerm)
  );

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmVehicleDelete)) return;
    try {
      const result = await apiService.vehicles.delete(id);
      if (result.success) {
        fetchVehicles();
        alert(t.vehicleDeleted);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const handlePrintReport = (vehicle) => {
    handlePrintVehicleReport(vehicle);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.vehicles}</h2>
        {permissions.canManageVehicles && (
          <button 
            onClick={() => { setSelectedVehicle(null); setShowModal(true); }}
            className="btn btn-success"
          >
            + {t.addNewVehicle}
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
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.makeModel}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.licensePlate}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.customer}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredVehicles.length > 0 ? filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle.license_plate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getCustomerName(vehicle.customer_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={vehicle.status} t={t} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {permissions.canManagePayments && (
                      <button 
                        onClick={() => { setSelectedVehicle(vehicle); setShowPaymentModal(true); }}
                        className="action-btn"
                        style={{backgroundColor: '#ecfdf5', color: '#059669'}}
                        title={isRtl ? 'دفع شامل' : 'Comprehensive Payment'}
                      >
                        💰
                      </button>
                    )}
                    {permissions.canViewIndividualReports && (
                      <button 
                        onClick={() => handlePrintReport(vehicle)}
                        className="action-btn"
                        style={{backgroundColor: '#f0f9ff', color: '#0ea5e9'}}
                        title={t.vehicleReport}
                      >
                        📊
                      </button>
                    )}
                    {permissions.canManageVehicles && (
                      <button 
                        onClick={() => { setSelectedVehicle(vehicle); setShowModal(true); }}
                        className="action-btn edit"
                        title={t.edit}
                      >
                        ✏️
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        className="action-btn delete"
                        title={t.delete}
                      >
                        🗑️
                      </button>
                    )}
                    {!permissions.canManageVehicles && !permissions.canDelete && !permissions.canManagePayments && '-'}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">{t.noVehicles}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddVehicleModal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setSelectedVehicle(null); }} 
        onSuccess={() => {
          fetchVehicles();
          setShowModal(false);
          setSelectedVehicle(null);
        }}
        customers={customers}
        t={t}
        vehicle={selectedVehicle}
      />

      {selectedVehicle && (
        <VehiclePaymentModal 
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setSelectedVehicle(null); }}
          onSuccess={() => {
            fetchVehicles();
            fetchServices();
            setShowPaymentModal(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
          services={services}
          t={t}
          isRtl={isRtl}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default VehicleManagement;
