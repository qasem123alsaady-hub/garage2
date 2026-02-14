import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const CustomerForm = ({ isOpen, onClose, customer, onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? (t('editCustomer') || 'تعديل عميل') : (t('addNewCustomer') || 'إضافة عميل جديد')}
    >
      <div className="customer-form-modal">
        <style>{`
          @media (max-width: 768px) {
            .form-group {
              margin-bottom: 15px;
            }
            .form-input, .form-textarea, select.form-input {
              width: 100%;
              box-sizing: border-box;
            }
            .modal-actions {
              flex-direction: column-reverse;
              gap: 10px;
            }
            .btn-submit, .btn-cancel {
              width: 100%;
              margin: 0;
            }
          }
        `}</style>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>الاسم *</label>
            <input
              type="text"
              required
              placeholder="الاسم"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>الهاتف *</label>
            <input
              type="text"
              required
              placeholder="الهاتف"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>البريد</label>
            <input
              type="email"
              placeholder="البريد"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>العنوان</label>
            <textarea
              className="form-textarea"
              placeholder="العنوان (اختياري)"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn-submit">
              {customer ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CustomerForm;
