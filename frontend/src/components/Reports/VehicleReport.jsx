import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const VehicleReport = ({ 
  isOpen, 
  onClose, 
  vehicle,
  customer,
  services,
  payments
}) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const filteredServices = services.filter(service => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    
    const serviceDate = new Date(service.date);
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1900-01-01');
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    
    endDate.setHours(23, 59, 59, 999);
    
    return serviceDate >= startDate && serviceDate <= endDate;
  });

  const filteredPayments = payments.filter(payment => 
    filteredServices.some(service => service.id === payment.service_id)
  );

  const totalCost = filteredServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const totalPaid = filteredServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0);
  const totalRemaining = totalCost - totalPaid;

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('vehicleReport')} - ${vehicle.make} ${vehicle.model}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('vehicleReport')}</h1>
          <p>${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}</p>
          <p>${t('reportDate')}: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>${t('vehicleInfo')}</h3>
          <p><strong>${t('make')}:</strong> ${vehicle.make}</p>
          <p><strong>${t('model')}:</strong> ${vehicle.model}</p>
          <p><strong>${t('year')}:</strong> ${vehicle.year}</p>
          <p><strong>${t('licensePlate')}:</strong> ${vehicle.license_plate}</p>
          <p><strong>${t('status')}:</strong> ${vehicle.status}</p>
        </div>
        
        ${customer ? `
        <div class="section">
          <h3>${t('customerInfo')}</h3>
          <p><strong>${t('name')}:</strong> ${customer.name}</p>
          <p><strong>${t('phone')}:</strong> ${customer.phone}</p>
          ${customer.email ? `<p><strong>${t('email')}:</strong> ${customer.email}</p>` : ''}
        </div>
        ` : ''}
        
        <div class="section">
          <h3>${t('serviceHistory')}</h3>
          <table>
            <thead>
              <tr>
                <th>${t('type')}</th>
                <th>${t('date')}</th>
                <th>${t('technician')}</th>
                <th>${t('cost')}</th>
                <th>${t('paid')}</th>
                <th>${t('remaining')}</th>
                <th>${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map(service => `
                <tr>
                  <td>${service.type}</td>
                  <td>${service.date}</td>
                  <td>${service.technician}</td>
                  <td>$${service.cost}</td>
                  <td>$${service.amount_paid || 0}</td>
                  <td>$${service.remaining_amount || 0}</td>
                  <td>${service.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3>${t('reportSummary')}</h3>
          <p><strong>${t('servicesCount')}:</strong> ${filteredServices.length}</p>
          <p><strong>${t('totalCost')}:</strong> $${totalCost.toFixed(2)}</p>
          <p><strong>${t('totalPaid')}:</strong> $${totalPaid.toFixed(2)}</p>
          <p><strong>${t('remaining')}:</strong> $${totalRemaining.toFixed(2)}</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('vehicleReport')}
      size="xlarge"
    >
      <div className="vehicle-report">
        <div className="report-header">
          <div className="vehicle-info">
            <h3>{vehicle.make} {vehicle.model}</h3>
            <p>{t('licensePlate')}: {vehicle.license_plate}</p>
            <p>{t('year')}: {vehicle.year}</p>
            <StatusBadge status={vehicle.status} />
          </div>
          
          {customer && (
            <div className="customer-info">
              <h4>{t('customerInfo')}</h4>
              <p>{customer.name}</p>
              <p>{t('phone')}: {customer.phone}</p>
              {customer.email && <p>{t('email')}: {customer.email}</p>}
            </div>
          )}
        </div>

        <div className="date-filter">
          <h4>{t('dateRange')}</h4>
          <div className="filter-controls">
            <div className="form-group">
              <label>{t('fromDate')}</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>{t('toDate')}</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="report-summary">
          <h4>{t('reportSummary')}</h4>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">🔧</div>
              <div className="summary-info">
                <div className="summary-value">{filteredServices.length}</div>
                <div className="summary-label">{t('services')}</div>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-info">
                <div className="summary-value">${totalCost.toFixed(2)}</div>
                <div className="summary-label">{t('totalCost')}</div>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">💳</div>
              <div className="summary-info">
                <div className="summary-value">${totalPaid.toFixed(2)}</div>
                <div className="summary-label">{t('totalPaid')}</div>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">⏳</div>
              <div className="summary-info">
                <div className="summary-value">${totalRemaining.toFixed(2)}</div>
                <div className="summary-label">{t('remaining')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="services-list">
          <h4>{t('serviceHistory')}</h4>
          {filteredServices.length > 0 ? (
            <div className="services-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('type')}</th>
                    <th>{t('date')}</th>
                    <th>{t('technician')}</th>
                    <th>{t('cost')}</th>
                    <th>{t('paid')}</th>
                    <th>{t('remaining')}</th>
                    <th>{t('status')}</th>
                    <th>{t('paymentStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id}>
                      <td>{service.type}</td>
                      <td>{service.date}</td>
                      <td>{service.technician}</td>
                      <td className="cost-cell">${service.cost}</td>
                      <td className="paid-cell">${service.amount_paid || 0}</td>
                      <td className="remaining-cell">${service.remaining_amount || 0}</td>
                      <td>
                        <StatusBadge status={service.status} />
                      </td>
                      <td>
                        <PaymentBadge status={service.payment_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>{t('noServicesInPeriod')}</p>
            </div>
          )}
        </div>

        <div className="report-actions">
          <button className="btn btn-outline" onClick={onClose}>
            {t('close')}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ {t('printReport')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VehicleReport;
