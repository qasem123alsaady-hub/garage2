import React from 'react';
import '../../print.css';

const PrintEmployeeStatement = ({ t, data }) => {
  if (!data || !data.employee) return null;
  const { employee, payments, dateRange } = data;

  // Ledger Logic for Car Garage Employee Statement
  const totalEarned = payments.filter(p => p.payment_type === 'salary').reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalAdvances = payments.filter(p => p.payment_type === 'advance').reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalManualDeductions = payments.filter(p => p.payment_type === 'deduction').reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalReductions = totalAdvances + totalManualDeductions;
  const netTotalOwed = totalEarned - totalReductions;
  const totalPaid = payments.filter(p => p.status === 'paid' && p.payment_type === 'salary').reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remainingBalance = netTotalOwed - totalPaid;

  return (
    <div className="print-report-container p-8 bg-white text-gray-900 font-sans" style={{minHeight: '29.7cm'}}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img src={t.logo || "./logo.jpg"} alt="Logo" className="h-16 w-16 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{t.appName}</h1>
            <p className="text-sm text-gray-600">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-bold uppercase">Statement</h2>
          <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              {dateRange.start_date} → {dateRange.end_date}
            </span>
          </div>
        </div>
      </div>

      {/* Profile & Stats Combined */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-4 bg-gray-900 p-6 rounded-3xl text-white">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl">👤</div>
                <div>
                    <h3 className="text-lg font-black truncate max-w-[150px]">{employee.name}</h3>
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-[9px]">{employee.position}</p>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-800">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{t.salary}</span>
                <span className="text-xl font-black">${parseFloat(employee.salary).toLocaleString()}</span>
            </div>
        </div>

        <div className="col-span-8 grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                <span className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-widest">{t.totalEarned || 'Earned'}</span>
                <span className="text-2xl font-black text-gray-900">${totalEarned.toLocaleString()}</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                <span className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-widest">{t.deductions || 'Deducted'}</span>
                <span className="text-2xl font-black text-gray-900">-${totalReductions.toLocaleString()}</span>
            </div>
            <div className="bg-blue-600 p-5 rounded-3xl shadow-lg relative overflow-hidden group">
                <span className="text-[9px] font-black text-blue-100 uppercase mb-2 block tracking-widest relative z-10">{t.netBalance || 'Payable'}</span>
                <span className="text-2xl font-black text-white relative z-10">${remainingBalance.toLocaleString()}</span>
                <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl text-white transform rotate-12">💰</div>
            </div>
        </div>
      </div>

      {/* Ledger Table - More compact */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{t.paymentHistory || 'Transaction History'}</h3>
        </div>
        <table className="w-full text-start border-separate border-spacing-y-1">
          <thead>
            <tr className="text-gray-400">
              <th className="px-4 py-2 text-start uppercase text-[9px] font-black tracking-widest">{t.date}</th>
              <th className="px-4 py-2 text-start uppercase text-[9px] font-black tracking-widest">{t.type}</th>
              <th className="px-4 py-2 text-start uppercase text-[9px] font-black tracking-widest">{t.description}</th>
              <th className="px-4 py-2 text-center uppercase text-[9px] font-black tracking-widest">{t.status}</th>
              <th className="px-4 py-2 text-end uppercase text-[9px] font-black tracking-widest">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 15).map(p => ( // Limit to 15 entries for single page
              <tr key={p.id} className="bg-white border border-gray-50 shadow-sm rounded-xl hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900 text-[11px] rounded-l-2xl">{p.payment_date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    p.payment_type === 'salary' ? 'bg-blue-50 text-blue-600' :
                    p.payment_type === 'advance' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {p.payment_type === 'salary' ? t.salary : 
                     p.payment_type === 'advance' ? t.addEmployeeAdvance : 
                     p.payment_type === 'deduction' ? t.deductions : p.payment_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-[10px] font-medium max-w-[200px] truncate">{p.notes || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                    p.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                  }`}>
                    {t[p.status] || p.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-end font-black text-sm rounded-r-2xl ${
                  p.payment_type === 'salary' ? 'text-gray-900' : 'text-rose-600'
                }`}>
                  {p.payment_type !== 'salary' ? '-' : ''}${parseFloat(p.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length > 15 && (
            <div className="text-center py-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic border-t border-dashed border-gray-200 mt-2">
                Showing first 15 entries...
            </div>
        )}
      </div>

      {/* Footer / Auth Signatures - More compact */}
      <div className="grid grid-cols-2 gap-12 mt-auto pt-8 border-t border-gray-100">
        <div className="space-y-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.receivedBy || 'Employee Signature'}</p>
          <div className="w-full border-b border-gray-900 pb-1 font-black text-base text-gray-900">{employee.name}</div>
        </div>
        
        <div className="space-y-4 text-end">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.authorizedBy || 'Management Approval'}</p>
          <div className="w-full border-b border-gray-900 pb-1 font-black text-base text-gray-900">{t.appName}</div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">
        <div>Private & Confidential | Payroll Document</div>
        <div className="flex gap-4">
          <span>REF: EMP-{employee.id}</span>
          <span>DATE: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PrintEmployeeStatement;