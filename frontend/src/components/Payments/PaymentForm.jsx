import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const PaymentForm = ({ 
  isOpen, 
  onClose, 
  service, 
  payment,
  maxAmount,
  onSubmit 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount || 0,
        payment_method: payment.payment_method || 'cash',
        transaction_id: payment.transaction_id || '',
        notes: payment.notes || '',
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        amount: maxAmount || 0,
        payment_method: 'cash',
        transaction_id: '',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [payment, maxAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.amount > maxAmount) {
      alert(t('amountExceedsRemaining'));
      return;
    }
    
    onSubmit(formData);
    onClose();
  };

  const paymentMethods = [
    { value: 'cash', label: t('cash'), icon: '💵' },
    { value: 'card', label: t('card'), icon: '💳' },
    { value: 'transfer', label: t('transfer'), icon: '🏦' },
    { value: 'check', label: t('check'), icon: '📄' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={payment ? t('editPayment') : t('addPayment')}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{t('amountToPay')} ($)</label>
          <input
            type="number"
            required
            min="0.01"
            max={maxAmount}
            step="0.01"
            className="form-input"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
          />
          <small className="form-help">
            {t('maxAmount')}: ${maxAmount.toFixed(2)}
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">{t('paymentDate')}</label>
          <input
            type="date"
            required
            className="form-input"
            value={formData.payment_date}
            onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('paymentMethod')}</label>
          <div className="payment-methods">
            {paymentMethods.map(method => (
              <label key={method.value} className="payment-method-option">
                <input
                  type="radio"
                  name="payment_method"
                  value={method.value}
                  checked={formData.payment_method === method.value}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                />
                <span className="method-icon">{method.icon}</span>
                <span className="method-label">{method.label}</span>
              </label>
            ))}
          </div>
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
            placeholder={t('paymentNotesPlaceholder')}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {payment ? t('update') : t('confirmPayment')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
