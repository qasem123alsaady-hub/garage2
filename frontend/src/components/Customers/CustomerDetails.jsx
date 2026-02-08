import React from 'react';
import { StatusBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const CustomerDetails = ({ customer, vehicles, services, onEdit, onDelete }) => {
  const { t } = useTranslation();
  
  const customerVehicles = vehicles.filter(v => v.customer_id === customer.id);
  const customerServices = services.filter(s => 
    customerVehicles.some(v => v.id === s.vehicle_id)
  );

  const stats = {
    vehiclesCount: customerVehicles.length,
    servicesCount: customerServices.length,
    totalCost: customerServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0),
    totalPaid: customerServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
    totalRemaining: customerServices.reduce((sum, s) => sum + parseFloat(s.remaining_amount || 0), 0)
  };

  return (
    <div className="customer-details">
      <div className="details-header">
        <h2>{customer.name}</h2>
        <div className="header-actions">
          <button onClick={() => onEdit(customer)} className="btn btn-outline">
            ✏️ {t('edit')}
          </button>
          <button onClick={() => onDelete(customer.id)} className="btn btn-danger">
            🗑️ {t('delete')}
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="info-section">
          <h3>{t('customerInfo')}</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">{t('name')}</span>
              <span className="info-value">{customer.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('phone')}</span>
              <span className="info-value">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="info-row">
                <span className="info-label">{t('email')}</span>
                <span className="info-value">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="info-row">
                <span className="info-label">{t('address')}</span>
                <span className="info-value">{customer.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="stats-section">
          <h3>{t('customerStats')}</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🚗</div>
              <div className="stat-info">
                <div className="stat-value">{stats.vehiclesCount}</div>
                <div className="stat-label">{t('vehicles')}</div>
              </div>
            </div>
            
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
          </div>

          {stats.totalRemaining > 0 && (
            <div className="amount-due-alert">
              <h4>{t('amountDue')}</h4>
              <div className="due-amount">${stats.totalRemaining.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="vehicles-section">
          <h3>{t('customerVehicles')} ({customerVehicles.length})</h3>
          {customerVehicles.length > 0 ? (
            <div className="vehicles-list">
              {customerVehicles.map(vehicle => (
                <div key={vehicle.id} className="vehicle-item">
                  <div className="vehicle-info">
                    <h5>{vehicle.make} {vehicle.model} ({vehicle.year})</h5>
                    <p>{t('licensePlate')}: {vehicle.license_plate}</p>
                    <StatusBadge status={vehicle.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t('noVehicles')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
