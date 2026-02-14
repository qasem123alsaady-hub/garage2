import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const Loading = ({ 
  type = 'spinner', 
  message,
  size = 'medium',
  fullScreen = false 
}) => {
  const { t } = useTranslation();
  
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };
  
  const loadingMessage = message || t('loading');
  
  if (type === 'spinner') {
    return (
      <div className={`loading-container ${fullScreen ? 'full-screen' : ''}`}>
        <div className={`loading-spinner ${sizeClasses[size]}`}>
          <div className="spinner"></div>
        </div>
        {loadingMessage && <p className="loading-message">{loadingMessage}</p>}
      </div>
    );
  }
  
  if (type === 'dots') {
    return (
      <div className={`loading-container ${fullScreen ? 'full-screen' : ''}`}>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        {loadingMessage && <p className="loading-message">{loadingMessage}</p>}
      </div>
    );
  }
  
  // Skeleton loading
  return (
    <div className={`skeleton-loading ${fullScreen ? 'full-screen' : ''}`}>
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-row"></div>
        ))}
      </div>
    </div>
  );
};

export const LoadingSpinner = () => <Loading type="spinner" />;
export const LoadingDots = () => <Loading type="dots" />;
export const LoadingSkeleton = () => <Loading type="skeleton" />;

export default Loading;
