import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const CustomerReport = ({ 
  isOpen, 
  onClose, 
  customer,
  vehicles,
  services,
  payments
}) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const customerVehicles = vehicles.filter(v => v.customer_id === customer.id);
  
  const filteredServices = services.filter(service => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    
    const serviceDate = new Date(service.date);
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1900-01-01');
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    
    endDate.setHours(23, 59, 59, 999);
    
    return serviceDate >= startDate && serviceDate <= endDate;
  });

  const customerServices = filteredServices.filter(service => 
    customerVehicles.some(vehicle => vehicle.id === service.vehicle_id)
  );

  const filteredPayments = payments.filter(payment => 
    customerServices.some(service => service.id === payment.service_id)
  );

  const totalCost = customerServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const totalPaid = customerServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0);
  const totalRemaining = totalCost - totalPaid;

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('customerReport')} - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; color: #10b981; }
          .remaining { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('customerReport')}</h1>
          <p>${customer.name}</p>
          <p>${t('reportDate')}: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>${t('customerInfo')}</h3>
          <p><strong>${t('name')}:</strong> ${customer.name}</p>
          <p><strong>${t('phone')}:</strong> ${customer.phone}</p>
          ${customer.email ? `<p><strong>${t('email')}:</strong> ${customer.email}</p>` : ''}
          ${customer.address ? `<p><strong>${t('address')}:</strong> ${customer.address}</p>` : ''}
        </div>
        
        <div class="section">
          <h3>${t('customerVehicles')} (${customerVehicles.length})</h3>
          <table>
            <thead>
              <tr>
                <th>${t('make')}</th>
                <th>${t('model')}</th>
                <th>${t('year')}</th>
                <th>${t('licensePlate')}</th>
                <th>${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${customerVehicles.map(vehicle => `
                <tr>
                  <td>${vehicle.make}</td>
                  <td>${vehicle.model}</td>
                  <td>${vehicle.year}</td>
                  <td>${vehicle.license_plate}</td>
                  <td>${vehicle.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3>${t('serviceHistory')} (${customerServices.length})</h3>
          <table>
            <thead>
              <tr>
                <th>${t('vehicle')}</th>
                <th>${t('type')}</th>
                <th>${t('date')}</th>
                <th>${t('cost')}</th>
                <th>${t('paid')}</th>
                <th>${t('remaining')}</th>
                <th>${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${customerServices.map(service => {
                const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '';
                return `
                  <tr>
                    <td>${vehicleName}</td>
                    <td>${service.type}</td>
                    <td>${service.date}</td>
                    <td>$${service.cost}</td>
                    <td>$${service.amount_paid || 0}</td>
                    <td>$${service.remaining_amount || 0}</td>
                    <td>${service.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3>${t('reportSummary')}</h3>
          <p><strong>${t('totalVehicles')}:</strong> ${customerVehicles.length}</p>
          <p><strong>${t('totalServices')}:</strong> ${customerServices.length}</p>
          <p><strong>${t('totalCost')}:</strong> $${totalCost.toFixed(2)}</p>
          <p><strong>${t('totalPaid')}:</strong> $${totalPaid.toFixed(2)}</p>
          <p class="remaining"><strong>${t('amountDue')}:</strong> $${totalRemaining.toFixed(2)}</p>
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
      title={t('customerReport')}
      size="xlarge"
    >
      <div className="customer-report">
        <div className="report-header">
          <div className="customer-info">
            <h3>{customer.name}</h3>
            <p>{t('phone')}: {customer.phone}</p>
            {customer.email && <p>{t('email')}: {customer.email}</p>}
            {customer.address && <p>{t('address')}: {customer.address}</p>}
          </div>
          
          <div className="customer-stats">
            <div className="stat-item">
              <div className="stat-value">{customerVehicles.length}</div>
              <div className="stat-label">{t('vehicles')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{customerServices.length}</div>
              <div className="stat-label">{t('services')}</div>
            </div>
          </div>
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
              <div className="summary-icon">🚗</div>
              <div className="summary-info">
                <div className="summary-value">{customerVehicles.length}</div>
                <div className="summary-label">{t('vehicles')}</div>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">🔧</div>
              <div className="summary-info">
                <div className="summary-value">{customerServices.length}</div>
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

        <div className="vehicles-section">
          <h4>{t('customerVehicles')} ({customerVehicles.length})</h4>
          {customerVehicles.length > 0 ? (
            <div className="vehicles-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('make')}</th>
                    <th>{t('model')}</th>
                    <th>{t('year')}</th>
                    <th>{t('licensePlate')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.make}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.license_plate}</td>
                      <td>
                        <StatusBadge status={vehicle.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>{t('noVehicles')}</p>
            </div>
          )}
        </div>

        <div className="services-section">
          <h4>{t('serviceHistory')} ({customerServices.length})</h4>
          {customerServices.length > 0 ? (
            <div className="services-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('vehicle')}</th>
                    <th>{t('type')}</th>
                    <th>{t('date')}</th>
                    <th>{t('cost')}</th>
                    <th>{t('paid')}</th>
                    <th>{t('remaining')}</th>
                    <th>{t('status')}</th>
                    <th>{t('paymentStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerServices.map(service => {
                    const vehicle = vehicles.find(v => v.id === service.vehicle_id);
                    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '';
                    
                    return (
                      <tr key={service.id}>
                        <td>{vehicleName}</td>
                        <td>{service.type}</td>
                        <td>{service.date}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>{t('noServices')}</p>
            </div>
          )}
        </div>

        {totalRemaining > 0 && (
          <div className="amount-due-alert">
            <h4>{t('amountDue')}</h4>
            <div className="due-amount">${totalRemaining.toFixed(2)}</div>
          </div>
        )}

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

export default CustomerReport;
