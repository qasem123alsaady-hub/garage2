// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost/car-garage/backend/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

// Application Constants
export const APP_CONSTANTS = {
  APP_NAME: 'GaragePro Manager',
  VERSION: '1.0.0',
  COMPANY_NAME: 'GaragePro',
  SUPPORT_EMAIL: 'support@garagepro.com',
  SUPPORT_PHONE: '+1234567890'
};

// Vehicle Status Constants
export const VEHICLE_STATUS = {
  PENDING: 'pending',
  IN_SERVICE: 'in-service',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Service Status Constants
export const SERVICE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Payment Status Constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

// Payment Method Constants
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  CHECK: 'check'
};

// User Roles Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  USER: 'user',
  CUSTOMER: 'customer'
};

// Service Types Constants
export const SERVICE_TYPES = {
  OIL_CHANGE: 'oilChange',
  BRAKE_SERVICE: 'brakeService',
  TIRE_ROTATION: 'tireRotation',
  ENGINE_REPAIR: 'engineRepair',
  OTHER: 'other'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss'
};

// Currency Configuration
export const CURRENCY = {
  SYMBOL: '$',
  CODE: 'USD',
  LOCALE: 'en-US'
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100]
};

// Validation Constants
export const VALIDATION = {
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  LICENSE_PLATE_REGEX: /^[A-Za-z0-9\s-]+$/,
  VIN_REGEX: /^[A-HJ-NPR-Z0-9]{17}$/
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'app_language',
  THEME: 'app_theme'
};

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Demo Data (for development/testing)
export const DEMO_DATA = {
  CUSTOMERS: [
    { id: 'c1', name: 'أحمد السيد', phone: '0123456789', email: 'ahmed@example.com', address: 'القاهرة' },
    { id: 'c2', name: 'محمد عبدالله', phone: '0123456790', email: 'mohamed@example.com', address: 'الجيزة' },
    { id: 'c3', name: 'فاطمة أحمد', phone: '0123456791', email: 'fatima@example.com', address: 'الإسكندرية' }
  ],
  VEHICLES: [
    { id: 'v1', make: 'تويوتا', model: 'كامري', year: 2022, license_plate: 'أ ب ج 123', status: 'in-service', customer_id: 'c1' },
    { id: 'v2', make: 'هيونداي', model: 'سوناتا', year: 2021, license_plate: 'د هـ و 456', status: 'completed', customer_id: 'c2' },
    { id: 'v3', make: 'نيسان', model: 'صني', year: 2020, license_plate: 'ز ح ط 789', status: 'pending', customer_id: 'c3' }
  ],
  SERVICES: [
    { id: 's1', vehicle_id: 'v1', type: 'oilChange', description: 'تغيير زيت المحرك والفلاتر', status: 'completed', technician: 'أحمد محمد', date: '2024-01-15', cost: 150, amount_paid: 150, remaining_amount: 0, payment_status: 'paid' },
    { id: 's2', vehicle_id: 'v1', type: 'brakeService', description: 'فحص وتغيير فرامل', status: 'in-service', technician: 'محمد علي', date: '2024-01-20', cost: 300, amount_paid: 150, remaining_amount: 150, payment_status: 'partial' },
    { id: 's3', vehicle_id: 'v2', type: 'tireRotation', description: 'تغيير الإطارات الأمامية', status: 'completed', technician: 'خالد أحمد', date: '2024-01-18', cost: 200, amount_paid: 200, remaining_amount: 0, payment_status: 'paid' }
  ],
  PAYMENTS: [
    { id: 'p1', service_id: 's1', amount: 150, payment_method: 'cash', payment_date: '2024-01-15', transaction_id: '', notes: 'دفعة كاملة' },
    { id: 'p2', service_id: 's2', amount: 150, payment_method: 'card', payment_date: '2024-01-20', transaction_id: 'TXN123456', notes: 'دفعة أولى' }
  ],
  USERS: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' },
    { id: 'u2', username: 'user', password: 'user123', name: 'مستخدم عادي', role: 'user' },
    { id: 'u3', username: 'tech', password: 'tech123', name: 'فني متخصص', role: 'technician' },
    { id: 'u4', username: '0123456789', password: '123456', name: 'أحمد السيد', role: 'customer', customer_id: 'c1' },
    { id: 'u5', username: '0123456790', password: '123456', name: 'محمد عبدالله', role: 'customer', customer_id: 'c2' },
    { id: 'u6', username: '0123456791', password: '123456', name: 'فاطمة أحمد', role: 'customer', customer_id: 'c3' }
  ]
};
