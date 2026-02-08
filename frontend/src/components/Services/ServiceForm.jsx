import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import { useDataFetch } from '../../hooks/useDataFetch';

const ServiceForm = ({ 
  isOpen, 
  onClose, 
  service, 
  vehicles, 
  onSubmit 
}) => {
  const { t } = useTranslation();
  const { technicians } = useDataFetch();
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: '',
    description: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'pending',
    payment_status: 'pending'
  });

  const serviceTypes = [
    { value: 'oilChange', label: 'تغيير زيت' },
    { value: 'brakeService', label: 'صيانة فرامل' },
    { value: 'tireRotation', label: 'تبديل إطارات' },
    { value: 'engineRepair', label: 'إصلاح محرك' },
    { value: 'other', label: 'أخرى' }
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        vehicle_id: service.vehicle_id || '',
        type: service.type || '',
        description: service.description || '',
        technician: service.technician || '',
        date: service.date || new Date().toISOString().split('T')[0],
        cost: service.cost || 0,
        status: service.status || 'pending',
        payment_status: service.payment_status || 'pending'
      });
    } else {
      setFormData({
        vehicle_id: '',
        type: '',
        description: '',
        technician: '',
        date: new Date().toISOString().split('T')[0],
        cost: 0,
        status: 'pending',
        payment_status: 'pending'
      });
    }
  }, [service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'تعديل خدمة' : 'إضافة خدمة جديدة'}
    >
      <div className="service-form-modal">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اختر مركبة *</label>
            <select
              required
              className="form-input"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
            >
              <option value="">اختر مركبة</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>نوع الخدمة *</label>
            <select
              required
              className="form-input"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="">اختر نوع الخدمة</option>
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>الوصف *</label>
            <textarea
              required
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="وصف الخدمة..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>الفني المسئول *</label>
            <select
              required
              className="form-input"
              value={formData.technician}
              onChange={(e) => setFormData({...formData, technician: e.target.value})}
            >
              <option value="">اختر فني</option>
              {technicians && technicians.map(tech => (
                <option key={tech.id} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>التكلفة *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="form-input"
              value={formData.cost}
              onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn-submit">
              {service ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ServiceForm;
