import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';

const ResetPassword = ({ 
  isOpen, 
  onClose, 
  user,
  onSubmit 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    onSubmit(formData.newPassword);
    setFormData({ newPassword: '', confirmPassword: '' });
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('resetPassword')}
    >
      <div className="reset-password">
        <div className="user-info">
          <h4>{user.name}</h4>
          <p>{t('username')}: {user.username}</p>
          <p>{t('role')}: {user.role}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">{t('newPassword')} *</label>
            <input
              type="password"
              required
              className="form-input"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              placeholder={t('enterNewPassword')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('confirmPassword')} *</label>
            <input
              type="password"
              required
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder={t('confirmNewPassword')}
            />
          </div>

          <div className="password-requirements">
            <p><strong>{t('passwordRequirements')}:</strong></p>
            <ul>
              <li>{t('atLeast6Characters')}</li>
              <li>{t('recommendMixOfLettersAndNumbers')}</li>
            </ul>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              🔐 {t('resetPassword')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ResetPassword;
