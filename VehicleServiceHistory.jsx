import React from 'react';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleServiceHistory = ({ services, onPayment, onViewService }) => {
  const { t } = useTranslation();

  // دالة مساعدة لتنسيق نوع الخدمة في حال عدم وجود ترجمة
  const getServiceTitle = (type) => {
    if (!type) return '';

    // 1. تنظيف النص ومحاولة الترجمة المباشرة
    const cleanType = type.toString().trim();
    const translated = t(cleanType);
    if (translated !== cleanType) return translated;

    // 2. محاولة الترجمة بحروف صغيرة (لحل مشاكل حالة الأحرف مثل Oil_Change vs oil_change)
    const lowerType = cleanType.toLowerCase();
    const translatedLower = t(lowerType);
    if (translatedLower !== lowerType) return translatedLower;

    // 3. تنسيق النص تلقائياً إذا كان باللغة الإنجليزية (snake_case) ولم توجد ترجمة
    if (/^[a-z0-9_]+$/i.test(cleanType)) {
      return cleanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return cleanType;
  };

  return (
    <div className="services-section">
      <div className="section-header">
        <h3>{t('serviceHistory')} ({services.length})</h3>
      </div>
      
      {services.length > 0 ? (
        <div className="services-list">
          {services.map(service => (
            <div key={service.id} className="service-item">
              <div className="service-header">
                <h5>{getServiceTitle(service.type)}</h5>
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
                    onClick={() => {
                      if (typeof onPayment === 'function') {
                        onPayment(service);
                      } else {
                        console.error('onPayment prop is not a function', onPayment);
                      }
                    }}
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
  );
};

export default VehicleServiceHistory;