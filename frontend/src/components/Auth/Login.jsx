import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await login(credentials.username, credentials.password);
      if (success) {
        navigate('/');
      } else {
        setError(t('invalidCredentials') || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError(t('loginError') || 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  return (
    <div className="login-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t('appName')}</h1>
          <p className="login-subtitle">{t('appSubtitle')}</p>
          <div className="login-logo">🚗</div>
        </div>
        
        <div className="login-body">
          <h2>{t('login')}</h2>
          <p className="login-hint">{t('loginToContinue')}</p>
          
          <div className="demo-info">
            <p>بيانات تجريبية:</p>
            <p>admin / admin123 (مدير)</p>
            <p>user / user123 (مستخدم)</p>
            <p>tech / tech123 (فني)</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('username')}</label>
              <input
                type="text"
                required
                className="form-input"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder={t('username')}
              />
            </div>
            
            <div className="form-group">
              <label>{t('password')}</label>
              <input
                type="password"
                required
                className="form-input"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder={t('password')}
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-login">
              {t('login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
