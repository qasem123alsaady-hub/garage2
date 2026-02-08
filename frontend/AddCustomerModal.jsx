import React, { useState } from 'react';

function AddCustomerModal({ isOpen, onClose, onSuccess, t }) {
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    try {
      if (!newCustomer.name || !newCustomer.phone) {
        alert('الرجاء إدخال الاسم ورقم الهاتف');
        return;
      }

      const API_HOSTNAME = window.location.hostname;
      const response = await fetch(`http://${API_HOSTNAME}/car-garage/backend/api/customers.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newCustomer)
      });

      let result;
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        throw new Error('استجابة غير صالحة من الخادم');
      }

      if (result.success) {
        onSuccess(result.customer);
        onClose();
        setNewCustomer({ name: '', phone: '', email: '', address: '' });
        
        let successMessage = `✅ ${t.customerAdded}`;
        if (result.user_account) {
          successMessage += `\n✅ تم إنشاء حساب المستخدم للعميل\n👤 اسم المستخدم: ${result.user_account.username}\n🔐 كلمة السر: ${result.user_account.password}`;
        }
        alert(successMessage);
      } else {
        if (result.message && (result.message.includes('موجود') || result.message.includes('مسجل'))) {
          alert(t.customerExists);
        } else {
          alert('❌ خطأ في إضافة العميل: ' + (result.message || 'سبب غير معروف'));
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة العميل:', error);
      alert('حدث خطأ في الاتصال');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{t.addNewCustomer}</h3>
          <button className="modal-close" onClick={onClose}>❌</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleAddCustomer}>
            <div className="form-group">
              <label className="form-label">{t.name} *</label>
              <input
                type="text"
                required
                className="form-input"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.phone} *</label>
              <input
                type="text"
                required
                className="form-input"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.email}</label>
              <input type="email" className="form-input" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.address}</label>
              <textarea className="form-textarea" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} placeholder={`${t.address} (${t.optional})`} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="btn btn-secondary">{t.add}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCustomerModal;