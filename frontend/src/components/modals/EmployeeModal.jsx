import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function EmployeeModal({ isOpen, onClose, onSuccess, t, employee = null }) {
  const initialState = {
    name: '',
    position: '',
    phone: '',
    salary: 0,
    status: 'active'
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        id: employee.id,
        name: employee.name,
        position: employee.position,
        phone: employee.phone,
        salary: employee.salary,
        status: employee.status
      });
    } else {
      setFormData(initialState);
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let result;
      if (employee) {
        result = await apiService.employees.update(formData);
      } else {
        result = await apiService.employees.create(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
        alert(`✅ ${employee ? t.statusUpdated : t.addSuccess}`);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ خطأ:', error);
      alert(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{employee ? t.edit : t.addEmployee}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
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
              <label className="form-label">{t.position || 'المسمى الوظيفي'} *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
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
              <label className="form-label">{t.salary} *</label>
              <input
                type="number"
                required
                className="form-input"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.status}</label>
              <select 
                className="form-select" 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">{t.active || 'نشط'}</option>
                <option value="inactive">{t.inactive || 'غير نشط'}</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>{t.cancel}</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{employee ? t.save : t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;