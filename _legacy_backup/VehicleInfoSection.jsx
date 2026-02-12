import React from 'react';
import { StatusBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleInfoSection = ({ vehicle }) => {
  const { t } = useTranslation();

  return (
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
  );
};

export default VehicleInfoSection;