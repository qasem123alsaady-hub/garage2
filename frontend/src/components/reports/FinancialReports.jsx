import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const FinancialReports = ({ t, isRtl }) => {
  const [fundStats, setFundStats] = useState({
    total_income: 0,
    total_expenses: 0,
    main_fund: 0
  });
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);

  useEffect(() => {
    fetchFundStats();
    fetchAllData();
  }, []);

  const fetchFundStats = async () => {
    try {
      const data = await apiService.reports.getFundStats();
      if (data.success) {
        setFundStats(data);
      }
    } catch (error) {
      console.error("Error fetching fund stats:", error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [sData, pData, cData, vData, ppData, supData, piData] = await Promise.all([
        apiService.services.getAll(),
        apiService.payments.getAll(),
        apiService.customers.getAll(),
        apiService.vehicles.getAll(),
        apiService.purchasePayments.getAll(),
        apiService.suppliers.getAll(),
        apiService.invoices.getAll()
      ]);
      setServices(sData);
      setPayments(pData);
      setCustomers(cData);
      setVehicles(vData);
      setPurchasePayments(ppData);
      setSuppliers(supData);
      setPurchaseInvoices(piData);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };
  
  const getServiceTypeLabel = (type) => {
    const mapping = {
      'oil_change': t.oilChange, 'brake_service': t.brakeService, 'tire_rotation': t.tireRotation,
      'engine_repair': t.engineRepair, 'other': t.other, 'تغيير الزيت': t.oilChange,
      'خدمة الفرامل': t.brakeService, 'تدوير الإطارات': t.tireRotation, 'إصلاح المحرك': t.engineRepair, 'أخرى': t.other
    };
    return mapping[type] || type;
  };

  const handlePrintFinancialReport = (reportType) => {
    const language = isRtl ? 'ar' : 'en';
    let title = "";
    let content = "";
    let totalAmount = 0;

    if (reportType === 'invoices') {
      title = t.invoicesReport;
      const rows = services.map(s => {
        const v = vehicles.find(v => v.id == s.vehicle_id);
        const c = v ? customers.find(c => c.id == v.customer_id) : null;
        totalAmount += parseFloat(s.cost || 0);
        return `
          <tr>
            <td>${s.id}</td>
            <td>${s.date}</td>
            <td>${c ? c.name : '-'}</td>
            <td>${v ? `${v.make} ${v.model}` : '-'}</td>
            <td>${getServiceTypeLabel(s.type)}</td>
            <td>$${parseFloat(s.cost).toFixed(2)}</td>
            <td>${s.payment_status}</td>
          </tr>
        `;
      }).join('');

      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>ID</th><th>${t.date}</th><th>${t.customer}</th><th>${t.vehicle}</th><th>${t.serviceType}</th><th>${t.cost}</th><th>${t.paymentStatus}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: ${isRtl ? 'left' : 'right'}"><strong>${t.totalAmount}</strong></td>
              <td colspan="2"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (reportType === 'receipts') {
      title = t.receiptsReport;
      const rows = payments.map(p => {
        const s = services.find(s => s.id == p.service_id);
        const v = s ? vehicles.find(v => v.id == s.vehicle_id) : null;
        const c = v ? customers.find(c => c.id == v.customer_id) : null;
        totalAmount += parseFloat(p.amount || 0);
        return `
          <tr>
            <td>${p.id}</td>
            <td>${p.payment_date}</td>
            <td>${c ? c.name : '-'}</td>
            <td>${v ? `${v.make} ${v.model}` : '-'}</td>
            <td>$${parseFloat(p.amount).toFixed(2)}</td>
            <td>${p.payment_method}</td>
          </tr>
        `;
      }).join('');

      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>ID</th><th>${t.date}</th><th>${t.customer}</th><th>${t.vehicle}</th><th>${t.amount}</th><th>${t.paymentMethod}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: ${isRtl ? 'left' : 'right'}"><strong>${t.totalAmount}</strong></td>
              <td colspan="2"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (reportType === 'payments') {
      title = t.paymentsReport;
      const rows = purchasePayments.map(p => {
        const inv = purchaseInvoices.find(i => i.id == p.invoice_id);
        const sup = inv ? suppliers.find(s => s.id == inv.supplier_id) : null;
        totalAmount += parseFloat(p.amount || 0);
        return `
          <tr>
            <td>${p.id}</td>
            <td>${p.payment_date}</td>
            <td>${sup ? sup.name : '-'}</td>
            <td>${inv ? inv.invoice_number : '-'}</td>
            <td>$${parseFloat(p.amount).toFixed(2)}</td>
            <td>${p.receipt_number || '-'}</td>
          </tr>
        `;
      }).join('');

      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>ID</th><th>${t.date}</th><th>${isRtl ? 'المورد' : 'Supplier'}</th><th>${t.invoiceNumber}</th><th>${t.amount}</th><th>${t.receiptNumber}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: ${isRtl ? 'left' : 'right'}"><strong>${t.totalAmount}</strong></td>
              <td colspan="2"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          td, th { border: 1px solid #ddd; padding: 8px; text-align: ${isRtl ? 'right' : 'left'}; }
        </style>
      </head>
      <body>
        <div class="header">
           <img src="${t.logo}" style="height:80px; margin-bottom:10px;" onerror="this.style.display='none';">
           <h2>${title}</h2>
           <p>${new Date().toLocaleDateString()}</p>
        </div>
        ${content}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const handlePrintFundReport = () => {
    const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalExpense = purchasePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const currentBalance = totalIncome - totalExpense;
    
    const fundReportContent = `
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
          <meta charset="UTF-8">
          <title>${isRtl ? 'تقرير الصندوق الرئيسي' : 'Main Fund Report'}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .stat-box { text-align: center; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
              .income { background: #dcfce7; color: #166534; }
              .expense { background: #fee2e2; color: #991b1b; }
              .balance { background: #eff6ff; color: #1e40af; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRtl ? 'right' : 'left'}; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <div class="header">
              <img src="${t.logo}" style="height:80px; margin-bottom:10px;" onerror="this.style.display='none';">
              <h2>${isRtl ? 'تقرير الصندوق الرئيسي' : 'Main Fund Report'}</h2>
              <p>${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stat-grid">
              <div class="stat-box income">
                  <div>${isRtl ? 'إجمالي المقبوضات' : 'Total Income'}</div>
                  <div style="font-size: 24px; font-weight: bold;">$${totalIncome.toFixed(2)}</div>
              </div>
              <div class="stat-box expense">
                  <div>${isRtl ? 'إجمالي المصروفات' : 'Total Expenses'}</div>
                  <div style="font-size: 24px; font-weight: bold;">$${totalExpense.toFixed(2)}</div>
              </div>
              <div class="stat-box balance">
                  <div>${isRtl ? 'الرصيد الحالي' : 'Current Balance'}</div>
                  <div style="font-size: 24px; font-weight: bold;">$${currentBalance.toFixed(2)}</div>
              </div>
          </div>

          <h3>${isRtl ? 'آخر العمليات' : 'Recent Transactions'}</h3>
          <table>
              <thead>
                  <tr>
                      <th>${t.date}</th>
                      <th>${isRtl ? 'البيان' : 'Description'}</th>
                      <th>${t.amount}</th>
                  </tr>
              </thead>
              <tbody>
                  ${[...payments.map(p => ({...p, type: 'in'})), ...purchasePayments.map(p => ({...p, type: 'out'}))]
                    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                    .slice(0, 50)
                    .map(p => {
                        let desc = '';
                        if (p.type === 'in') {
                            const s = services.find(ser => ser.id == p.service_id);
                            const v = s ? vehicles.find(veh => veh.id == s.vehicle_id) : null;
                            const c = v ? customers.find(cust => cust.id == v.customer_id) : null;
                            desc = `${isRtl ? 'مقبوضات من' : 'Receipt from'} ${c ? c.name : (isRtl ? 'عميل' : 'Customer')}`;
                        } else {
                            const inv = purchaseInvoices.find(i => i.id == p.invoice_id);
                            const sup = inv ? suppliers.find(s => s.id == inv.supplier_id) : null;
                            desc = `${isRtl ? 'مدفوعات إلى' : 'Payment to'} ${sup ? sup.name : (isRtl ? 'مورد' : 'Supplier')}`;
                        }
                        return `
                        <tr>
                            <td>${p.payment_date}</td>
                            <td>${desc}</td>
                            <td style="color: ${p.type === 'in' ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                                ${p.type === 'in' ? '+' : '-'}$${parseFloat(p.amount).toFixed(2)}
                            </td>
                        </tr>
                        `;
                    }).join('')}
              </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(fundReportContent);
    win.document.close();
  };

  const downloadReport = (type, format = 'excel') => {
    if (format === 'pdf') {
      if (type === 'general') handlePrintFinancialReport('invoices');
      else if (type === 'financial') handlePrintFinancialReport('receipts');
      else if (type === 'payments') handlePrintFinancialReport('payments');
      else if (type === 'fund') handlePrintFundReport();
      return;
    }
    const langParam = isRtl ? 'ar' : 'en';
    let url = `http://localhost/car-garage/backend/api/export_excel.php?lang=${langParam}&report_type=${type}`;
    
    // Add date filters if available (assuming you might add date pickers later, or from current context)
    // For now, let's just make sure the URL is correctly formed.
    window.open(url, '_blank');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">{t.financialManagement} & {t.reports}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* بطاقة الصندوق الرئيسي */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">{t.mainFund}</h3>
            <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-semibold text-gray-900">{fundStats.main_fund.toLocaleString()}</span>
                <span className="ml-2 text-sm text-gray-500">SAR</span>
            </div>
            <div className="mt-4 text-xs space-y-1">
              <div className="flex justify-between text-green-600">
                <span>{t.totalRevenue || 'Total Income'}:</span>
                <span className="font-bold">+{fundStats.total_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t.purchaseInvoices || 'Expenses'}:</span>
                <span className="font-bold">-{fundStats.total_expenses.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                  onClick={() => downloadReport('fund', 'pdf')}
                  className="flex-1 bg-blue-50 text-blue-700 py-2 rounded text-xs font-bold hover:bg-blue-100 transition"
              >
                  🖨️ PDF
              </button>
              <button 
                  onClick={() => downloadReport('fund', 'excel')}
                  className="flex-1 bg-green-50 text-green-700 py-2 rounded text-xs font-bold hover:bg-green-100 transition"
              >
                  📊 Excel
              </button>
            </div>
        </div>

        {/* أزرار التقارير */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium mb-4">{t.reports}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-gray-600">{t.generalReport || 'General Report'}</span>
                    <div className="flex gap-2">
                        <button onClick={() => downloadReport('general', 'pdf')} className="bg-red-600 text-white p-2 rounded text-xs flex-1">PDF</button>
                        <button onClick={() => downloadReport('general', 'excel')} className="bg-green-600 text-white p-2 rounded text-xs flex-1">Excel</button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-gray-600">{t.receiptsReport}</span>
                    <div className="flex gap-2">
                        <button onClick={() => downloadReport('receipts', 'pdf')} className="bg-red-600 text-white p-2 rounded text-xs flex-1">PDF</button>
                        <button onClick={() => downloadReport('receipts', 'excel')} className="bg-green-600 text-white p-2 rounded text-xs flex-1">Excel</button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-gray-600">{t.paymentsReport}</span>
                    <div className="flex gap-2">
                        <button onClick={() => downloadReport('payments', 'pdf')} className="bg-red-600 text-white p-2 rounded text-xs flex-1">PDF</button>
                        <button onClick={() => downloadReport('payments', 'excel')} className="bg-green-600 text-white p-2 rounded text-xs flex-1">Excel</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;