import React, { useState } from 'react';

const ReportDateRangeModal = ({ isOpen, onClose, onConfirm, t, title }) => {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title || t.printReport}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-gray-500 mb-4">{t.dateRange}</p>
          <div className="grid grid-cols-1 gap-4">
            <div className="form-group">
              <label className="form-label">{t.fromDate}</label>
              <input 
                type="date" 
                className="form-input"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.toDate}</label>
              <input 
                type="date" 
                className="form-input"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button onClick={onClose} className="btn btn-outline">{t.cancel}</button>
          <button 
            onClick={() => onConfirm(dateRange)} 
            className="btn btn-primary"
          >
            {t.printReport}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDateRangeModal;
