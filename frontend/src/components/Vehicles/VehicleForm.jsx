import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleForm = ({ isOpen, onClose, vehicle, customers, onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'pending',
    customer_id: ''
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        license_plate: vehicle.license_plate || '',
        status: vehicle.status || 'pending',
        customer_id: vehicle.customer_id || ''
      });
    } else {
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        status: 'pending',
        customer_id: ''
      });
    }
  }, [vehicle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? (t('editVehicle') || 'تعديل مركبة') : (t('addNewVehicle') || 'إضافة مركبة جديدة')}
    >
      <div className="vehicle-form-modal">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>الماركة *</label>
            <input
              type="text"
              required
              placeholder="الماركة"
              className="form-input"
              value={formData.make}
              onChange={(e) => setFormData({...formData, make: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>الموديل *</label>
            <input
              type="text"
              required
              placeholder="الموديل"
              className="form-input"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>سنة</label>
            <input
              type="number"
              className="form-input"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div className="form-group">
            <label>اللوحة *</label>
            <input
              type="text"
              required
              placeholder="اللوحة"
              className="form-input"
              value={formData.license_plate}
              onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>اختر عميل *</label>
            <select
              required
              className="form-input"
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
            >
              <option value="">اختر عميل</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>الحالة</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="pending">قيد الانتظار</option>
              <option value="in-service">قيد الخدمة</option>
              <option value="completed">مكتمل</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn-submit">
              {vehicle ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default VehicleForm;
