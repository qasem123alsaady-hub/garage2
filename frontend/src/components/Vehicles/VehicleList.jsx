import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useDataFetch } from '../../hooks/useDataFetch';

const VehicleList = ({ vehicles, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { customers } = useDataFetch();

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'عميل غير معروف';
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-service': return 'قيد الخدمة';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  return (
    <div className="vehicle-list-vertical">
      {vehicles.length > 0 ? vehicles.map(vehicle => (
        <div key={vehicle.id} className="vehicle-item-compact" onClick={() => onSelect(vehicle)}>
          <div className="vehicle-title">
            <span>{vehicle.make} {vehicle.model}</span>
            <div className="action-icons">
              <button className="icon-btn edit" onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}>✏️</button>
              <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(vehicle.id); }}>❌</button>
            </div>
          </div>
          <div className="vehicle-meta">
            <span>سنة: {vehicle.year}</span>
            <span className={`status-dot status-${vehicle.status}`}>{getStatusLabel(vehicle.status)}</span>
          </div>
          <div className="vehicle-footer" style={{fontSize: '0.8rem', color: '#64748b', marginTop: '5px'}}>
            <span>اللوحة: {vehicle.license_plate}</span>
            <span style={{margin: '0 10px'}}>•</span>
            <span>العميل: {getCustomerName(vehicle.customer_id)}</span>
          </div>
        </div>
      )) : (
        <div style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>لا توجد مركبات حالياً</div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .action-icons {
          display: flex;
          gap: 8px;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 2px;
          transition: transform 0.1s;
        }
        .icon-btn:hover {
          transform: scale(1.2);
        }
      `}} />
    </div>
  );
};

export default VehicleList;
