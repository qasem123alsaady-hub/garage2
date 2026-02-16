import React, { useState, useEffect } from 'react';
import PurchaseInvoiceModal from '../modals/PurchaseInvoiceModal';
import PurchasePaymentModal from '../modals/PurchasePaymentModal';
import apiService from '../../services/api';

const PurchaseInvoices = ({ t, isRtl, setPrintData }) => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
    fetchPayments();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await apiService.invoices.getAll();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.suppliers.getAll();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); }
  };

  const fetchPayments = async () => {
    try {
      const data = await apiService.purchasePayments.getAll();
      setPurchasePayments(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); }
  };

  const handlePrint = (invoice) => {
    if (!invoice) return;
    
    const supplier = suppliers.find(s => s.id == invoice.supplier_id);
    const language = isRtl ? 'ar' : 'en';
    
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${language === 'ar' ? 'فاتورة شراء' : 'Purchase Invoice'} - ${invoice.invoice_number}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px; margin: 0; }
              .receipt-container { 
                  background: white; border-radius: 16px; padding: 40px; max-width: 600px; margin: 0 auto; 
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-top: 6px solid #10b981;
              }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; background: #f9fafb; padding: 20px; border-radius: 12px; }
              .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
              .value { font-size: 14px; font-weight: 600; }
              .amount-section { text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #10b981; border-radius: 12px; }
              .amount-label { font-size: 14px; color: #10b981; margin-bottom: 5px; font-weight: bold; }
              .amount-value { font-size: 40px; font-weight: 800; color: #064e3b; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px; color: #64748b; }
              .sig-line { border-top: 1px solid #cbd5e1; width: 150px; margin-top: 40px; }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div class="logo">${t.appName}</div>
                  <div class="badge">${language === 'ar' ? 'فاتورة مشتريات' : 'Purchase Invoice'}</div>
              </div>
              <div class="info-grid">
                  <div>
                      <div class="label">${language === 'ar' ? 'المورد' : 'Supplier'}</div>
                      <div class="value">${supplier ? supplier.name : '-'}</div>
                  </div>
                  <div style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <div class="label">${t.date}</div>
                      <div class="value">${invoice.invoice_date || invoice.date}</div>
                  </div>
                  <div>
                      <div class="label">${t.invoiceNumber}</div>
                      <div class="value">#${invoice.invoice_number}</div>
                  </div>
                  <div style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <div class="label">${t.invoiceItems}</div>
                      <div class="value">${invoice.items}</div>
                  </div>
              </div>
              <div class="amount-section">
                  <div class="amount-label">${t.totalAmount}</div>
                  <div class="amount-value">$${parseFloat(invoice.amount).toFixed(2)}</div>
              </div>
              <div class="footer">
                  <div>
                      <div class="sig-line"></div>
                      <div>${t.signature}</div>
                  </div>
                  <div>
                      <div class="sig-line"></div>
                      <div>${language === 'ar' ? 'ختم الشركة' : 'Company Stamp'}</div>
                  </div>
              </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  const handlePrintHistoricalReceipt = (payment, invoice) => {
    const supplier = suppliers.find(s => s.id == invoice.supplier_id);
    const language = isRtl ? 'ar' : 'en';
    
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <base href="${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}">
          <title>${language === 'ar' ? 'إيصال دفع مورد' : 'Supplier Payment Receipt'} - ${payment.receipt_number || 'N/A'}</title>
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
                      <span class="meta-value">#${payment.receipt_number || 'N/A'}</span>
                  </div>
                  <div class="meta-item" style="text-align: ${language === 'ar' ? 'left' : 'right'}">
                      <span class="meta-label">${t.date}</span>
                      <span class="meta-value">${payment.payment_date}</span>
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
                  ${payment.notes ? `
                  <div class="detail-row">
                      <span class="detail-label">${t.notes}</span>
                      <span class="detail-value">${payment.notes}</span>
                  </div>
                  ` : ''}
              </div>
              
              <div class="amount-box">
                  <div class="amount-label">${language === 'ar' ? 'المبلغ المصروف' : 'Amount Paid'}</div>
                  <div class="amount-value">$${parseFloat(payment.amount).toFixed(2)}</div>
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

  const HistoryModal = () => {
    if (!showHistoryModal || !selectedInvoice) return null;
    const invoicePayments = purchasePayments.filter(p => p.invoice_id == selectedInvoice.id);
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3 className="modal-title">{t.paymentHistory} - #{selectedInvoice.invoice_number}</h3>
            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>&times;</button>
          </div>
          <div className="modal-body">
            {invoicePayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📜</div>
                <div className="empty-title">{t.noData}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {invoicePayments.map(p => (
                  <div key={p.id} className="card" style={{margin: 0, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div className="font-bold text-xl text-emerald-600">${parseFloat(p.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">{p.payment_date}</div>
                      <div className="text-xs font-mono text-gray-400 mt-1">{p.receipt_number}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedPayment(p); setShowPaymentModal(true); }}
                        className="action-btn edit"
                        title={t.edit}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handlePrintHistoricalReceipt(p, selectedInvoice)}
                        className="action-btn"
                        style={{backgroundColor: '#f1f5f9', color: '#475569'}}
                        title={t.print}
                      >
                        🖨️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button onClick={() => setShowHistoryModal(false)} className="btn btn-outline">{t.close}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.purchaseInvoices}</h2>
        <button 
          onClick={() => { setSelectedInvoice(null); setShowModal(true); }}
          className="btn btn-info"
        >
          + {t.addPurchaseInvoice}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.invoiceNumber}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.supplier}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.date}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.amount}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.status}</th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{inv.invoice_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {suppliers.find(s => s.id == inv.supplier_id)?.name || inv.supplier_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.invoice_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">${inv.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`payment-badge ${
                        inv.status === 'paid' ? 'payment-paid' : 
                        inv.status === 'partial' ? 'payment-partial' : 'payment-pending'
                    }`}>
                        {t[inv.status] || inv.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {inv.status !== 'paid' && (
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true); }}
                          className="action-btn"
                          style={{backgroundColor: '#ecfdf5', color: '#059669'}}
                          title={t.pay}
                        >
                            💰
                        </button>
                    )}
                    <button 
                      onClick={() => { setSelectedInvoice(inv); setShowHistoryModal(true); }}
                      className="action-btn"
                      style={{backgroundColor: '#fff7ed', color: '#ea580c'}}
                      title={t.paymentHistory}
                    >
                      📜
                    </button>
                    <button 
                      onClick={() => { setSelectedInvoice(inv); setShowModal(true); }}
                      className="action-btn edit"
                      title={t.edit}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handlePrint(inv)}
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
            {invoices.length === 0 && (
                <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">{t.noPurchaseInvoices}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <PurchaseInvoiceModal 
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedInvoice(null); }}
        onSuccess={() => { fetchInvoices(); setShowModal(false); setSelectedInvoice(null); }}
        suppliers={suppliers}
        t={t}
        invoice={selectedInvoice}
      />

      <PurchasePaymentModal 
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null); setSelectedPayment(null); }}
        onSuccess={() => { fetchInvoices(); fetchPayments(); setShowPaymentModal(false); setSelectedInvoice(null); setSelectedPayment(null); }}
        invoice={selectedInvoice}
        suppliers={suppliers}
        t={t}
        isRtl={isRtl}
        payment={selectedPayment}
      />

      <HistoryModal />
    </div>
  );
};

export default PurchaseInvoices;