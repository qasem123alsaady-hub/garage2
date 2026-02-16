import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function CustomerModal({ isOpen, onClose, onSuccess, t, customer = null }) {
  const initialState = {
    name: '',
    phone: '',
    email: '',
    address: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (customer) {
      setFormData({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || ''
      });
    } else {
      setFormData(initialState);
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.name || !formData.phone) {
        alert(t.pleaseEnterNamePhone || 'الرجاء إدخال الاسم ورقم الهاتف');
        return;
      }

      let result;
      if (customer) {
        result = await apiService.customers.update(formData);
      } else {
        result = await apiService.customers.create(formData);
      }

      if (result.success) {
        onSuccess(result.customer);
        onClose();
        if (!customer) setFormData(initialState);
        
        let successMessage = `✅ ${customer ? t.customerUpdated : t.customerAdded}`;
        if (result.user_account) {
          successMessage += `\n✅ ${t.userAccountCreatedForCustomer}\n👤 ${t.username}: ${result.user_account.username}\n🔐 ${t.password}: ${result.user_account.password}`;
        }
        alert(successMessage);
      } else {
        if (result.message && (result.message.includes('موجود') || result.message.includes('مسجل'))) {
          alert(t.customerExists);
        } else {
          alert(`❌ ${t.error}: ` + (result.message || 'unknown error'));
        }
      }
    } catch (error) {
      console.error('❌ خطأ:', error);
      alert(t.connectionError);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{customer ? t.edit : t.addNewCustomer}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.name} *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.phone} *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.email}</label>
              <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.address}</label>
              <textarea className="form-textarea" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder={`${t.address} (${t.optional})`} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-secondary">{customer ? t.save : t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerModal;