import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function AdvanceModal({ isOpen, onClose, onSuccess, t, employees }) {
  const initialState = {
    employee_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.amount) {
      alert(t.fillAllFields || 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.employees.addAdvance(formData);
      if (result.success) {
        onSuccess();
        onClose();
        alert(t.addSuccess || 'Added successfully');
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding advance:', error);
      alert(t.connectionError || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.addEmployeeAdvance || 'إضافة سلفة موظف'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t.employee || 'الموظف'} *</label>
              <select
                required
                className="form-select"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              >
                <option value="">{t.selectEmployee || 'اختر الموظف'}</option>
                {employees.filter(e => e.status === 'active').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.amount || 'المبلغ'} *</label>
              <input
                type="number"
                required
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || ''})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.date || 'التاريخ'} *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.notes || 'ملاحظات'}</label>
              <textarea
                className="form-input"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>{t.cancel}</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{t.add || 'إضافة'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdvanceModal;