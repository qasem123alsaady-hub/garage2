import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useDataFetch } from '../../hooks/useDataFetch';

const TechnicianManagement = ({ isOpen, onClose }) => {
  const { technicians, addItem, deleteItem } = useDataFetch();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'technician'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addItem('users', formData);
    if (success) {
      setFormData({ name: '', username: '', email: '', password: '', role: 'technician' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة الفنيين"
    >
      <div className="technician-management">
        <form onSubmit={handleSubmit} className="add-tech-form">
          <h3 style={{marginBottom: '15px', fontSize: '1.1rem'}}>إضافة فني جديد</h3>
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
            <label>البريد (اختياري)</label>
            <input
              type="email"
              placeholder="البريد"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
          <button type="submit" className="btn-submit" style={{width: '100%', marginBottom: '20px'}}>إضافة فني</button>
        </form>

        <div className="tech-list-section" style={{borderTop: '1px solid #eee', paddingTop: '20px'}}>
          <h3 style={{marginBottom: '15px', fontSize: '1.1rem'}}>قائمة الفنيين الحاليين</h3>
          <div className="tech-list" style={{maxHeight: '200px', overflowY: 'auto'}}>
            {technicians && technicians.length > 0 ? technicians.map(tech => (
              <div key={tech.id} className="tech-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px'}}>
                <div className="tech-info">
                  <span className="tech-name" style={{fontWeight: 'bold'}}>{tech.name}</span>
                  <span className="tech-user" style={{color: '#64748b', marginLeft: '10px'}}>@{tech.username}</span>
                </div>
                <button 
                  className="btn-delete-small" 
                  style={{border: 'none', background: 'none', cursor: 'pointer'}}
                  onClick={() => deleteItem('users', tech.id)}
                >
                  ❌
                </button>
              </div>
            )) : <p>لا يوجد فنيين حالياً</p>}
          </div>
        </div>

        <div className="modal-actions" style={{marginTop: '20px'}}>
          <button type="button" className="btn-cancel" style={{width: '100%'}} onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </Modal>
  );
};

export default TechnicianManagement;
