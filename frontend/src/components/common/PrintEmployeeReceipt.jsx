import React from 'react';
import '../../print.css';

const PrintEmployeeReceipt = ({ t, payment }) => {
  if (!payment) return null;

  return (
    <div className="print-invoice-container p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img src={t.logo || "./logo.jpg"} alt="Logo" className="h-16 w-16 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{t.appName}</h1>
            <p className="text-sm text-gray-600">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="text-end">
          <h2 className="text-xl font-bold uppercase">{t.receipt || 'Receipt'}</h2>
          <p className="text-sm">#{payment.id}</p>
          <p className="text-sm">{payment.payment_date}</p>
        </div>
      </div>

      <div className="mb-8 border-y py-4">
        <div>
          <h3 className="font-bold mb-2 border-b pb-1">{t.employeeInfo || 'Employee Information'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>{t.name}:</strong> {payment.employee_name || '-'}</p>
            <p><strong>{t.position}:</strong> {payment.employee_position || '-'}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">{t.paymentType || 'Payment Type'}</th>
              <th className="p-2 border">{t.description || 'Description'}</th>
              <th className="p-2 border text-end">{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border font-medium">
                {payment.payment_type === 'salary' ? t.salary : 
                 payment.payment_type === 'advance' ? t.addEmployeeAdvance : 
                 payment.payment_type === 'deduction' ? t.deductions : payment.payment_type}
              </td>
              <td className="p-2 border">{payment.notes || '-'}</td>
              <td className="p-2 border text-end">${parseFloat(payment.amount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end mt-12">
        <div className="text-center w-48">
          <p className="border-b mb-1 pb-1">{t.receivedBy || 'Received By'}</p>
          <div className="h-16"></div>
          <p className="font-bold">{payment.employee_name}</p>
        </div>
        
        <div className="text-center w-48">
          <p className="border-b mb-1 pb-1">{t.authorizedBy || 'Authorized By'}</p>
          <div className="h-16"></div>
          <p className="font-bold">{t.appName}</p>
        </div>

        <div className="w-64 border p-4 rounded bg-gray-50">
          <div className="flex justify-between py-1 text-lg font-bold">
            <span>{t.totalAmount}:</span>
            <span>${parseFloat(payment.amount).toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t.paymentStatus}: {t[payment.status] || payment.status}</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>{t.thankYou || 'Thank you!'}</p>
      </div>
    </div>
  );
};

export default PrintEmployeeReceipt;