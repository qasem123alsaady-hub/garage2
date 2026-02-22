import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function VehiclePaymentModal({ isOpen, onClose, onSuccess, vehicle, services, t, isRtl, permissions }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  // Filter services for this vehicle that are not fully paid
  const pendingServices = services.filter(s => s.vehicle_id === vehicle?.id && s.payment_status !== 'paid');
  const totalRemaining = pendingServices.reduce((sum, s) => sum + (parseFloat(s.remaining_amount) || 0), 0);

  useEffect(() => {
    if (isOpen && vehicle) {
      fetchPayments();
      if (!selectedPayment) {
        setPaymentData({
          amount: totalRemaining.toFixed(2),
          paymentMethod: 'cash',
          transactionId: '',
          notes: isRtl ? `دفع شامل للمركبة ${vehicle.license_plate}` : `Comprehensive payment for vehicle ${vehicle.license_plate}`
        });
      }
    }
  }, [isOpen, vehicle, totalRemaining, selectedPayment]);

  const fetchPayments = async () => {
    try {
      const data = await apiService.payments.getByVehicleId(vehicle.id);
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!vehicle && !selectedPayment) return;

    if (parseFloat(paymentData.amount) <= 0) return alert(t.amountGreaterThanZero);
    if (!selectedPayment && parseFloat(paymentData.amount) > parseFloat(totalRemaining)) {
        if (!window.confirm(isRtl ? 'المبلغ المدخل أكبر من المتبقي، هل تريد الاستمرار؟' : 'Entered amount exceeds remaining, do you want to continue?')) return;
    }

    setLoading(true);
    try {
      let result;
      if (selectedPayment) {
        // Edit existing payment
        const payload = {
          payment_id: selectedPayment.id,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          transaction_id: paymentData.transactionId,
          notes: paymentData.notes,
          payment_date: selectedPayment.payment_date
        };
        result = await apiService.payments.update(payload);
      } else {
        // Create new bulk payment
        const payload = {
          action: 'bulk',
          vehicle_id: vehicle.id,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          transaction_id: paymentData.transactionId,
          notes: paymentData.notes
        };
        result = await apiService.payments.createBulk(payload);
      }

      if (result.success) {
        alert(`✅ ${t.paymentSuccess}`);
        fetchPayments();
        setSelectedPayment(null);
        onSuccess();
        if (!selectedPayment) onClose();
      } else {
        alert(`❌ ${t.error}: ` + result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الدفعة؟' : 'Are you sure you want to delete this payment?')) return;

    try {
      const result = await apiService.payments.delete(id);
      if (result.success) {
        fetchPayments();
        onSuccess();
        alert(isRtl ? '✅ تم حذف الدفعة بنجاح' : '✅ Payment deleted successfully');
      } else {
        alert(`❌ ${t.error}: ` + result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t.connectionError);
    }
  };

  const getServiceTypeLabel = (type) => {
    if (!type) return '-';
    const mapping = {
      'oil_change': t.oilChange, 'brake_service': t.brakeService, 'tire_rotation': t.tireRotation,
      'engine_repair': t.engineRepair, 'other': t.other, 'تغيير الزيت': t.oilChange,
      'خدمة الفرامل': t.brakeService, 'تدوير الإطارات': t.tireRotation, 'إصلاح المحرك': t.engineRepair, 'أخرى': t.other
    };
    return mapping[type] || type;
  };

  const handleEditClick = (payment) => {
    setSelectedPayment(payment);
    setPaymentData({
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id || '',
      notes: payment.notes || ''
    });
  };

  const handlePrintReceipt = (payment) => {
    if (!payment) return;
    
    const language = isRtl ? 'ar' : 'en';

    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${t.receipt || 'Receipt'} - ${payment.id}</title>
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
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
              .meta-item { display: flex; flex-direction: column; }
              .meta-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
              .meta-value { font-size: 15px; font-weight: 600; color: #0f172a; }
              .details-section { margin-bottom: 30px; }
              .detail-row { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #475569; font-weight: 500; }
              .detail-value { font-weight: 600; color: #0f172a; text-align: ${language === 'ar' ? 'left' : 'right'}; max-width: 60%; }
              .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0; }
              .amount-label { color: #166534; font-size: 14px; margin-bottom: 4px; font-weight: 500; }
              .amount-value { color: #15803d; font-size: 36px; font-weight: 800; letter-spacing: -1px; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
              .signature-box { text-align: center; }
              .signature-line { width: 200px; border-top: 2px solid #e2e8f0; margin-top: 50px; }
              .signature-label { color: #94a3b8; font-size: 13px; margin-top: 8px; font-weight: 500; }
              .thank-you { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 13px; }
              @media print {
                  body { background: white; padding: 0; }
                  .receipt-container { box-shadow: none; border: none; padding: 0; max-width: 100%; border-radius: 0; }
                  .receipt-container::before { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div class="logo">
                      <img src="${t.logo}" alt="Logo" style="height: 120px; margin-${language === 'ar' ? 'left' : 'right'}: 10px;" onerror="this.style.display='none';">
                      ${t.appName}
                  </div>
                  <div class="app-subtitle">${t.appSubtitle}</div>
                  <div class="receipt-badge">${t.garageReceipt}</div>
              </div>
              <div class="meta-grid">
                  <div class="meta-item"><span class="meta-label">${t.receiptNumber}</span><span class="meta-value">#${payment.id}</span></div>
                  <div class="meta-item" style="text-align: ${language === 'ar' ? 'left' : 'right'}"><span class="meta-label">${t.date}</span><span class="meta-value">${payment.payment_date}</span></div>
              </div>
              <div class="details-section">
                  <div class="detail-row"><span class="detail-label">${t.vehicle}</span><span class="detail-value">${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</span></div>
                  <div class="detail-row"><span class="detail-label">${t.serviceType}</span><span class="detail-value">${payment.service_type || '-'}</span></div>
                  ${payment.notes ? `<div class="detail-row"><span class="detail-label">${t.notes}</span><span class="detail-value">${payment.notes}</span></div>` : ''}
              </div>
              <div class="amount-box">
                  <div class="amount-label">${t.paidAmount}</div>
                  <div class="amount-value">$${parseFloat(payment.amount).toFixed(2)}</div>
                  <div class="payment-method">${payment.payment_method} ${payment.transaction_id ? `- ${payment.transaction_id}` : ''}</div>
              </div>
              <div class="footer">
                  <div class="signature-box"><div class="signature-line"></div><div class="signature-label">${t.signature}</div></div>
                  <div class="signature-box"><div class="signature-line"></div><div class="signature-label">${language === 'ar' ? 'ختم الشركة' : 'Company Stamp'}</div></div>
              </div>
              <div class="thank-you">${language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '900px', width: '95%'}}>
        <div className="modal-header">
          <h3 className="modal-title">{selectedPayment ? t.editPayment : (isRtl ? 'دفع شامل للمركبة' : 'Comprehensive Vehicle Payment')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body flex flex-col lg:flex-row gap-8">
          {/* Payment Form */}
          <div className="flex-[1.2]">
            <div className="card" style={{padding: '20px', background: '#eff6ff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #dbeafe'}}>
                <div className="flex justify-between mb-3">
                    <span className="text-blue-600 font-bold uppercase text-xs tracking-wider">{t.vehicle}</span>
                    <span className="font-bold text-blue-900">{vehicle.make} {vehicle.model} ({vehicle.license_plate})</span>
                </div>
                
                {!selectedPayment && (
                    <div className="space-y-3">
                        <div className="bg-white/50 p-3 rounded-lg border border-blue-100">
                            <div className="text-xs text-blue-500 font-bold mb-2 uppercase">{isRtl ? 'الخدمات المستحقة' : 'Outstanding Services'}</div>
                            <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {pendingServices.map(s => (
                                    <div key={s.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate max-w-[150px]">{getServiceTypeLabel(s.type)}</span>
                                        <span className="font-bold text-gray-800">${parseFloat(s.remaining_amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-blue-200 pt-3 mt-3">
                            <span className="text-blue-800 font-extrabold text-lg">{isRtl ? 'إجمالي المتبقي' : 'Total Remaining'}</span>
                            <span className="text-blue-800 font-black text-3xl">${totalRemaining.toFixed(2)}</span>
                        </div>
                    </div>
                )}
                {selectedPayment && (
                    <div className="flex justify-between items-center border-t border-blue-200 pt-3 mt-3">
                        <span className="text-blue-800 font-bold">{isRtl ? 'تعديل دفعة بتاريخ' : 'Editing payment from'}:</span>
                        <span className="font-bold text-blue-900">{selectedPayment.payment_date}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
                <div className="form-group">
                <label className="form-label font-bold text-gray-700">{t.amount} ($)</label>
                <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01" 
                    className="form-input font-bold text-xl text-emerald-600 bg-emerald-50/30 border-emerald-100" 
                    value={paymentData.amount} 
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} 
                />
                {!selectedPayment && (
                    <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                        <span className="text-[10px] text-gray-400">ℹ️</span>
                        <p className="text-[11px] text-gray-500 italic">
                            {isRtl ? 'سيتم توزيع المبلغ على الخدمات الأقدم أولاً' : 'Amount will be distributed to oldest services first'}
                        </p>
                    </div>
                )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">{t.paymentMethod}</label>
                        <select 
                            required 
                            className="form-select" 
                            value={paymentData.paymentMethod} 
                            onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                        >
                            <option value="cash">{t.cash}</option>
                            <option value="card">{t.card}</option>
                            <option value="transfer">{t.transfer}</option>
                            <option value="check">{t.check}</option>
                        </select>
                    </div>

                    {paymentData.paymentMethod !== 'cash' && (
                        <div className="form-group">
                            <label className="form-label">{t.transactionId}</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={paymentData.transactionId} 
                                onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})} 
                                placeholder={t.transactionPlaceholder} 
                            />
                        </div>
                    )}
                </div>

                <div className="form-group">
                <label className="form-label">{t.notes}</label>
                <textarea 
                    className="form-textarea" 
                    rows="2"
                    value={paymentData.notes} 
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} 
                />
                </div>

                <div className="form-actions" style={{padding: 0, background: 'none', border: 'none', marginTop: '30px'}}>
                    <button type="submit" className="btn btn-success flex-1 py-4 text-lg" disabled={loading || (!selectedPayment && totalRemaining <= 0)}>
                        {loading ? '...' : (selectedPayment ? t.save : `💳 ${isRtl ? 'تأكيد الدفع الشامل' : 'Confirm Bulk Payment'}`)}
                    </button>
                    {selectedPayment && (
                        <button type="button" className="btn btn-outline flex-1 py-4" onClick={() => setSelectedPayment(null)}>{t.cancel}</button>
                    )}
                </div>
            </form>
          </div>

          {/* Payment History */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-r lg:pr-8 pt-6 lg:pt-0">
            <h4 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-2">
                <span>📜</span> {isRtl ? 'سجل دفعات المركبة' : 'Vehicle Payment History'}
            </h4>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {payments.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="text-start p-3 text-xs font-bold text-gray-500 uppercase">{t.date}</th>
                                <th className="text-start p-3 text-xs font-bold text-gray-500 uppercase">{t.amount}</th>
                                <th className="text-center p-3 text-xs font-bold text-gray-500 uppercase">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3">
                                        <div className="text-sm text-gray-700 font-medium">{p.payment_date}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">#{p.id}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold text-emerald-600">${parseFloat(p.amount).toFixed(2)}</div>
                                        <div className="text-[11px] text-gray-500 truncate max-w-[100px]">{getServiceTypeLabel(p.service_type)}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-1.5">
                                            {permissions?.canEditPayments && (
                                                <>
                                                  <button onClick={() => handleEditClick(p)} className="action-btn edit scale-90" title={t.edit}>✏️</button>
                                                  <button onClick={() => handleDeletePayment(p.id)} className="action-btn delete scale-90" title={t.delete}>🗑️</button>
                                                </>
                                            )}
                                            <button 
                                              onClick={() => handlePrintReceipt(p)} 
                                              className="action-btn scale-90" 
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
                    <div className="empty-state" style={{padding: '80px 20px'}}>
                        <div className="empty-icon" style={{fontSize: '48px'}}>💸</div>
                        <p className="empty-title text-gray-400" style={{fontSize: '16px'}}>{isRtl ? 'لا توجد دفعات مسجلة بعد' : 'No payments recorded yet'}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehiclePaymentModal;
