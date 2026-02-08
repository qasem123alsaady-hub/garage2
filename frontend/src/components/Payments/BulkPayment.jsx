import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const BulkPayment = ({ 
  isOpen, 
  onClose, 
  vehicle,
  services,
  onSubmit 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    notes: ''
  });

  const servicesWithRemaining = services.filter(service => {
    const remaining = parseFloat(service.remaining_amount) || 0;
    return remaining > 0 && service.payment_status !== 'paid';
  });

  const totalRemaining = servicesWithRemaining.reduce((sum, service) => {
    const remaining = parseFloat(service.remaining_amount) || 0;
    return sum + remaining;
  }, 0);

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      amount: totalRemaining
    }));
  }, [totalRemaining]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.amount > totalRemaining) {
      alert(t('amountExceedsRemaining'));
      return;
    }
    
    onSubmit({
      ...formData,
      services: servicesWithRemaining.map(s => s.id)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('bulkPayment')}
      size="large"
    >
      <div className="bulk-payment">
        <div className="payment-header">
          <h4>{vehicle.make} {vehicle.model}</h4>
          <p className="license-plate">{vehicle.license_plate}</p>
        </div>

        <div className="payment-summary">
          <div className="summary-card">
            <h5>{t('bulkPaymentSummary')}</h5>
            <div className="summary-details">
              <div className="detail-item">
                <span>{t('servicesCountForBulkPayment')}:</span>
                <strong>{servicesWithRemaining.length}</strong>
              </div>
              <div className="detail-item">
                <span>{t('totalRemainingAmount')}:</span>
                <strong className="remaining">${totalRemaining.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {servicesWithRemaining.length > 0 && (
          <div className="services-list">
            <h5>{t('servicesIncluded')}</h5>
            <div className="services-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('service')}</th>
                    <th>{t('date')}</th>
                    <th>{t('remainingAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesWithRemaining.map(service => (
                    <tr key={service.id}>
                      <td>{service.type}</td>
                      <td>{service.date}</td>
                      <td className="remaining-amount">
                        ${parseFloat(service.remaining_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('amountToPay')} ($)</label>
            <input
              type="number"
              required
              min="0.01"
              max={totalRemaining}
              step="0.01"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
            />
            <small className="form-help">
              {t('maxAmount')}: ${totalRemaining.toFixed(2)}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">{t('paymentMethod')}</label>
            <select
              required
              className="form-input"
              value={formData.payment_method}
              onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
            >
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
              <option value="transfer">{t('transfer')}</option>
              <option value="check">{t('check')}</option>
            </select>
          </div>

          {formData.payment_method !== 'cash' && (
            <div className="form-group">
              <label className="form-label">{t('transactionId')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.transaction_id}
                onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                placeholder={t('transactionPlaceholder')}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder={t('bulkPaymentNotes')}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              💰 {t('payAllServices')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BulkPayment;
