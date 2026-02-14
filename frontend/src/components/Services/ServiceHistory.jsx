import React, { useState } from 'react';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const ServiceHistory = ({ 
  service, 
  vehicle, 
  customer,
  payments,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onClose 
}) => {
  const { t } = useTranslation();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const remaining = parseFloat(service.cost) - totalPaid;

  return (
    <Modal
      isOpen={!!service}
      onClose={onClose}
      title={`${t('serviceHistory')} - ${service?.type}`}
      size="large"
    >
      {service && (
        <div className="service-history">
          <div className="service-overview">
            <div className="overview-card">
              <h4>{t('serviceDetails')}</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('type')}:</span>
                  <span className="detail-value">{service.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('date')}:</span>
                  <span className="detail-value">{service.date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('technician')}:</span>
                  <span className="detail-value">{service.technician}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('status')}:</span>
                  <StatusBadge status={service.status} />
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('paymentStatus')}:</span>
                  <PaymentBadge status={service.payment_status} />
                </div>
              </div>
              
              <div className="cost-summary">
                <div className="cost-item">
                  <span>{t('totalCost')}:</span>
                  <strong>${service.cost}</strong>
                </div>
                <div className="cost-item">
                  <span>{t('totalPaid')}:</span>
                  <strong className="paid">${totalPaid.toFixed(2)}</strong>
                </div>
                <div className="cost-item">
                  <span>{t('remaining')}:</span>
                  <strong className={remaining > 0 ? 'remaining' : 'paid'}>
                    ${remaining.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {vehicle && customer && (
              <div className="related-info">
                <div className="info-card">
                  <h5>{t('vehicleInfo')}</h5>
                  <p>{vehicle.make} {vehicle.model}</p>
                  <p>{t('licensePlate')}: {vehicle.license_plate}</p>
                </div>
                <div className="info-card">
                  <h5>{t('customerInfo')}</h5>
                  <p>{customer.name}</p>
                  <p>{t('phone')}: {customer.phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="description-section">
            <h5>{t('description')}</h5>
            <p>{service.description}</p>
          </div>

          <div className="payments-section">
            <div className="section-header">
              <h4>{t('paymentHistory')}</h4>
              {remaining > 0 && (
                <button 
                  onClick={() => setShowPaymentForm(true)}
                  className="btn btn-success"
                >
                  ➕ {t('addPayment')}
                </button>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="payments-table">
                <table>
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
                          <span className="payment-method">
                            {payment.payment_method === 'cash' ? t('cash') :
                             payment.payment_method === 'card' ? t('card') :
                             payment.payment_method === 'transfer' ? t('transfer') : t('check')}
                          </span>
                        </td>
                        <td>{payment.transaction_id || '-'}</td>
                        <td>{payment.notes || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowPaymentForm(true);
                              }}
                              className="btn-icon"
                              title={t('edit')}
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => onDeletePayment(payment.id)}
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
                        ${totalPaid.toFixed(2)}
                      </td>
                      <td colSpan="4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="no-payments">
                <p>{t('noPayments')}</p>
              </div>
            )}
          </div>

          {showPaymentForm && (
            <PaymentForm
              isOpen={showPaymentForm}
              onClose={() => {
                setShowPaymentForm(false);
                setSelectedPayment(null);
              }}
              service={service}
              payment={selectedPayment}
              maxAmount={remaining}
              onSubmit={(paymentData) => {
                if (selectedPayment) {
                  onEditPayment(selectedPayment.id, paymentData);
                } else {
                  onAddPayment(paymentData);
                }
                setShowPaymentForm(false);
                setSelectedPayment(null);
              }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ServiceHistory;
