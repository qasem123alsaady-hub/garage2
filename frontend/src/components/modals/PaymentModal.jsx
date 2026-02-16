import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function PaymentModal({ isOpen, onClose, onSuccess, service, t, isRtl, vehicles, customers, payment: initialPayment = null }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(initialPayment);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && service) {
      fetchPayments();
    }
  }, [isOpen, service]);

  useEffect(() => {
    if (selectedPayment) {
      setPaymentData({
        payment_id: selectedPayment.id,
        amount: selectedPayment.amount,
        paymentMethod: selectedPayment.payment_method,
        transactionId: selectedPayment.transaction_id || '',
        notes: selectedPayment.notes || ''
      });
    } else if (service) {
      setPaymentData({
        amount: parseFloat(service.remaining_amount) || 0,
        paymentMethod: 'cash',
        transactionId: '',
        notes: ''
      });
    }
  }, [service, selectedPayment, isOpen]);

  const fetchPayments = async () => {
    try {
      const data = await apiService.payments.getByServiceId(service.id);
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!service && !selectedPayment) return;

    try {
      let result;
      const payload = {
        service_id: service?.id || selectedPayment?.service_id,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        transactionId: paymentData.paymentMethod !== 'cash' ? paymentData.transactionId : '',
        notes: paymentData.notes,
        payment_date: selectedPayment?.payment_date || new Date().toISOString().split('T')[0]
      };

      if (selectedPayment) {
        payload.payment_id = selectedPayment.id;
        result = await apiService.payments.update(payload);
      } else {
        result = await apiService.payments.create(payload);
      }

      if (result.success) {
        fetchPayments();
        setSelectedPayment(null);
        onSuccess();
        alert(`✅ ${selectedPayment ? t.paymentUpdated : t.paymentSuccess}`);
      } else {
        alert(`❌ ${t.error}: ` + result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t.connectionError);
    }
  };

  const handlePrintReceipt = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || !service) return;
    
    const vehicle = vehicles ? vehicles.find(v => v.id === service.vehicle_id) : null;
    const customer = (vehicle && customers) ? customers.find(c => c.id === vehicle.customer_id) : null;
    const language = isRtl ? 'ar' : 'en';

    const getServiceTypeLabel = (type) => {
        if (!type) return '-';
        const mapping = {
          'oil_change': t.oilChange,
          'brake_service': t.brakeService,
          'tire_rotation': t.tireRotation,
          'engine_repair': t.engineRepair,
          'other': t.other,
          'تغيير الزيت': t.oilChange,
          'خدمة الفرامل': t.brakeService,
          'تدوير الإطارات': t.tireRotation,
          'إصلاح المحرك': t.engineRepair,
          'أخرى': t.other
        };
        return mapping[type] || type;
    };

    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${t.receipt} - ${payment.id}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px; margin: 0; }
              .receipt-container { 
                  background: white;
                  border-radius: 16px;
                  padding: 40px; 
                  max-width: 700px; 
                  margin: 0 auto; 
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  position: relative;
                  overflow: hidden;
              }
              .receipt-container::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 6px;
                  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              }
              .header { text-align: center; margin-bottom: 40px; }
              .logo { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 10px; }
              .app-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
              .receipt-badge { 
                  background: #eff6ff; 
                  color: #1d4ed8; 
                  padding: 6px 16px; 
                  border-radius: 20px; 
                  font-weight: bold; 
                  font-size: 14px;
                  display: inline-block;
                  border: 1px solid #dbeafe;
              }
              
              .meta-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 12px;
                  border: 1px solid #e2e8f0;
              }
              .meta-item { display: flex; flex-direction: column; }
              .meta-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
              .meta-value { font-size: 15px; font-weight: 600; color: #0f172a; }
              
              .details-section { margin-bottom: 30px; }
              .detail-row { 
                  display: flex; 
                  justify-content: space-between; 
                  padding: 16px 0; 
                  border-bottom: 1px solid #f1f5f9;
              }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #475569; font-weight: 500; }
              .detail-value { font-weight: 600; color: #0f172a; text-align: ${language === 'ar' ? 'left' : 'right'}; max-width: 60%; }
              
              .amount-box {
                  background: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 12px;
                  padding: 24px;
                  text-align: center;
                  margin: 30px 0;
              }
              .amount-label { color: #166534; font-size: 14px; margin-bottom: 4px; font-weight: 500; }
              .amount-value { color: #15803d; font-size: 36px; font-weight: 800; letter-spacing: -1px; }
              .payment-method { color: #166534; font-size: 13px; margin-top: 4px; opacity: 0.8; }
              
              .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
              .signature-box { text-align: center; }
              .signature-line { width: 200px; border-top: 2px solid #e2e8f0; margin-top: 50px; }
              .signature-label { color: #94a3b8; font-size: 13px; margin-top: 8px; font-weight: 500; }
              
              .thank-you { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 13px; }

              @media print {
                  body { background: white; padding: 0; }
                  .receipt-container { box-shadow: none; border: none; padding: 0; max-width: 100%; border-radius: 0; }
                  .receipt-container::before { display: none; }
                  .no-print { display: none; }
                  .amount-box { border: 1px solid #ddd; background: #f9f9f9; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div class="logo">
                      <img src="${t.logo}" alt="Logo" style="height: 120px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<span style=\'font-size:80px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;\'>🚗</span>');">
                      ${t.appName}
                  </div>
                  <div class="app-subtitle">${t.appSubtitle}</div>
                  <div class="receipt-badge">${t.garageReceipt}</div>
              </div>
              
              <div class="meta-grid">
                  <div class="meta-item">
                      <span class="meta-label">${t.receiptNumber}</span>
                      <span class="meta-value">#${payment.id}</span>
                  </div>
                  <div class="meta-item" style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <span class="meta-label">${t.date}</span>
                      <span class="meta-value">${payment.payment_date}</span>
                  </div>
              </div>
              
              <div class="details-section">
                  <div class="detail-row">
                      <span class="detail-label">${t.receivedFrom}</span>
                      <span class="detail-value">${customer ? customer.name : (language === 'ar' ? 'عميل نقدي' : 'Cash Customer')}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">${t.forService}</span>
                      <span class="detail-value">${getServiceTypeLabel(service.type)}</span>
                  </div>
                  ${vehicle ? `
                  <div class="detail-row">
                      <span class="detail-label">${language === 'ar' ? 'المركبة' : 'Vehicle'}</span>
                      <span class="detail-value">${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                      <span class="detail-label">${t.remaining}</span>
                      <span class="detail-value">$${parseFloat(service.remaining_amount || 0).toFixed(2)}</span>
                  </div>
                  ${payment.notes ? `
                  <div class="detail-row">
                      <span class="detail-label">${t.notes}</span>
                      <span class="detail-value">${payment.notes}</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="amount-box">
                  <div class="amount-label">${t.paidAmount}</div>
                  <div class="amount-value">$${parseFloat(payment.amount).toFixed(2)}</div>
                  <div class="payment-method">
                      ${payment.payment_method === 'cash' ? t.cash : payment.payment_method === 'card' ? t.card : payment.payment_method === 'transfer' ? t.transfer : t.check}
                      ${payment.transaction_id ? ` - ${payment.transaction_id}` : ''}
                  </div>
              </div>
              
              <div class="footer">
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${t.signature}</div>
                  </div>
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${language === 'ar' ? 'ختم الشركة' : 'Company Stamp'}</div>
                  </div>
              </div>
              
              <div class="thank-you">
                  ${language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}
              </div>
          </div>
          <script>
              window.onload = function() { window.print(); }
              window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  if (!isOpen || (!service && !selectedPayment)) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '800px', width: '95%'}}>
        <div className="modal-header">
          <h3 className="modal-title">{selectedPayment ? t.editPayment : t.payment}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            {!selectedPayment && service && (
              <div className="card" style={{padding: '20px', background: '#f0f9ff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #bae6fd'}}>
                <p className="mb-2"><strong>{t.serviceType}:</strong> <span className="text-blue-700">{getServiceTypeLabel(service.type)}</span></p>
                <p><strong>{t.remaining}:</strong> <span className="text-xl font-bold text-blue-700">${service.remaining_amount || service.cost}</span></p>
              </div>
            )}
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="form-group">
                <label className="form-label">{t.amountToPay || t.amount} ($)</label>
                <input type="number" required min="0.01" step="0.01" className="form-input font-bold text-lg" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})} />
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
              <div className="form-actions" style={{padding: 0, background: 'none', border: 'none', marginTop: '24px'}}>
                <button type="submit" className="btn btn-success flex-1 py-4">
                  {selectedPayment ? t.save : `💳 ${t.confirmPayment}`}
                </button>
                {selectedPayment && (
                  <button type="button" className="btn btn-outline flex-1 py-4" onClick={() => setSelectedPayment(null)}>{t.cancel}</button>
                )}
              </div>
            </form>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-r pr-0 md:pr-8 pt-6 md:pt-0">
            <h4 className="font-bold text-xl mb-6 text-gray-800">{t.paymentHistory || 'سجل الدفعات'}</h4>
            <div className="max-h-[400px] overflow-y-auto">
              {payments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr>
                      <th className="text-start py-3 text-xs font-bold text-gray-500 uppercase">{t.date}</th>
                      <th className="text-start py-3 text-xs font-bold text-gray-500 uppercase">{t.amount}</th>
                      <th className="text-start py-3 text-xs font-bold text-gray-500 uppercase">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 text-sm text-gray-600">{p.payment_date}</td>
                        <td className="py-4 text-sm font-bold text-emerald-600">${p.amount}</td>
                        <td className="py-4 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedPayment(p)} className="action-btn edit" title={t.edit}>✏️</button>
                            <button 
                              onClick={() => handlePrintReceipt(p.id)} 
                              className="action-btn"
                              style={{backgroundColor: '#f1f5f9', color: '#475569'}}
                              title={t.print}
                            >
                              🖨️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state" style={{padding: '40px 20px'}}>
                  <div className="empty-icon" style={{fontSize: '32px'}}>💰</div>
                  <div className="empty-title" style={{fontSize: '16px'}}>{t.noPayments || 'لا توجد دفعات مسجلة'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;