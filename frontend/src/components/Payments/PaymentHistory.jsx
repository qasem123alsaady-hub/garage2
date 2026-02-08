import React from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const PaymentHistory = ({ 
  isOpen, 
  onClose, 
  payments,
  service,
  onEdit,
  onDelete 
}) => {
  const { t } = useTranslation();

  const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'transfer': return '🏦';
      case 'check': return '📄';
      default: return '💰';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch(method) {
      case 'cash': return t('cash');
      case 'card': return t('card');
      case 'transfer': return t('transfer');
      case 'check': return t('check');
      default: return method;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('paymentHistory')}
      size="large"
    >
      <div className="payment-history">
        {service && (
          <div className="payment-header">
            <h4>{service.type}</h4>
            <div className="payment-summary">
              <div className="summary-item">
                <span>{t('totalCost')}:</span>
                <strong>${service.cost}</strong>
              </div>
              <div className="summary-item">
                <span>{t('totalPaid')}:</span>
                <strong className="paid">${totalAmount.toFixed(2)}</strong>
              </div>
              <div className="summary-item">
                <span>{t('remaining')}:</span>
                <strong className="remaining">
                  ${(parseFloat(service.cost) - totalAmount).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {payments.length > 0 ? (
          <>
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('paymentMethod')}</th>
                    <th>{t('transactionId')}</th>
                    <th>{t('notes')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.payment_date}</td>
                      <td className="amount-cell">${payment.amount}</td>
                      <td>
                        <span className="payment-method-badge">
                          <span className="method-icon">
                            {getPaymentMethodIcon(payment.payment_method)}
                          </span>
                          <span className="method-label">
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </span>
                      </td>
                      <td>{payment.transaction_id || '-'}</td>
                      <td>{payment.notes || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => onEdit(payment)}
                            className="btn-icon"
                            title={t('edit')}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDelete(payment.id)}
                            className="btn-icon danger"
                            title={t('delete')}
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="1" className="total-label">
                      {t('total')}:
                    </td>
                    <td className="total-amount">
                      ${totalAmount.toFixed(2)}
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="payment-stats">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-value">{payments.length}</div>
                  <div className="stat-label">{t('totalPayments')}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-value">${totalAmount.toFixed(2)}</div>
                  <div className="stat-label">{t('totalAmount')}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-info">
                  <div className="stat-value">
                    {payments.filter(p => p.payment_method === 'cash').length}
                  </div>
                  <div className="stat-label">{t('cashPayments')}</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💳</div>
                <div className="stat-info">
                  <div className="stat-value">
                    {payments.filter(p => p.payment_method === 'card').length}
                  </div>
                  <div className="stat-label">{t('cardPayments')}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-payments">
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h4>{t('noPayments')}</h4>
              <p>{t('noPaymentsDescription')}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentHistory;
