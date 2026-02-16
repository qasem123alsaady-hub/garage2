import React from 'react';
import '../../print.css';

const PrintInvoice = ({ t, service, vehicle, customer }) => {
  if (!service) return null;

  const getServiceTypeLabel = (type) => {
    if (!type) return '-';
    
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

  return (
    <div className="print-invoice-container p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img src={t.logo || "./logo.jpg"} alt="Logo" className="h-16 w-16 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{t.appName}</h1>
            <p className="text-sm text-gray-600">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-bold uppercase">{t.receipt || 'Invoice'}</h2>
          <p className="text-sm">#{service.id}</p>
          <p className="text-sm">{service.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 border-y py-4">
        <div>
          <h3 className="font-bold mb-2 border-b pb-1">{t.customerInfo}</h3>
          <p><strong>{t.name}:</strong> {customer?.name || '-'}</p>
          <p><strong>{t.phone}:</strong> {customer?.phone || '-'}</p>
        </div>
        <div>
          <h3 className="font-bold mb-2 border-b pb-1">{t.vehicleInfo}</h3>
          <p><strong>{t.makeModel}:</strong> {vehicle?.make} {vehicle?.model}</p>
          <p><strong>{t.licensePlate}:</strong> {vehicle?.license_plate}</p>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">{t.serviceType}</th>
              <th className="p-2 border">{t.description}</th>
              <th className="p-2 border text-end">{t.cost}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border font-medium">{getServiceTypeLabel(service.type)}</td>
              <td className="p-2 border">{service.description}</td>
              <td className="p-2 border text-end">${parseFloat(service.cost).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span>{t.totalCost}:</span>
            <span className="font-bold">${parseFloat(service.cost).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span>{t.paid}:</span>
            <span className="text-green-600">-${parseFloat(service.amount_paid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-bold">
            <span>{t.remaining}:</span>
            <span>${parseFloat(service.remaining_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>{t.thankYou || 'Thank you for choosing us!'}</p>
      </div>
    </div>
  );
};

export default PrintInvoice;
