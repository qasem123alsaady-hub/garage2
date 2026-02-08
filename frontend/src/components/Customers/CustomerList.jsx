import React, { useState } from 'react';
import { StatusBadge, PaymentBadge } from '../Common/Badges';
import { useTranslation } from '../../hooks/useTranslation';

const CustomerList = ({ customers, vehicles, services, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ البحث الفوري مع إضافة زر الإضافة
  return (
    <div className="customer-list-sidebar">
      {/* ✅ زر إضافة عميل جديد - كما في الصورة */}
      <div className="add-customer-button-container">
        <button 
          className="btn-add-customer"
          onClick={() => onEdit()} // لفتح نموذج إضافة جديد
        >
          إضافة عميل جديد
        </button>
      </div>

      {/* ✅ حقل البحث */}
      <div className="customer-search">
        <input
          type="text"
          placeholder="بحث العملاء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* ✅ قائمة العملاء */}
      <div className="customer-list-items">
        {customers
          .filter(customer =>
            customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(customer => (
            <div 
              key={customer.id} 
              className="customer-list-item"
              onClick={() => onSelect(customer)}
            >
              <div className="customer-item-main">
                <h4 className="customer-name">{customer.name || 'بدون اسم'}</h4>
                <p className="customer-phone">{customer.phone || 'لا يوجد'}</p>
              </div>
              <div className="customer-item-actions">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(customer);
                  }} 
                  className="btn-edit"
                >
                  ✏️
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default CustomerList;