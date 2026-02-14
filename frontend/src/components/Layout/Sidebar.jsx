import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';

const Sidebar = () => {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🏠</span> {t('dashboard')}
            </NavLink>
          </li>
          
          {hasPermission('canViewAllVehicles') && (
            <li>
              <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'active' : ''}>
                <span>🚗</span> {t('vehicles')}
              </NavLink>
            </li>
          )}
          
          {hasPermission('canViewAllCustomers') && (
            <li>
              <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
                <span>👥</span> {t('customers')}
              </NavLink>
            </li>
          )}
          
          {hasPermission('canManageServices') && (
            <li>
              <NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>
                <span>🔧</span> {t('services')}
              </NavLink>
            </li>
          )}
          
          {hasPermission('canViewReports') && (
            <li>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                <span>📊</span> {t('reports')}
              </NavLink>
            </li>
          )}
          
          {hasPermission('canManageUsers') && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                <span>⚙️</span> {t('admin')}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
