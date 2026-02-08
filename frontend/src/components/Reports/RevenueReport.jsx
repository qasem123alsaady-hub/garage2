import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { useTranslation } from '../../hooks/useTranslation';
import { useDataFetch } from '../../hooks/useDataFetch';

const RevenueReport = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { customers, vehicles, services } = useDataFetch();
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const setQuickRange = (range) => {
    const end = new Date();
    let start = new Date();
    
    switch(range) {
      case 'week': start.setDate(end.getDate() - 7); break;
      case 'month': start.setMonth(end.getMonth() - 1); break;
      case 'year': start.setFullYear(end.getFullYear() - 1); break;
      case 'all': start = new Date('2000-01-01'); break;
      default: break;
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const filteredServices = services.filter(s => {
    if (!dateRange.startDate) return true;
    const sDate = new Date(s.date);
    return sDate >= new Date(dateRange.startDate) && sDate <= new Date(dateRange.endDate);
  });

  const stats = {
    total: filteredServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0),
    paid: filteredServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
    pending: filteredServices.reduce((sum, s) => sum + (parseFloat(s.cost || 0) - parseFloat(s.amount_paid || 0)), 0)
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('revenueReport')} size="large">
      <div className="revenue-report-modal">
        <div className="report-filter-section">
          <h4>تحديد الفترة الزمنية للتقرير</h4>
          <div className="date-inputs">
            <div className="input-group">
              <label>من تاريخ</label>
              <input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>إلى تاريخ</label>
              <input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="quick-ranges">
            <button onClick={() => setQuickRange('all')}>الكل</button>
            <button onClick={() => setQuickRange('week')}>أسبوع</button>
            <button onClick={() => setQuickRange('month')}>شهر</button>
            <button onClick={() => setQuickRange('year')}>سنة</button>
          </div>
        </div>

        <div className="report-summary-grid">
          <div className="summary-item paid">
            <div className="summary-label">الإيرادات المدفوعة</div>
            <div className="summary-value">${stats.paid.toFixed(2)}</div>
          </div>
          <div className="summary-item pending">
            <div className="summary-label">الإيرادات المعلقة</div>
            <div className="summary-value">${stats.pending.toFixed(2)}</div>
          </div>
          <div className="summary-item total">
            <div className="summary-label">إجمالي الإيرادات</div>
            <div className="summary-value">${stats.total.toFixed(2)}</div>
          </div>
        </div>

        <div className="report-actions">
          <button className="btn-close" onClick={onClose}>{t('close')}</button>
          <button className="btn-print" onClick={handlePrint}>🖨️ {t('printReport')}</button>
        </div>
      </div>
    </Modal>
  );
};

export default RevenueReport;
