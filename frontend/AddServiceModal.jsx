import React, { useState } from 'react';

function AddServiceModal({ isOpen, onClose, onSuccess, vehicles, customers, t }) {
  const [newService, setNewService] = useState({
    vehicle_id: '',
    type: '',
    description: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'pending',
    payment_status: 'pending'
  });

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost/car-garage/backend/api/services.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      const result = await response.json();
      if (result.success) {
        onSuccess();
        onClose();
        setNewService({
          vehicle_id: '', type: '', description: '', technician: '',
          date: new Date().toISOString().split('T')[0], cost: 0, status: 'pending', payment_status: 'pending'
        });
        alert(`✅ ${t.serviceAdded}`);
      } else {
        alert('❌ خطأ: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ في الاتصال');
    }
  };

  if (!isOpen) return null;

  const availableVehicles = vehicles.filter(v => v.status !== 'completed');

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.addNewService}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleAddService}>
            <div className="form-group">
              <label className="form-label">{t.selectVehicle} *</label>
              <select required className="form-input" value={newService.vehicle_id} onChange={(e) => setNewService({...newService, vehicle_id: e.target.value})}>
                <option value="">{t.selectVehicle}</option>
                {availableVehicles.map(vehicle => {
                  const customer = customers.find(c => c.id === vehicle.customer_id);
                  return (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.license_plate} {customer && ` (${customer.name})`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.serviceType} *</label>
              <select required className="form-input" value={newService.type} onChange={(e) => setNewService({...newService, type: e.target.value})}>
                <option value="">{t.selectServiceType}</option>
                <option value="تغيير الزيت">{t.oilChange}</option>
                <option value="خدمة الفرامل">{t.brakeService}</option>
                <option value="تدوير الإطارات">{t.tireRotation}</option>
                <option value="إصلاح المحرك">{t.engineRepair}</option>
                <option value="أخرى">{t.other}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.description} *</label>
              <textarea required className="form-textarea" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} placeholder={t.descriptionPlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.technician} *</label>
              <input type="text" required className="form-input" value={newService.technician} onChange={(e) => setNewService({...newService, technician: e.target.value})} placeholder={t.technicianPlaceholder} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.date} *</label>
              <input type="date" required className="form-input" value={newService.date} onChange={(e) => setNewService({...newService, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.cost} *</label>
              <input type="number" required className="form-input" value={newService.cost} onChange={(e) => setNewService({...newService, cost: parseFloat(e.target.value) || 0})} min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">{t.status}</label>
              <select className="form-input" value={newService.status} onChange={(e) => setNewService({...newService, status: e.target.value})}>
                <option value="pending">{t.statusPending}</option>
                <option value="in-service">{t.statusInService}</option>
                <option value="completed">{t.statusCompleted}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.paymentStatus}</label>
              <select className="form-input" value={newService.payment_status} onChange={(e) => setNewService({...newService, payment_status: e.target.value})}>
                <option value="pending">{t.paymentPending}</option>
                <option value="partial">{t.paymentPartial}</option>
                <option value="paid">{t.paymentPaid}</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-success">{t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddServiceModal;