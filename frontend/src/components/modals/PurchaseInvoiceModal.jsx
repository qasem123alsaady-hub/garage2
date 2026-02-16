import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function PurchaseInvoiceModal({ isOpen, onClose, onSuccess, suppliers, t, invoice = null }) {
  const initialState = {
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    amount: 0,
    items_description: '',
    status: 'pending'
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (invoice) {
      setFormData({
        id: invoice.id,
        supplier_id: invoice.supplier_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        amount: invoice.amount,
        items_description: invoice.items_description || '',
        status: invoice.status
      });
    } else {
      setFormData(initialState);
    }
  }, [invoice, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (invoice) {
        result = await apiService.invoices.update(formData);
      } else {
        result = await apiService.invoices.create(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
        alert(`✅ ${t.purchaseInvoiceAdded}`);
      } else {
        alert(`❌ ${t.error}: ` + result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t.connectionError);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{invoice ? t.edit : t.addPurchaseInvoice}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.selectSupplier} *</label>
              <select required className="form-input" value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}>
                <option value="">{t.selectSupplier}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.invoiceNumber} *</label>
              <input type="text" required className="form-input" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.date} *</label>
              <input type="date" required className="form-input" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.amount} *</label>
              <input type="number" required className="form-input" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.description}</label>
              <textarea className="form-textarea" value={formData.items_description} onChange={(e) => setFormData({...formData, items_description: e.target.value})} placeholder={t.invoiceItemsPlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.status}</label>
              <select className="form-input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="pending">{t.paymentPending}</option>
                <option value="partial">{t.paymentPartial}</option>
                <option value="paid">{t.paymentPaid}</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-primary">{invoice ? t.save : t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PurchaseInvoiceModal;
