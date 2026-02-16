import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

function ServiceModal({ isOpen, onClose, onSuccess, vehicles, customers, t, service = null, permissions }) {
  const initialItem = {
    type: '',
    description: '',
    cost: 0
  };

  const initialState = {
    vehicle_id: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    payment_status: 'pending',
    items: [{ ...initialItem }]
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        id: service.id,
        vehicle_id: service.vehicle_id,
        technician: service.technician,
        date: service.date,
        status: service.status,
        payment_status: service.payment_status,
        items: [{
          type: service.type,
          description: service.description,
          cost: service.cost
        }]
      });
    } else {
      setFormData(initialState);
    }
  }, [service, isOpen]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...initialItem }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    let finalValue = value;
    
    // Ensure cost is a number or empty string while typing
    if (field === 'cost') {
        if (value === '') {
            finalValue = '';
        } else {
            finalValue = parseFloat(value) || 0;
        }
    }
    
    newItems[index] = { ...newItems[index], [field]: finalValue };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (service) {
        // Edit mode: only one service
        const updateData = {
          id: formData.id,
          vehicle_id: formData.vehicle_id,
          technician: formData.technician,
          date: formData.date,
          status: formData.status,
          payment_status: formData.payment_status,
          type: formData.items[0].type,
          description: formData.items[0].description,
          cost: parseFloat(formData.items[0].cost) || 0
        };
        result = await apiService.services.update(updateData);
      } else {
        // Create mode: can be multiple
        const payload = {
          vehicle_id: formData.vehicle_id,
          technician: formData.technician,
          date: formData.date,
          status: formData.status,
          payment_status: formData.payment_status,
          services: formData.items.map(item => ({
            ...item,
            cost: parseFloat(item.cost) || 0,
            vehicle_id: formData.vehicle_id,
            technician: formData.technician,
            date: formData.date,
            status: formData.status,
            payment_status: formData.payment_status
          }))
        };
        result = await apiService.services.create(payload);
      }

      if (result.success) {
        onSuccess();
        onClose();
        if (!service) setFormData(initialState);
        alert(`✅ ${service ? t.statusUpdated : t.serviceAdded}`);
      } else {
        alert(`❌ ${t.error}: ` + result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableVehicles = service 
    ? vehicles 
    : vehicles.filter(v => v.status !== 'completed');

  const totalCost = formData.items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl">
        <div className="modal-header">
          <h3 className="modal-title">{service ? t.edit : t.addNewService}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                <label className="form-label">{t.selectVehicle} *</label>
                <select required className="form-input" value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}>
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
                <label className="form-label">{t.technician} *</label>
                <input type="text" required className="form-input" value={formData.technician} onChange={(e) => setFormData({...formData, technician: e.target.value})} placeholder={t.technicianPlaceholder} />
                </div>
                <div className="form-group">
                <label className="form-label">{t.date} *</label>
                <input type="date" required className="form-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                <label className="form-label">{t.status}</label>
                <select className="form-input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="pending">{t.statusPending}</option>
                    <option value="in-service">{t.statusInService}</option>
                    <option value="completed">{t.statusCompleted}</option>
                </select>
                </div>
            </div>

            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-xl text-gray-800">{t.multipleServices || 'الخدمات'}</h4>
                    {!service && (
                        <button 
                            type="button" 
                            onClick={addItem}
                            className="btn btn-sm btn-info"
                        >
                            + {t.addAnotherService || 'إضافة خدمة أخرى'}
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    {formData.items.map((item, index) => (
                        <div key={index} className="card" style={{margin: 0, padding: '24px', background: '#f8fafc', position: 'relative'}}>
                            {!service && formData.items.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeItem(index)}
                                    className="action-btn delete absolute"
                                    style={{top: '-12px', left: '-12px'}}
                                    title={t.remove}
                                >
                                    ✕
                                </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="form-label">{t.serviceType} *</label>
                                    <select required className="form-select" value={item.type} onChange={(e) => updateItem(index, 'type', e.target.value)}>
                                        <option value="">{t.selectServiceType}</option>
                                        <option value="oil_change">{t.oilChange}</option>
                                        <option value="brake_service">{t.brakeService}</option>
                                        <option value="tire_rotation">{t.tireRotation}</option>
                                        <option value="engine_repair">{t.engineRepair}</option>
                                        <option value="other">{t.other}</option>
                                    </select>
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">{t.description} *</label>
                                    <input required className="form-input" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder={t.descriptionPlaceholder} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.cost} *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="form-input font-bold text-emerald-600"
                                        value={item.cost} 
                                        onChange={(e) => updateItem(index, 'cost', e.target.value)} 
                                        min="0" 
                                        step="0.01" 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <span className="font-bold text-blue-900">{t.totalAmount || 'إجمالي المبلغ'}:</span>
                <span className="text-3xl font-extrabold text-blue-700">${totalCost.toLocaleString()}</span>
            </div>

            <div className="form-group">
                <label className="form-label">{t.paymentStatus}</label>
                <select 
                    className="form-select"
                    value={formData.payment_status} 
                    onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                >
                    <option value="pending">{t.paymentPending}</option>
                    <option value="partial">{t.paymentPartial}</option>
                    <option value="paid">{t.paymentPaid}</option>
                </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>{t.cancel}</button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? '...' : (service ? t.save : t.add)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ServiceModal;
