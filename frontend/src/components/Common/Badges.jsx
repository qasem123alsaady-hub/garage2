import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export const StatusBadge = ({ status, size = 'normal' }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    'in-service': { 
      class: 'status-in-service', 
      label: t('statusInService'),
      icon: '🔧'
    },
    'completed': { 
      class: 'status-completed', 
      label: t('statusCompleted'),
      icon: '✅'
    },
    'pending': { 
      class: 'status-pending', 
      label: t('statusPending'),
      icon: '⏳'
    },
    'in-progress': { 
      class: 'status-in-progress', 
      label: t('statusInProgress'),
      icon: '⚡'
    }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClass = size === 'small' ? 'badge-sm' : '';
  
  return (
    <span className={`badge status-badge ${config.class} ${sizeClass}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
};

export const PaymentBadge = ({ status, size = 'normal' }) => {
  const { t } = useTranslation();
  
  const paymentConfig = {
    'paid': { 
      class: 'payment-paid', 
      label: t('paymentPaid'),
      icon: '💰'
    },
    'pending': { 
      class: 'payment-pending', 
      label: t('paymentPending'),
      icon: '⌛'
    },
    'partial': { 
      class: 'payment-partial', 
      label: t('paymentPartial'),
      icon: '💳'
    }
  };
  
  const config = paymentConfig[status] || paymentConfig.pending;
  const sizeClass = size === 'small' ? 'badge-sm' : '';
  
  return (
    <span className={`badge payment-badge ${config.class} ${sizeClass}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
};

export const RoleBadge = ({ role, size = 'normal' }) => {
  const { t } = useTranslation();
  
  const roleConfig = {
    'admin': { 
      class: 'role-admin', 
      label: t('admin'),
      icon: '👑'
    },
    'technician': { 
      class: 'role-technician', 
      label: t('technician'),
      icon: '🔧'
    },
    'user': { 
      class: 'role-user', 
      label: t('user'),
      icon: '👤'
    },
    'customer': { 
      class: 'role-customer', 
      label: t('customer'),
      icon: '👥'
    }
  };
  
  const config = roleConfig[role] || roleConfig.user;
  const sizeClass = size === 'small' ? 'badge-sm' : '';
  
  return (
    <span className={`badge role-badge ${config.class} ${sizeClass}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
};

export const PriorityBadge = ({ priority, size = 'normal' }) => {
  const { t } = useTranslation();
  
  const priorityConfig = {
    'high': { 
      class: 'priority-high', 
      label: t('highPriority'),
      icon: '🔴'
    },
    'medium': { 
      class: 'priority-medium', 
      label: t('mediumPriority'),
      icon: '🟡'
    },
    'low': { 
      class: 'priority-low', 
      label: t('lowPriority'),
      icon: '🟢'
    }
  };
  
  const config = priorityConfig[priority] || priorityConfig.medium;
  const sizeClass = size === 'small' ? 'badge-sm' : '';
  
  return (
    <span className={`badge priority-badge ${config.class} ${sizeClass}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
};
