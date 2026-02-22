import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function PayrollModal({ isOpen, onClose, onSuccess, t }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payments, setPayments] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deductions, setDeductions] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchPayrollData();
    }
  }, [isOpen]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const data = await apiService.employees.getPayroll();
      if (Array.isArray(data)) {
        setEmployees(data);
        const initialPayments = {};
        const initialDeductions = {};
        const ids = new Set();
        
        data.forEach(emp => {
          // The 'account_balance' from backend is (Earned - Paid - Advances - Deductions)
          // So the Net for THIS month = (Monthly Salary) + (Previous Account Balance)
          const net = parseFloat(emp.salary) + parseFloat(emp.account_balance || 0);
          initialPayments[emp.id] = {
            amount: net,
            notes: 'Monthly Salary'
          };
          initialDeductions[emp.id] = 0;
          ids.add(emp.id);
        });
        
        setPayments(initialPayments);
        setDeductions(initialDeductions);
        setSelectedIds(ids);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)));
    }
  };

  const handleAmountChange = (id, value) => {
    setPayments({
      ...payments,
      [id]: { ...payments[id], amount: parseFloat(value) || 0 }
    });
  };

  const handleDeductionChange = (id, value) => {
    const val = parseFloat(value) || 0;
    setDeductions({
      ...deductions,
      [id]: val
    });
    
    // Auto-update net amount: Net = Salary + Account Balance - New Deduction
    const emp = employees.find(e => e.id === id);
    if (emp) {
      const net = parseFloat(emp.salary) + parseFloat(emp.account_balance || 0) - val;
      setPayments(prev => ({
        ...prev,
        [id]: { ...prev[id], amount: net }
      }));
    }
  };

  const handleNotesChange = (id, value) => {
    setPayments({
      ...payments,
      [id]: { ...payments[id], notes: value }
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      alert(t.noEmployeesSelected || 'Please select at least one employee');
      return;
    }

    if (!window.confirm(t.confirmPayrollApproval || 'Are you sure you want to approve payroll?')) return;

    setApproving(true);
    try {
      const selectedPayments = [];
      selectedIds.forEach(id => {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        // 1. Add FULL GROSS salary record (from employee fixed salary)
        selectedPayments.push({
          employee_id: id,
          amount: parseFloat(emp.salary), 
          payment_type: 'salary',
          notes: payments[id].notes || 'Monthly Salary (Gross)'
        });
        
        // 2. Add manual deduction if any
        if (deductions[id] > 0) {
          selectedPayments.push({
            employee_id: id,
            amount: deductions[id],
            payment_type: 'deduction',
            notes: 'Additional Deduction',
            status: 'paid' // Deductions are immediate
          });
        }
      });

      const payrollData = {
        payment_date: paymentDate,
        payments: selectedPayments
      };

      const result = await apiService.employees.approvePayroll(payrollData);
      if (result.success) {
        onSuccess();
        onClose();
        alert(t.payrollApproved || 'Payroll approved successfully');
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert(t.connectionError || 'Connection error');
    } finally {
      setApproving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{t.payrollApproval || 'اعتماد الرواتب'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body overflow-x-auto">
          <div className="mb-4 flex items-center gap-4">
            <label className="font-bold">{t.paymentDate || 'تاريخ الدفع'}:</label>
            <input 
              type="date" 
              className="form-input w-auto" 
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2 text-start">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === employees.length && employees.length > 0} 
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-2 text-start">{t.employee || 'الموظف'}</th>
                  <th className="p-2 text-start">{t.salary || 'الراتب'}</th>
                  <th className="p-2 text-start">{t.balance || 'رصيد سابق'}</th>
                  <th className="p-2 text-start">{t.deductions || 'خصومات إضافية'}</th>
                  <th className="p-2 text-start">{t.netPayable || 'صافي المستحق'}</th>
                  <th className="p-2 text-start">{t.notes || 'ملاحظات'}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className={`border-b hover:bg-gray-50 ${!selectedIds.has(emp.id) ? 'opacity-50' : ''}`}>
                    <td className="p-2">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(emp.id)} 
                        onChange={() => toggleSelect(emp.id)}
                      />
                    </td>
                    <td className="p-2 font-medium">{emp.name}</td>
                    <td className="p-2">${parseFloat(emp.salary).toLocaleString()}</td>
                    <td className={`p-2 ${parseFloat(emp.account_balance) < 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                      ${parseFloat(emp.account_balance || 0).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="form-input w-24" 
                        placeholder="0"
                        value={deductions[emp.id] || ''}
                        onChange={(e) => handleDeductionChange(emp.id, e.target.value)}
                        disabled={!selectedIds.has(emp.id)}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        className="form-input w-28 font-bold text-emerald-600" 
                        value={payments[emp.id]?.amount || 0}
                        onChange={(e) => handleAmountChange(emp.id, e.target.value)}
                        disabled={!selectedIds.has(emp.id)}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={t.notes || 'ملاحظات'}
                        value={payments[emp.id]?.notes || ''}
                        onChange={(e) => handleNotesChange(emp.id, e.target.value)}
                        disabled={!selectedIds.has(emp.id)}
                      />
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-500">{t.noData}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer p-4 border-t flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose} disabled={approving}>{t.cancel}</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={approving || employees.length === 0}
          >
            {approving ? '...' : (t.approve || 'اعتماد')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayrollModal;