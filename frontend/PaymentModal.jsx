import React, { useState, useEffect } from 'react';

function PaymentModal({ isOpen, onClose, onSuccess, service, t }) {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    if (service) {
      setPaymentData(prev => ({
        ...prev,
        amount: parseFloat(service.remaining_amount) || 0
      }));
    }
  }, [service]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!service) return;

    try {
      const response = await fetch('http://localhost/car-garage/backend/api/payments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          transaction_id: paymentData.paymentMethod !== 'cash' ? paymentData.transactionId : '',
          notes: paymentData.notes,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
        onClose();
        alert('✅ تم تسجيل الدفع بنجاح!');
      } else {
        alert('❌ خطأ: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ في الاتصال');
    }
  };

  if (!isOpen || !service) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.payment}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <div style={{padding: '12px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '16px'}}>
            <p>{t.serviceType}: {service.type}</p>
            <p>{t.remaining}: ${service.remaining_amount || service.cost}</p>
          </div>
          <form onSubmit={handlePayment}>
            <div className="form-group">
              <label className="form-label">{t.amountToPay} ($)</label>
              <input type="number" required min="0.01" step="0.01" className="form-input" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.paymentMethod}</label>
              <select required className="form-select" value={paymentData.paymentMethod} onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}>
                <option value="cash">{t.cash}</option>
                <option value="card">{t.card}</option>
                <option value="transfer">{t.transfer}</option>
                <option value="check">{t.check}</option>
              </select>
            </div>
            {paymentData.paymentMethod !== 'cash' && (
              <div className="form-group">
                <label className="form-label">{t.transactionId}</label>
                <input type="text" className="form-input" value={paymentData.transactionId} onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})} placeholder={t.transactionPlaceholder} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{t.paymentNotes}</label>
              <textarea className="form-textarea" value={paymentData.notes} onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} placeholder={t.paymentNotesPlaceholder} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-success">💳 {t.confirmPayment}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;