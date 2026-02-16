import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const PurchasePaymentModal = ({ isOpen, onClose, onSuccess, invoice, suppliers, t, isRtl, payment = null }) => {
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setNotes(payment.notes || '');
    } else if (invoice) {
      setAmount((parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0)).toFixed(2));
      setNotes('');
    }
  }, [payment, invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const supplier = suppliers.find(s => s.id == invoice.supplier_id);
  const remaining = payment 
    ? (parseFloat(invoice.amount) - (parseFloat(invoice.paid_amount || 0) - parseFloat(payment.amount))).toFixed(2)
    : (parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || 0)).toFixed(2);

  const handlePrintReceipt = (paymentData) => {
    const language = isRtl ? 'ar' : 'en';
    
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'إيصال دفع مورد' : 'Supplier Payment Receipt'} - ${paymentData.receipt_number || 'N/A'}</title>
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
                  background: linear-gradient(90deg, #10b981, #34d399);
              }
              .header { text-align: center; margin-bottom: 40px; }
              .logo { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 10px; }
              .app-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
              .receipt-badge { 
                  background: #ecfdf5; 
                  color: #059669; 
                  padding: 6px 16px; 
                  border-radius: 20px; 
                  font-weight: bold; 
                  font-size: 14px;
                  display: inline-block;
                  border: 1px solid #d1fae5;
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
                  <div class="receipt-badge">${language === 'ar' ? 'إيصال صرف نقدية' : 'Payment Voucher'}</div>
              </div>
              
              <div class="meta-grid">
                  <div class="meta-item">
                      <span class="meta-label">${language === 'ar' ? 'رقم الإيصال' : 'Receipt No'}</span>
                      <span class="meta-value">#${paymentData.receipt_number || 'N/A'}</span>
                  </div>
                  <div class="meta-item" style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <span class="meta-label">${t.date}</span>
                      <span class="meta-value">${payment?.payment_date || new Date().toLocaleDateString()}</span>
                  </div>
              </div>
              
              <div class="details-section">
                  <div class="detail-row">
                      <span class="detail-label">${language === 'ar' ? 'دفعنا إلى السيد/السادة' : 'Paid To'}</span>
                      <span class="detail-value">${supplier ? supplier.name : '-'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">${t.invoiceNumber}</span>
                      <span class="detail-value">#${invoice.invoice_number}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">${language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Items'}</span>
                      <span class="detail-value">${invoice.items || '-'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">${t.remaining}</span>
                      <span class="detail-value">$${parseFloat(remaining).toFixed(2)}</span>
                  </div>
                  ${notes ? `
                  <div class="detail-row">
                      <span class="detail-label">${t.notes}</span>
                      <span class="detail-value">${notes}</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="amount-box">
                  <div class="amount-label">${language === 'ar' ? 'المبلغ المصروف' : 'Amount Paid'}</div>
                  <div class="amount-value">$${parseFloat(amount).toFixed(2)}</div>
                  <div class="payment-method">
                      ${language === 'ar' ? 'نقداً / شيك' : 'Cash / Check'}
                  </div>
              </div>
              
              <div class="footer">
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${language === 'ar' ? 'توقيع المحاسب' : 'Accountant Signature'}</div>
                  </div>
                  <div class="signature-box">
                      <div class="signature-line"></div>
                      <div class="signature-label">${language === 'ar' ? 'توقيع المستلم' : 'Recipient Signature'}</div>
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
    const win = window.open('', '_blank');
    win.document.write(receiptContent);
    win.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) <= 0) return alert(t.amountGreaterThanZero);
    if (parseFloat(amount) > parseFloat(remaining)) return alert(t.amountExceedsRemaining);

    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        notes: notes,
        payment_date: payment?.payment_date || new Date().toISOString().split('T')[0]
      };

      if (payment) {
        payload.id = payment.id;
      } else {
        payload.invoice_id = invoice.id;
      }

      const response = await fetch('http://localhost/car-garage/backend/api/purchase_payments.php', {
        method: payment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (!payment && window.confirm(t.savedDoYouWantToPrintReceipt)) {
          handlePrintReceipt(result);
        }
        onSuccess();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header" style={{background: '#10b981', color: 'white'}}>
          <h3 className="modal-title" style={{color: 'white'}}>{payment ? (isRtl ? 'تعديل الإيصال' : 'Edit Receipt') : t.payInvoice}</h3>
          <button onClick={onClose} className="modal-close" style={{background: 'rgba(255,255,255,0.2)', color: 'white'}}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="card" style={{padding: '20px', background: '#f8fafc', marginBottom: '24px', border: '1px solid #e2e8f0'}}>
               <div className="text-xs text-gray-500 uppercase font-bold mb-1">{t.invoiceNumber}</div>
               <div className="font-bold text-xl text-gray-800">#{invoice.invoice_number}</div>
               <div className="flex justify-between mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-red-700 font-medium">{t.remaining}:</span>
                  <span className="font-extrabold text-red-600 text-lg">${remaining}</span>
               </div>
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-gray-700">{t.amountToPay}</label>
              <input 
                type="number" 
                step="0.01"
                max={remaining}
                required
                className="form-input font-bold text-xl text-emerald-600"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.notes}</label>
              <textarea 
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder={t.notesPlaceholder}
              />
            </div>

            <div className="form-actions" style={{padding: 0, background: 'none', border: 'none', marginTop: '24px'}}>
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline flex-1 py-4"
              >
                {t.cancel}
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-success flex-1 py-4"
              >
                {loading ? '...' : t.confirmPayInvoice}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchasePaymentModal;