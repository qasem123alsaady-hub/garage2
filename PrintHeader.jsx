import React from 'react';
import './print.css';

const PrintHeader = ({ t }) => {
  if (!t) return null;

  return (
    <div className="print-header-container">
      <div className="print-header-content">
        <div className="print-logo-section">
          {/* يتم جلب مسار الشعار من ملف الترجمة، الافتراضي هو logo.jpg */}
          <img src={t.logo || "logo.jpg"} alt={t.appName} className="print-logo-img" />
        </div>
        <div className="print-info-section">
          <h1 className="print-app-name">{t.appName}</h1>
          <p className="print-app-subtitle">{t.appSubtitle}</p>
        </div>
      </div>
      <hr className="print-divider" />
    </div>
  );
};

export default PrintHeader;