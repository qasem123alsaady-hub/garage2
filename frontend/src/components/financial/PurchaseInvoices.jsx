import React, { useState, useEffect } from 'react';
import PurchaseInvoiceModal from '../modals/PurchaseInvoiceModal';
import PurchasePaymentModal from '../modals/PurchasePaymentModal';
import apiService from '../../services/api';

const PurchaseInvoices = ({ t, isRtl, setPrintData, permissions }) => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      const result = await apiService.invoices.delete(id);
      if (result.success) {
        fetchInvoices();
        alert(t.deleteSuccess);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
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
                      onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true); }}
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
                    {permissions.canDelete && (
                      <button 
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="action-btn delete"
                        title={t.delete}
                      >
                        🗑️
                      </button>
                    )}
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
        initialPayment={selectedPayment}
      />
    </div>
  );
};

export default PurchaseInvoices;