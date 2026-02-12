import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleCustomerSection = ({ customer }) => {
  const { t } = useTranslation();

  if (!customer) return null;

  return (
    <div className="customer-section">
      <h3>{t('customerInfo')}</h3>
      <div className="customer-card">
        <h4>{customer.name}</h4>
        <p><strong>{t('phone')}:</strong> {customer.phone}</p>
        {customer.email && <p><strong>{t('email')}:</strong> {customer.email}</p>}
      </div>
    </div>
  );
};

export default VehicleCustomerSection;