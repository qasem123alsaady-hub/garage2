import React from 'react';

const PaymentBadge = ({ status, t }) => {
  const styles = {
    'pending': 'bg-red-100 text-red-800',
    'partial': 'bg-orange-100 text-orange-800',
    'paid': 'bg-green-100 text-green-800'
  };

  const labels = {
    'pending': t.paymentPending,
    'partial': t.paymentPartial,
    'paid': t.paymentPaid
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

export default PaymentBadge;
