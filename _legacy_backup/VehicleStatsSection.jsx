import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleStatsSection = ({ stats }) => {
  const { t } = useTranslation();

  return (
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
  );
};

export default VehicleStatsSection;