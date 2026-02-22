import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import ReportDateRangeModal from '../modals/ReportDateRangeModal';

const SupplierManagement = ({ t, isRtl }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', contact_person: '' });

  useEffect(() => {
    fetchSuppliers();
    fetchInvoices();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.suppliers.getAll();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await apiService.invoices.getAll();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      const result = await apiService.suppliers.delete(id);
      if (result.success) {
        fetchSuppliers();
        alert(t.deleteSuccess);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      contact_person: supplier.contact_person
    });
    setSelectedSupplier(supplier);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    setFormData({ name: '', phone: '', contact_person: '' });
    setSelectedSupplier(null);
    setShowAddModal(true);
  };

  const handlePrintReport = (supplier) => {
    setSelectedSupplier(supplier);
    setShowReportModal(true);
  };

  const handlePrintSupplierStatement = (supplier, dateRange) => {
    if (!supplier) return;

    const supplierInvoices = invoices.filter(inv => {
      if (inv.supplier_id != supplier.id) return false;
      
      const invoiceDate = new Date(inv.invoice_date || inv.date);
      const startDate = dateRange?.start_date ? new Date(dateRange.start_date) : null;
      const endDate = dateRange?.end_date ? new Date(dateRange.end_date) : null;
      
      return (!startDate || invoiceDate >= startDate) && (!endDate || invoiceDate <= endDate);
    });

    const totalAmount = supplierInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const totalPaid = supplierInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;
    const language = isRtl ? 'ar' : 'en';

    const reportContent = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${isRtl ? 'كشف حساب مورد' : 'Supplier Statement'} - ${supplier.name}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: ${isRtl ? 'right' : 'left'}; }
              th { background-color: #f2f2f2; }
              .summary { margin-top: 20px; display: flex; justify-content: flex-end; }
              .summary-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 5px; width: 300px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px; }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" alt="Logo" style="height: 100px; margin-bottom: 10px;" onerror="this.style.display='none';">
              <h2>${isRtl ? 'كشف حساب مورد' : 'Supplier Statement'}</h2>
              <h3>${supplier.name}</h3>
              <p>${t.from}: ${dateRange?.start_date || '-'} ${t.to}: ${dateRange?.end_date || '-'}</p>
              <p>${isRtl ? 'تاريخ التقرير' : 'Report Date'}: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
              <strong>${isRtl ? 'معلومات الاتصال:' : 'Contact Info:'}</strong><br>
              ${supplier.contact_person ? (isRtl ? 'الشخص المسؤول: ' : 'Contact Person: ') + supplier.contact_person + '<br>' : ''}
              ${supplier.phone ? (isRtl ? 'الهاتف: ' : 'Phone: ') + supplier.phone + '<br>' : ''}
          </div>

          <table>
              <thead>
                  <tr>
                      <th>${isRtl ? 'التاريخ' : 'Date'}</th>
                      <th>${isRtl ? 'رقم الفاتورة' : 'Invoice No'}</th>
                      <th>${isRtl ? 'المبلغ' : 'Amount'}</th>
                      <th>${isRtl ? 'المدفوع' : 'Paid'}</th>
                      <th>${isRtl ? 'المتبقي' : 'Remaining'}</th>
                      <th>${isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
              </thead>
              <tbody>
                  ${supplierInvoices.length > 0 ? supplierInvoices.map(inv => `
                      <tr>
                          <td>${inv.invoice_date || inv.date}</td>
                          <td>${inv.invoice_number}</td>
                          <td>$${parseFloat(inv.amount).toFixed(2)}</td>
                          <td>$${parseFloat(inv.paid_amount || 0).toFixed(2)}</td>
                          <td>$${(parseFloat(inv.amount) - parseFloat(inv.paid_amount || 0)).toFixed(2)}</td>
                          <td>${inv.status === 'paid' ? (isRtl ? 'مدفوع' : 'Paid') : inv.status === 'partial' ? (isRtl ? 'جزئي' : 'Partial') : (isRtl ? 'معلق' : 'Pending')}</td>
                      </tr>
                  `).join('') : `<tr><td colspan="6" style="text-align: center;">${isRtl ? 'لا توجد فواتير في هذه الفترة' : 'No invoices in this period'}</td></tr>`}
              </tbody>
          </table>

          <div class="summary">
              <div class="summary-box">
                  <div class="row">
                      <span>${isRtl ? 'إجمالي الفواتير:' : 'Total Invoices:'}</span>
                      <span>$${totalAmount.toFixed(2)}</span>
                  </div>
                  <div class="row">
                      <span>${isRtl ? 'إجمالي المدفوع:' : 'Total Paid:'}</span>
                      <span>$${totalPaid.toFixed(2)}</span>
                  </div>
                  <div class="row total">
                      <span>${isRtl ? 'المبلغ المستحق:' : 'Balance Due:'}</span>
                      <span style="color: #dc2626;">$${totalRemaining.toFixed(2)}</span>
                  </div>
              </div>
          </div>

          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (selectedSupplier) {
        result = await apiService.suppliers.update(formData);
      } else {
        result = await apiService.suppliers.create(formData);
      }
      
      if (result.success) {
        fetchSuppliers();
        setShowAddModal(false);
        setFormData({ name: '', phone: '', contact_person: '' });
        setSelectedSupplier(null);
        alert(selectedSupplier ? t.statusUpdated : t.supplierAdded);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert(t.connectionError);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.supplierManagement}</h2>
        <button 
          onClick={handleAdd}
          className="btn btn-primary"
        >
          + {t.addSupplier}
        </button>
      </div>

      {/* جدول الموردين */}
      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.name}
              </th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.contactPerson}
              </th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.phone}
              </th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{supplier.contact_person}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{supplier.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button className="action-btn edit" title={t.edit} onClick={() => handleEdit(supplier)}>✏️</button>
                    <button className="action-btn delete" title={t.delete} onClick={() => handleDelete(supplier.id)}>🗑️</button>
                                        <button 
                                          onClick={() => handlePrintReport(supplier)} 
                                          className="action-btn" 
                                          style={{backgroundColor: '#f1f5f9', color: '#475569'}}
                                          title={t.printReport || 'Print'}
                                        >
                                          🖨️
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                    
                          {/* نافذة الإضافة (Modal) */}
                          {showAddModal && (
                            <div className="modal-overlay">
                              <div className="modal">
                                <div className="modal-header">
                                  <h3 className="modal-title">{selectedSupplier ? t.edit : t.addSupplier}</h3>
                                  <button onClick={() => setShowAddModal(false)} className="modal-close">✕</button>
                                </div>
                                <div className="modal-body">
                                  <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                      <label className="form-label">{t.name}</label>
                                      <input 
                                        type="text" 
                                        placeholder={t.name} 
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label className="form-label">{t.contactPerson}</label>
                                      <input 
                                        type="text" 
                                        placeholder={t.contactPerson} 
                                        className="form-input"
                                        value={formData.contact_person}
                                        onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label className="form-label">{t.phone}</label>
                                      <input 
                                        type="text" 
                                        placeholder={t.phone} 
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                      />
                                    </div>
                                    <div className="form-actions">
                                      <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">{t.cancel}</button>
                                      <button type="submit" className="btn btn-primary">{t.save}</button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            </div>
                          )}
                    
                          <ReportDateRangeModal 
                            isOpen={showReportModal}
                            onClose={() => { setShowReportModal(false); setSelectedSupplier(null); }}
                            onConfirm={(range) => {
                              handlePrintSupplierStatement(selectedSupplier, range);
                              setShowReportModal(false);
                              setSelectedSupplier(null);
                            }}
                            t={t}
                            title={isRtl ? 'تقرير كشف حساب المورد' : 'Supplier Statement Report'}
                          />
                        </div>
                      );
                    };
                    
                    export default SupplierManagement;
                    