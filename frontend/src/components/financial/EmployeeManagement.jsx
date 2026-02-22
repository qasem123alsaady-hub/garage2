import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import EmployeeModal from '../modals/EmployeeModal';
import AdvanceModal from '../modals/AdvanceModal';
import PayrollModal from '../modals/PayrollModal';
import PayrollRecordsModal from '../modals/PayrollRecordsModal';
import EmployeeStatementModal from '../modals/EmployeeStatementModal';

const EmployeeManagement = ({ t, isRtl, setPrintData }) => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiService.employees.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      const result = await apiService.employees.delete(id);
      if (result.success) {
        fetchEmployees();
        alert(t.deleteSuccess);
      } else {
        alert(`❌ ${t.error}: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handlePrintPayment = (payment) => {
    setPrintData({ type: 'employee_payment', data: payment });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintStatement = (employee) => {
    setSelectedEmployee(employee);
    setShowStatementModal(true);
  };

  const executePrintStatement = (data) => {
    setPrintData({ type: 'employee_statement', data });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t.employeeManagement}</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowRecordsModal(true)}>
            📋 {t.payrollRecords || 'سجل الرواتب'}
          </button>
          <button className="btn btn-info" onClick={() => setShowPayrollModal(true)}>
            💰 {t.payrollApproval || 'اعتماد الرواتب'}
          </button>
          <button className="btn btn-warning" onClick={() => setShowAdvanceModal(true)}>
            💸 {t.addEmployeeAdvance || 'إضافة سلفة'}
          </button>
          <button className="btn btn-success" onClick={handleAdd}>
            + {t.addEmployee}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="stat-card" style={{opacity: 1, transform: 'none', animation: 'none', textAlign: 'start'}}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900">{emp.name}</h3>
                <p className="text-blue-600 font-medium">{emp.position}</p>
              </div>
              <span className={`status-badge ${emp.status === 'active' ? 'status-completed' : 'status-in-service'}`}>
                {t[emp.status] || emp.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.phone}</span>
                <span className="font-semibold">{emp.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.salary}</span>
                <span className="font-bold text-emerald-600">${emp.salary}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.hireDate}</span>
                <span className="font-semibold">{emp.hire_date || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button className="action-btn edit" style={{backgroundColor: '#f0f9ff', color: '#0369a1'}} title={t.printReport} onClick={() => handlePrintStatement(emp)}>🖨️</button>
                <button className="action-btn edit" title={t.edit} onClick={() => handleEdit(emp)}>✏️</button>
                <button className="action-btn delete" title={t.delete} onClick={() => handleDelete(emp.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
            <div className="col-span-full empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">{t.noData}</div>
            </div>
        )}
      </div>

      <EmployeeModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchEmployees}
        t={t}
        employee={selectedEmployee}
      />

      <AdvanceModal 
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        onSuccess={fetchEmployees}
        t={t}
        employees={employees}
      />

      <PayrollModal 
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        onSuccess={fetchEmployees}
        t={t}
      />

      <PayrollRecordsModal 
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        t={t}
        onPrint={handlePrintPayment}
      />

      <EmployeeStatementModal 
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        employee={selectedEmployee}
        t={t}
        onPrint={executePrintStatement}
      />
    </div>
  );
};

export default EmployeeManagement;