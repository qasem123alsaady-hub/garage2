import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleHeader = ({ vehicle, onEdit, onAddService, onDelete }) => {
  const { t } = useTranslation();
  
  return (
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
  );
};

export default VehicleHeader;