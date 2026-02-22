import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const ServiceTypeManagement = ({ t, isRtl }) => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ name_ar: '', name_en: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const data = await apiService.serviceTypes.getAll();
      setServiceTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching service types:", error);
    }
  };

  const handleEdit = (type) => {
    setSelectedType(type);
    setFormData({ name_ar: type.name_ar, name_en: type.name_en });
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedType(null);
    setFormData({ name_ar: '', name_en: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await apiService.serviceTypes.delete(id);
      fetchServiceTypes();
      alert(t.deleteSuccess);
    } catch (error) {
      console.error("Error deleting service type:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedType) {
        await apiService.serviceTypes.update(selectedType.id, formData);
      } else {
        await apiService.serviceTypes.create(formData);
      }
      setShowModal(false);
      fetchServiceTypes();
      alert(t.addSuccess);
    } catch (error) {
      console.error("Error saving service type:", error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t.manageServices}</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + {t.addServiceType}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.nameAr}</th>
              <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t.nameEn}</th>
              <th className="px-6 py-3 text-end text-xs font-bold text-gray-500 uppercase tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {serviceTypes.map((type) => (
              <tr key={type.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name_ar}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.name_en}</td>
                <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                  <button onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-900 mx-2">✏️</button>
                  <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-900 mx-2">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{selectedType ? t.editServiceType : t.addServiceType}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="form-group mb-4">
                <label className="form-label">{t.nameAr}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name_ar} 
                  onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group mb-6">
                <label className="form-label">{t.nameEn}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name_en} 
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '...' : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceTypeManagement;