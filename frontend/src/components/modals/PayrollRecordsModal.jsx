import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function PayrollRecordsModal({ isOpen, onClose, t, onPrint }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await apiService.employees.getEmployeePayments();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (payment) => {
    if (!window.confirm(t.confirmPayment || 'Confirm this payment?')) return;
    
    try {
      const result = await apiService.employees.confirmEmployeePayment(payment.id);
      if (result.success) {
        fetchRecords();
        // Trigger print
        onPrint({ ...payment, status: 'paid' });
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert(t.connectionError);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete || 'Are you sure you want to delete this record?')) return;
    
    try {
      const result = await apiService.employees.deleteEmployeePayment(id);
      if (result.success) {
        fetchRecords();
        alert(t.deleteSuccess);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(t.connectionError);
    }
  };

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1000px', width: '95%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{t.payrollRecords || 'سجل الرواتب والمدفوعات'}</h3>
          <div className="flex gap-2 mr-8">
            <select 
              className="form-select py-1" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t.all || 'الكل'}</option>
              <option value="pending">{t.pendingStatus || 'قيد الانتظار'}</option>
              <option value="paid">{t.paidStatus || 'مدفوع'}</option>
            </select>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body overflow-x-auto">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2 text-start">{t.date}</th>
                  <th className="p-2 text-start">{t.employee}</th>
                  <th className="p-2 text-start">{t.paymentType || 'النوع'}</th>
                  <th className="p-2 text-start">{t.amount}</th>
                  <th className="p-2 text-start">{t.status}</th>
                  <th className="p-2 text-start">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 whitespace-nowrap">{rec.payment_date}</td>
                    <td className="p-2">
                      <div className="font-medium">{rec.employee_name}</div>
                      <div className="text-xs text-gray-500">{rec.employee_position}</div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.payment_type === 'salary' ? 'bg-blue-100 text-blue-800' :
                        rec.payment_type === 'advance' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rec.payment_type === 'salary' ? t.salary : 
                         rec.payment_type === 'advance' ? t.addEmployeeAdvance : 
                         rec.payment_type === 'deduction' ? t.deductions : rec.payment_type}
                      </span>
                    </td>
                    <td className="p-2 font-bold">${parseFloat(rec.amount).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`status-badge ${rec.status === 'paid' ? 'status-completed' : 'status-pending'}`}>
                        {t[rec.status] || rec.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {rec.status === 'pending' && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => handleConfirm(rec)}
                            title={t.confirmPayment || 'Confirm'}
                          >
                            ✅
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={() => onPrint(rec)}
                          title={t.printReceipt || 'Print'}
                        >
                          🖨️
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleDelete(rec.id)}
                          title={t.delete || 'Delete'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">{t.noData}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer p-4 border-t flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  );
}

export default PayrollRecordsModal;