import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

const Header = ({ onAction }) => {
  const { currentUser, logout } = useAuth();
  const { t, language, toggleLanguage } = useTranslation();

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="header">
      <div className="container">
        <div className="header-content" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0'}}>
          <div className="logo" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div className="logo-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '10px', borderRadius: '12px', fontSize: '1.5rem'}}>🚗</div>
            <div className="logo-text">
              <h1 style={{fontSize: '1.4rem', fontWeight: '800', margin: 0}}>GaragePro Manager</h1>
              <p style={{fontSize: '0.75rem', color: '#64748b', margin: 0}}>نظام إدارة مرآب السيارات المتكامل</p>
            </div>
          </div>

          <div className="header-right" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div className="user-info" style={{textAlign: 'right'}}>
              <div style={{fontSize: '0.8rem', color: '#64748b'}}>مرحباً،</div>
              <div style={{fontWeight: '700'}}>{currentUser?.name || 'مدير النظام'}</div>
              <span style={{fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#3b82f6'}}>{currentUser?.role === 'admin' ? 'مدير' : 'فني'}</span>
            </div>
            <button className="btn-lang" onClick={toggleLanguage} style={{padding: '8px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600'}}>
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>

        <div className="nav-bar" style={{marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px'}}>
          <div className="nav-buttons" style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
            <button className="nav-btn" onClick={() => onAction('addCustomer')} style={{background: '#334155'}}>➕ عميل جديد</button>
            <button className="nav-btn" onClick={() => onAction('addVehicle')} style={{background: '#2563eb'}}>مركبة جديدة</button>
            
            {isAdmin && (
              <>
                <button className="nav-btn" onClick={() => onAction('manageAccounts')} style={{background: '#f59e0b'}}>👥 إدارة الحسابات</button>
                <button className="nav-btn" onClick={() => onAction('addTechnician')} style={{background: '#0891b2'}}>👷 فني جديد</button>
              </>
            )}

            <button className="nav-btn" onClick={() => onAction('addService')} style={{background: '#10b981'}}>➕ خدمة جديدة</button>

            {isAdmin && (
              <button className="nav-btn" onClick={() => onAction('revenueReport')} style={{background: '#8b5cf6'}}>💰 تقرير الإيرادات</button>
            )}

            <button className="nav-btn" onClick={logout} style={{background: '#ef4444'}}>🚪 تسجيل الخروج</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
