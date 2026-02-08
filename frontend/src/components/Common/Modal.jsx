import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from '../../hooks/useTranslation';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true 
}) => {
  const { language } = useTranslation();

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    xlarge: 'modal-xlarge'
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
