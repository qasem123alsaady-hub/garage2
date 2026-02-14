import React, { useState } from 'react';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const ServiceList = ({ 
  services, 
  vehicles, 
  customers, 
  onEdit, 
  onDelete,
  onPayment,
  onView
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return { make: t('unknownVehicle'), model: '' };
    const customer = customers.find(c => c.id === vehicle.customer_id);
    return {
      make: vehicle.make,
      model: vehicle.model,
      customer: customer?.name
    };
  };

  const filteredServices = services.filter(service => {
    const vehicleInfo = getVehicleInfo(service.vehicle_id);
    const matchesSearch = 
      service.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.technician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleInfo.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleInfo.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || service.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="service-list">
      <div className="list-header">
        <h3>{t('services')} ({filteredServices.length})</h3>
        <div className="filter-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('searchServices')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('allStatus')}</option>
            <option value="pending">{t('statusPending')}</option>
            <option value="in-service">{t('statusInService')}</option>
            <option value="completed">{t('statusCompleted')}</option>
          </select>
          
          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">{t('allPaymentStatus')}</option>
            <option value="pending">{t('paymentPending')}</option>
            <option value="partial">{t('paymentPartial')}</option>
            <option value="paid">{t('paymentPaid')}</option>
          </select>
        </div>
      </div>

      <div className="services-table">
        <table>
          <thead>
            <tr>
              <th>{t('type')}</th>
              <th>{t('vehicle')}</th>
              <th>{t('customer')}</th>
              <th>{t('date')}</th>
              <th>{t('technician')}</th>
              <th>{t('cost')}</th>
              <th>{t('status')}</th>
              <th>{t('paymentStatus')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map(service => {
              const vehicleInfo = getVehicleInfo(service.vehicle_id);
              
              return (
                <tr key={service.id}>
                  <td>
                    <strong>{service.type}</strong>
                    <div className="service-description-small">
                      {service.description?.substring(0, 50)}...
                    </div>
                  </td>
                  <td>
                    {vehicleInfo.make} {vehicleInfo.model}
                  </td>
                  <td>{vehicleInfo.customer || t('unknownCustomer')}</td>
                  <td>{service.date}</td>
                  <td>{service.technician}</td>
                  <td className="cost-cell">${service.cost}</td>
                  <td>
                    <StatusBadge status={service.status} />
                  </td>
                  <td>
                    <PaymentBadge status={service.payment_status} />
                    {service.remaining_amount > 0 && (
                      <div className="remaining-small">
                        ${service.remaining_amount} {t('remaining')}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => onView(service)}
                        className="btn-icon"
                        title={t('view')}
                      >
                        👁️
                      </button>
                      
                      {service.remaining_amount > 0 && (
                        <button 
                          onClick={() => onPayment(service)}
                          className="btn-icon success"
                          title={t('pay')}
                        >
                          💳
                        </button>
                      )}
                      
                      <button 
                        onClick={() => onEdit(service)}
                        className="btn-icon"
                        title={t('edit')}
                      >
                        ✏️
                      </button>
                      
                      <button 
                        onClick={() => onDelete(service.id)}
                        className="btn-icon danger"
                        title={t('delete')}
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceList;
