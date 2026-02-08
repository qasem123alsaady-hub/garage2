import React, { useState } from 'react';

function AddVehicleModal({ isOpen, onClose, onSuccess, customers, t }) {
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    status: 'pending',
    customer_id: ''
  });

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    try {
      if (!newVehicle.make || !newVehicle.model || !newVehicle.license_plate || !newVehicle.customer_id) {
        alert('الرجاء إدخال جميع البيانات المطلوبة');
        return;
      }

      const API_HOSTNAME = window.location.hostname;
      const response = await fetch(`http://${API_HOSTNAME}/car-garage/backend/api/vehicles.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        setNewVehicle({ 
          make: '', model: '', year: new Date().getFullYear(), 
          license_plate: '', status: 'pending', customer_id: '' 
        });
        alert(`✅ ${t.vehicleAdded}`);
      } else {
        if (result.message && result.message.includes('موجود')) {
          alert(t.vehicleExists);
        } else {
          alert('❌ خطأ في إضافة المركبة: ' + result.message);
        }
      }
    } catch (error) {
      console.error('❌ خطأ:', error);
      alert('حدث خطأ في الاتصال');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.addNewVehicle}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleAddVehicle}>
            <div className="form-group">
              <label className="form-label">{t.make} *</label>
              <input type="text" required className="form-input" value={newVehicle.make} onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})} placeholder={t.make} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.model} *</label>
              <input type="text" required className="form-input" value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} placeholder={t.model} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.year}</label>
              <input type="number" className="form-input" value={newVehicle.year} onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})} min="1990" max={new Date().getFullYear() + 1} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.licensePlate} *</label>
              <input type="text" required className="form-input" value={newVehicle.license_plate} onChange={(e) => setNewVehicle({...newVehicle, license_plate: e.target.value})} placeholder={t.licensePlate} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.selectCustomer} *</label>
              <select required className="form-input" value={newVehicle.customer_id} onChange={(e) => setNewVehicle({...newVehicle, customer_id: e.target.value})}>
                <option value="">{t.selectCustomer}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t.status}</label>
              <select className="form-input" value={newVehicle.status} onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}>
                <option value="pending">{t.statusPending}</option>
                <option value="in-service">{t.statusInService}</option>
                <option value="completed">{t.statusCompleted}</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-primary">{t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddVehicleModal;