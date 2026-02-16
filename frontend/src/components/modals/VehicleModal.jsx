import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function VehicleModal({ isOpen, onClose, onSuccess, customers, t, vehicle = null }) {
  const initialState = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'pending',
    customer_id: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        status: vehicle.status,
        customer_id: vehicle.customer_id
      });
    } else {
      setFormData(initialState);
    }
  }, [vehicle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.make || !formData.model || !formData.license_plate || !formData.customer_id) {
        alert(t.pleaseEnterRequiredFields || 'الرجاء إدخال جميع البيانات المطلوبة');
        return;
      }

      let result;
      if (vehicle) {
        result = await apiService.vehicles.update(formData);
      } else {
        result = await apiService.vehicles.create(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
        if (!vehicle) setFormData(initialState);
        alert(`✅ ${vehicle ? t.vehicleUpdated : t.vehicleAdded}`);
      } else {
        if (result.message && result.message.includes('موجود')) {
          alert(t.vehicleExists);
        } else {
          alert(`❌ ${t.error}: ` + result.message);
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
          <h3 className="modal-title">{vehicle ? t.edit : t.addNewVehicle}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.make} *</label>
              <input type="text" required className="form-input" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} placeholder={t.make} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.model} *</label>
              <input type="text" required className="form-input" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} placeholder={t.model} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.year}</label>
              <input type="number" className="form-input" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} min="1990" max={new Date().getFullYear() + 1} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.licensePlate} *</label>
              <input type="text" required className="form-input" value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value})} placeholder={t.licensePlate} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.selectCustomer} *</label>
              <select required className="form-input" value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})}>
                <option value="">{t.selectCustomer}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.status}</label>
              <select className="form-input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="pending">{t.statusPending}</option>
                <option value="in-service">{t.statusInService}</option>
                <option value="completed">{t.statusCompleted}</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-primary">{vehicle ? t.save : t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VehicleModal;
