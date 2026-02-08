import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useDataFetch } from '../../hooks/useDataFetch';

const UserManagement = ({ isOpen, onClose }) => {
  const { users, addItem, deleteItem } = useDataFetch();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addItem('users', formData);
    if (success) {
      setFormData({ name: '', username: '', email: '', password: '', role: 'admin' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة الحسابات"
    >
      <div className="user-management">
        <form onSubmit={handleSubmit} className="add-user-form">
          <h3 style={{marginBottom: '15px', fontSize: '1.1rem'}}>إضافة مستخدم جديد</h3>
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
            <label>اسم المستخدم *</label>
            <input
              type="text"
              required
              placeholder="اسم المستخدم"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>كلمة المرور *</label>
            <input
              type="password"
              required
              placeholder="كلمة المرور"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>الصلاحية</label>
            <select 
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="admin">مدير (Admin)</option>
              <option value="technician">فني (Technician)</option>
            </select>
          </div>
          <button type="submit" className="btn-submit" style={{width: '100%', marginBottom: '20px'}}>إضافة مستخدم</button>
        </form>

        <div className="user-list-section" style={{borderTop: '1px solid #eee', paddingTop: '20px'}}>
          <h3 style={{marginBottom: '15px', fontSize: '1.1rem'}}>قائمة المستخدمين الحاليين</h3>
          <div className="user-list" style={{maxHeight: '200px', overflowY: 'auto'}}>
            {users && users.length > 0 ? users.map(user => (
              <div key={user.id} className="user-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px'}}>
                <div className="user-info">
                  <span className="user-name" style={{fontWeight: 'bold'}}>{user.name}</span>
                  <span className="user-role" style={{color: '#64748b', marginLeft: '10px'}}>({user.role})</span>
                </div>
                <button 
                  className="btn-delete-small" 
                  style={{border: 'none', background: 'none', cursor: 'pointer'}}
                  onClick={() => deleteItem('users', user.id)}
                >
                  ❌
                </button>
              </div>
            )) : <p>لا يوجد مستخدمين حالياً</p>}
          </div>
        </div>

        <div className="modal-actions" style={{marginTop: '20px'}}>
          <button type="button" className="btn-cancel" style={{width: '100%'}} onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </Modal>
  );
};

export default UserManagement;
