import React, { useState } from 'react';

function RevenueReportModal({ isOpen, onClose, customers, vehicles, services, t, language }) {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: new Date().toISOString().split('T')[0] });

  if (!isOpen) return null;

  // Logic to calculate revenues (simplified for brevity, full logic from app.jsx should be here)
  const getPaidRevenues = () => {
    // ... logic to filter services by date and sum amount_paid
    // For this example, we'll just return a placeholder or basic calculation
    return services.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0);
  };

  const totalPaid = getPaidRevenues();

  const handlePrint = () => {
    // Print logic
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal report-modal" style={{maxWidth: '800px', maxHeight: '95vh', width: '95%'}}>
        <div className="modal-header">
          <h3 className="modal-title">💰 {t.revenueReport}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body-scrollable" style={{padding: '20px', overflowY: 'auto', maxHeight: '80vh'}}>
          <div style={{marginBottom: '20px'}}>
            <h4>📅 {t.dateRange}</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <input type="date" className="form-input" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} />
              <input type="date" className="form-input" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} />
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px'}}>
            <div style={{background: '#f0fdf4', padding: '16px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{color: '#166534'}}>{t.paidRevenue}</div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: '#16a34a'}}>${totalPaid.toFixed(2)}</div>
            </div>
            {/* Add other stats */}
          </div>

          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>{t.close}</button>
            <button className="btn btn-purple" onClick={handlePrint}>🖨️ {t.printReport}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueReportModal;