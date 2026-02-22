import React, { useState } from 'react';
import apiService from '../../services/api';

function EmployeeStatementModal({ isOpen, onClose, onPrint, t, employee, isRtl = true }) {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !employee) return null;

  const handlePrint = (data) => {
    const { employee, dateRange, payments } = data;
    const language = isRtl ? 'ar' : 'en';
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const content = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${t.employeeStatement || (isRtl ? 'كشف حساب موظف' : 'Employee Statement')} - ${employee.name}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: 800; color: #3b82f6; }
              .title { font-size: 28px; font-weight: bold; text-transform: uppercase; }
              
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
              .info-box { background: #f3f4f6; padding: 20px; border-radius: 12px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .label { font-weight: bold; color: #4b5563; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background: #3b82f6; color: white; padding: 15px; text-align: ${language === 'ar' ? 'right' : 'left'}; }
              td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
              tr:nth-child(even) { background-color: #f9fafb; }
              
              .total-section { margin-top: 40px; text-align: ${language === 'ar' ? 'left' : 'right'}; }
              .total-box { display: inline-block; background: #1f2937; color: white; padding: 15px 40px; border-radius: 8px; font-size: 20px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              
              @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="logo">
                  <img src="${t.logo}" alt="Logo" style="height: 80px; vertical-align: middle; margin-${language === 'ar' ? 'left' : 'right'}: 15px;" onerror="this.style.display='none';">
                  ${t.appName || 'Car Garage'}
              </div>
              <div class="title">${t.employeeStatement || (isRtl ? 'كشف حساب موظف' : 'Employee Statement')}</div>
          </div>

          <div class="info-grid">
              <div class="info-box">
                  <div class="info-row"><span class="label">${t.employee || (isRtl ? 'الموظف' : 'Employee')}:</span> <span>${employee.name}</span></div>
                  <div class="info-row"><span class="label">${t.phone || (isRtl ? 'الهاتف' : 'Phone')}:</span> <span>${employee.phone || '-'}</span></div>
              </div>
              <div class="info-box">
                  <div class="info-row"><span class="label">${t.fromDate || (isRtl ? 'من تاريخ' : 'From Date')}:</span> <span>${dateRange.start_date}</span></div>
                  <div class="info-row"><span class="label">${t.toDate || (isRtl ? 'إلى تاريخ' : 'To Date')}:</span> <span>${dateRange.end_date}</span></div>
              </div>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>${t.date || (isRtl ? 'التاريخ' : 'Date')}</th>
                      <th>${t.description || (isRtl ? 'الوصف' : 'Description')}</th>
                      <th>${t.amount || (isRtl ? 'المبلغ' : 'Amount')}</th>
                  </tr>
              </thead>
              <tbody>
                  ${payments.length > 0 ? payments.map(p => `
                      <tr>
                          <td>${p.payment_date}</td>
                          <td>${p.notes || p.type || '-'}</td>
                          <td>${parseFloat(p.amount).toFixed(2)}</td>
                      </tr>
                  `).join('') : `<tr><td colspan="3" style="text-align:center; padding: 20px;">${t.noData || (isRtl ? 'لا توجد بيانات' : 'No Data')}</td></tr>`}
              </tbody>
          </table>

          <div class="total-section">
              <div class="total-box">
                  ${t.total || (isRtl ? 'المجموع' : 'Total')}: ${totalAmount.toFixed(2)}
              </div>
          </div>

          <script>
              window.onload = function() { window.print(); }
          </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Fetch all payments for this employee
      const allPayments = await apiService.employees.getEmployeePayments();
      
      // Filter by employee ID and date range (include both paid and pending)
      const filtered = allPayments.filter(p => 
        p.employee_id == employee.id && 
        p.payment_date >= dateRange.start_date &&
        p.payment_date <= dateRange.end_date
      );

      handlePrint({
        employee,
        dateRange,
        payments: filtered
      });
      onClose();
    } catch (error) {
      console.error("Error fetching employee statement:", error);
      alert(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.employeeStatement || (isRtl ? 'كشف حساب موظف' : 'Employee Statement')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="mb-4 font-bold">{employee.name}</p>
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
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>{t.cancel}</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? '...' : (t.generateReport || (isRtl ? 'عرض الكشف' : 'Generate Report'))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeStatementModal;