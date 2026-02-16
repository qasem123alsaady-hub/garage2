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
          amount: totalRemaining,
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
    
    // Find the service related to this payment
    const service = services.find(s => s.id === payment.service_id);
    if (!service) return;

    const language = isRtl ? 'ar' : 'en';
    const customer = vehicle ? vehicle.customer_name : ''; // Note: needs customer info

    const getServiceTypeLabel = (type) => {
        if (!type) return '-';
        const mapping = {
          'oil_change': t.oilChange, 'brake_service': t.brakeService, 'tire_rotation': t.tireRotation,
          'engine_repair': t.engineRepair, 'other': t.other, 'تغيير الزيت': t.oilChange,
          'خدمة الفرامل': t.brakeService, 'تدوير الإطارات': t.tireRotation, 'إصلاح المحرك': t.engineRepair, 'أخرى': t.other
        };
        return mapping[type] || type;
    };

    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${t.receipt || 'Receipt'} - ${payment.id}</title>
          <style>
              body { font-family: 'Segoe UI', sans-serif; padding: 40px; }
              .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
              .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .amount-box { background: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; }
              .amount { font-size: 32px; font-weight: bold; color: #15803d; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>${t.appName}</h2>
                  <p>${t.garageReceipt || 'Payment Receipt'}</p>
              </div>
              <div class="row"><span>${t.receiptNumber}:</span> <span>#${payment.id}</span></div>
              <div class="row"><span>${t.date}:</span> <span>${payment.payment_date}</span></div>
              <div class="row"><span>${t.vehicle}:</span> <span>${vehicle.make} ${vehicle.model} (${vehicle.license_plate})</span></div>
              <div class="row"><span>${t.serviceType}:</span> <span>${getServiceTypeLabel(service.type)}</span></div>
              <div class="amount-box">
                  <div>${t.paidAmount}</div>
                  <div class="amount">$${parseFloat(payment.amount).toFixed(2)}</div>
                  <div>${payment.payment_method} ${payment.transaction_id ? `- ${payment.transaction_id}` : ''}</div>
              </div>
              <div style="margin-top: 20px; color: #666; font-size: 14px;">${payment.notes || ''}</div>
          </div>
          <script>window.print();</script>
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
      <div className="modal max-w-4xl w-full">
        <div className="modal-header">
          <h3 className="modal-title">{selectedPayment ? t.editPayment : (isRtl ? 'دفع شامل للمركبة' : 'Comprehensive Vehicle Payment')}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body flex flex-col lg:flex-row gap-6">
          {/* Payment Form */}
          <div className="flex-1">
            <div className="card" style={{padding: '24px', background: '#f0f9ff', borderRadius: '20px', marginBottom: '24px', border: '1px solid #bae6fd'}}>
                <div className="flex justify-between mb-2">
                    <span className="text-blue-600 font-medium">{t.vehicle}:</span>
                    <span className="font-bold text-blue-900">{vehicle.make} {vehicle.model} ({vehicle.license_plate})</span>
                </div>
                {!selectedPayment && (
                    <>
                        <div className="flex justify-between mb-2">
                            <span className="text-blue-600 font-medium">{isRtl ? 'الخدمات المعلقة' : 'Pending Services'}:</span>
                            <span className="font-bold text-blue-900">{pendingServices.length}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 pt-3 mt-3">
                            <span className="text-blue-800 font-extrabold">{isRtl ? 'إجمالي المتبقي' : 'Total Remaining'}:</span>
                            <span className="text-blue-800 font-black text-2xl">${totalRemaining.toLocaleString()}</span>
                        </div>
                    </>
                )}
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
                <div className="form-group">
                <label className="form-label">{t.amount} ($)</label>
                <input 
                    type="number" 
                    required 
                    min="0.01" 
                    step="0.01" 
                    className="form-input font-bold text-lg" 
                    value={paymentData.amount} 
                    onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})} 
                />
                {!selectedPayment && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                        {isRtl ? '* سيتم توزيع المبلغ على الخدمات الأقدم أولاً' : '* Amount will be distributed to oldest services first'}
                    </p>
                )}
                </div>

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

                <div className="form-group">
                <label className="form-label">{t.notes}</label>
                <textarea 
                    className="form-textarea" 
                    value={paymentData.notes} 
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} 
                />
                </div>

                <div className="form-actions" style={{padding: 0, background: 'none', border: 'none', marginTop: '24px'}}>
                    <button type="submit" className="btn btn-success flex-1 py-4" disabled={loading || (!selectedPayment && totalRemaining <= 0)}>
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
            <div className="max-h-[450px] overflow-y-auto">
                {payments.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-start p-3 text-xs font-bold text-gray-500 uppercase">{t.date}</th>
                                <th className="text-start p-3 text-xs font-bold text-gray-500 uppercase">{t.service}</th>
                                <th className="text-start p-3 text-xs font-bold text-gray-500 uppercase">{t.amount}</th>
                                <th className="text-center p-3 text-xs font-bold text-gray-500 uppercase">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3 text-sm text-gray-600 whitespace-nowrap">{new Date(p.payment_date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-xs text-gray-800 truncate max-w-[120px]">{p.service_type}</div>
                                    </td>
                                    <td className="p-3 font-bold text-emerald-600">${p.amount}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                            {permissions?.canEditPayments && (
                                                <button onClick={() => handleEditClick(p)} className="action-btn edit" title={t.edit}>✏️</button>
                                            )}
                                            <button 
                                              onClick={() => handlePrintReceipt(p)} 
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
                    <div className="empty-state" style={{padding: '60px 20px'}}>
                        <div className="empty-icon" style={{fontSize: '48px'}}>💸</div>
                        <p className="empty-title" style={{fontSize: '18px'}}>{isRtl ? 'لا توجد دفعات مسجلة بعد' : 'No payments recorded yet'}</p>
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
