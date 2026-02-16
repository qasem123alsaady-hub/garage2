import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const UserModal = ({ isOpen, onClose, onSuccess, t, user = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'technician',
    customer_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '', // Don't show password
        role: user.role || 'technician',
        customer_id: user.customer_id || ''
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'technician',
        customer_id: ''
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (user) {
        // Update existing user
        const updateData = { ...formData, id: user.id };
        if (!updateData.password) delete updateData.password; // Only update password if provided
        result = await apiService.users.update(updateData);
      } else {
        // Create new user
        if (!formData.password) {
          setError(t.passwordRequired || 'Password is required for new users');
          setLoading(false);
          return;
        }
        result = await apiService.users.create(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{user ? t.edit : t.add}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
            
            <div className="form-group">
              <label className="form-label">{t.name}</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.username}</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t.password} {user && `(${t.leaveBlankForNoChange || 'leave blank to keep current'})`}
              </label>
              <input 
                type="password" 
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!user}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.userRole}</label>
              <select 
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline"
                disabled={loading}
              >
                {t.cancel}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '...' : t.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
