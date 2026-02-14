import React from 'react';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleDetails = ({ 
  vehicle, 
  customer, 
  services, 
  onEdit, 
  onDelete,
  onAddService,
  onPayment,
  onViewService
}) => {
  const { t } = useTranslation();
  
  const vehicleServices = services.filter(s => s.vehicle_id === vehicle.id);
  
  const stats = {
    servicesCount: vehicleServices.length,
    totalCost: vehicleServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0),
    totalPaid: vehicleServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
    totalRemaining: vehicleServices.reduce((sum, s) => sum + parseFloat(s.remaining_amount || 0), 0)
  };

  return (
    <div className="vehicle-details">
      <div className="details-header">
        <h2>{vehicle.make} {vehicle.model}</h2>
        <div className="header-actions">
          <button onClick={() => onEdit(vehicle)} className="btn btn-outline">
            ✏️ {t('edit')}
          </button>
          <button onClick={() => onAddService(vehicle)} className="btn btn-success">
            ➕ {t('addService')}
          </button>
          <button onClick={() => onDelete(vehicle.id)} className="btn btn-danger">
            🗑️ {t('delete')}
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="info-section">
          <h3>{t('vehicleInfo')}</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">{t('make')}</span>
              <span className="info-value">{vehicle.make}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('model')}</span>
              <span className="info-value">{vehicle.model}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('year')}</span>
              <span className="info-value">{vehicle.year}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('licensePlate')}</span>
              <span className="info-value">{vehicle.license_plate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('status')}</span>
              <StatusBadge status={vehicle.status} />
            </div>
          </div>
        </div>

        {customer && (
          <div className="customer-section">
            <h3>{t('customerInfo')}</h3>
            <div className="customer-card">
              <h4>{customer.name}</h4>
              <p><strong>{t('phone')}:</strong> {customer.phone}</p>
              {customer.email && <p><strong>{t('email')}:</strong> {customer.email}</p>}
            </div>
          </div>
        )}

        <div className="stats-section">
          <h3>{t('vehicleStats')}</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-info">
                <div className="stat-value">{stats.servicesCount}</div>
                <div className="stat-label">{t('services')}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalCost.toFixed(2)}</div>
                <div className="stat-label">{t('totalCost')}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalPaid.toFixed(2)}</div>
                <div className="stat-label">{t('totalPaid')}</div>
              </div>
            </div>
            
            {stats.totalRemaining > 0 && (
              <div className="stat-card warning">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <div className="stat-value">${stats.totalRemaining.toFixed(2)}</div>
                  <div className="stat-label">{t('remaining')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="services-section">
          <div className="section-header">
            <h3>{t('serviceHistory')} ({vehicleServices.length})</h3>
          </div>
          
          {vehicleServices.length > 0 ? (
            <div className="services-list">
              {vehicleServices.map(service => (
                <div key={service.id} className="service-item">
                  <div className="service-header">
                    <h5>{service.type}</h5>
                    <div className="service-status">
                      <StatusBadge status={service.status} />
                      <PaymentBadge status={service.payment_status} />
                    </div>
                  </div>
                  
                  <div className="service-body">
                    <p className="service-description">{service.description}</p>
                    <div className="service-meta">
                      <span>📅 {service.date}</span>
                      <span>👤 {service.technician}</span>
                      <span>💰 ${service.cost}</span>
                    </div>
                    
                    <div className="service-payment">
                      {service.amount_paid > 0 && (
                        <span className="paid-amount">
                          {t('paid')}: ${service.amount_paid}
                        </span>
                      )}
                      {service.remaining_amount > 0 && (
                        <span className="remaining-amount">
                          {t('remaining')}: ${service.remaining_amount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="service-actions">
                    {service.remaining_amount > 0 && (
                      <button 
                        onClick={() => onPayment(service)}
                        className="btn btn-success btn-sm"
                      >
                        💳 {t('pay')}
                      </button>
                    )}
                    <button 
                      onClick={() => onViewService(service)}
                      className="btn btn-outline btn-sm"
                    >
                      👁️ {t('view')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t('noServices')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
