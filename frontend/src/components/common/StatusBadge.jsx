import React from 'react';

const StatusBadge = ({ status, t }) => {
  const styles = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'in-service': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  const labels = {
    'pending': t.statusPending,
    'in-service': t.statusInService,
    'in-progress': t.statusInProgress,
    'completed': t.statusCompleted,
    'cancelled': t.statusCancelled
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
