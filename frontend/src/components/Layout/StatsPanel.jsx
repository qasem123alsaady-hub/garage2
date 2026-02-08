import React from 'react';
import { useDataFetch } from '../../hooks/useDataFetch';
import { useTranslation } from '../../hooks/useTranslation';

const StatsPanel = () => {
  const { t } = useTranslation();
  const { vehicles, customers, services } = useDataFetch();

  const stats = {
    totalVehicles: vehicles.length,
    inService: vehicles.filter(v => v.status === 'in-service').length,
    completed: vehicles.filter(v => v.status === 'completed').length,
    totalCustomers: customers.length,
    paidRevenue: services.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
    pendingRevenue: services.reduce((sum, s) => sum + (parseFloat(s.cost || 0) - parseFloat(s.amount_paid || 0)), 0),
    totalRevenue: services.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0)
  };

  const statCards = [
    { label: t('totalVehicles') || 'إجمالي المركبات', value: stats.totalVehicles, icon: '🚗', color: '#3b82f6' },
    { label: t('inService') || 'قيد الخدمة', value: stats.inService, icon: '🔧', color: '#f59e0b' },
    { label: t('completed') || 'مكتمل', value: stats.completed, icon: '✅', color: '#10b981' },
    { label: t('totalCustomers') || 'إجمالي العملاء', value: stats.totalCustomers, icon: '👥', color: '#6366f1' },
    { label: t('paidRevenue') || 'الإيرادات المدفوعة', value: `$${stats.paidRevenue.toFixed(2)}`, icon: '💰', color: '#059669' },
    { label: t('pendingRevenue') || 'الإيرادات المعلقة', value: `$${stats.pendingRevenue.toFixed(2)}`, icon: '⏳', color: '#dc2626' },
    { label: t('totalRevenue') || 'إجمالي الإيرادات', value: `$${stats.totalRevenue.toFixed(2)}`, icon: '📈', color: '#8b5cf6' }
  ];

  return (
    <div className="stats-grid">
      {statCards.map((card, index) => (
        <div key={index} className="stat-card" style={{ borderTop: `4px solid ${card.color}` }}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
