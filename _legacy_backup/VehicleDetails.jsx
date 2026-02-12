import React from 'react';
import VehicleHeader from './VehicleHeader';
import VehicleInfoSection from './VehicleInfoSection';
import VehicleCustomerSection from './VehicleCustomerSection';
import VehicleStatsSection from './VehicleStatsSection';
import VehicleServiceHistory from './VehicleServiceHistory';

const VehicleDetails = ({ 
  vehicle, 
  customer = null, 
  services = [], 
  onEdit = () => console.warn('onEdit not provided'),
  onDelete = () => console.warn('onDelete not provided'),
  onAddService = () => console.warn('onAddService not provided'),
  onPayment = () => console.warn('onPayment not provided'),
  onViewService = () => console.warn('onViewService not provided')
}) => {
  const vehicleServices = services.filter(s => s.vehicle_id === vehicle.id);
  
  const stats = {
    servicesCount: vehicleServices.length,
    totalCost: vehicleServices.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0),
    totalPaid: vehicleServices.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
    totalRemaining: vehicleServices.reduce((sum, s) => sum + parseFloat(s.remaining_amount || 0), 0)
  };

  return (
    <div className="vehicle-details">
      <VehicleHeader 
        vehicle={vehicle} 
        onEdit={onEdit} 
        onAddService={onAddService} 
        onDelete={onDelete} 
      />

      <div className="details-content">
        <VehicleInfoSection vehicle={vehicle} />

        <VehicleCustomerSection customer={customer} />

        <VehicleStatsSection stats={stats} />

        <VehicleServiceHistory 
          services={vehicleServices} 
          onPayment={onPayment} 
          onViewService={onViewService} 
        />
      </div>
    </div>
  );
};

export default VehicleDetails;