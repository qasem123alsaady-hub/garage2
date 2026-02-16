 export const demoData = {
  customers: [
    { 
      id: 'c1', 
      name: 'أحمد السيد', 
      phone: '0123456789', 
      email: 'ahmed@example.com', 
      address: 'القاهرة',
      created_at: '2024-01-15 10:00:00'
    },
    { 
      id: 'c2', 
      name: 'محمد عبدالله', 
      phone: '0123456790', 
      email: 'mohamed@example.com', 
      address: 'الجيزة',
      created_at: '2024-01-16 11:00:00'
    },
    { 
      id: 'c3', 
      name: 'فاطمة أحمد', 
      phone: '0123456791', 
      email: 'fatima@example.com', 
      address: 'الإسكندرية',
      created_at: '2024-01-17 12:00:00'
    }
  ],
  vehicles: [
    { 
      id: 'v1', 
      make: 'تويوتا', 
      model: 'كامري', 
      year: 2022, 
      license_plate: 'أ ب ج 123', 
      status: 'in-service', 
      customer_id: 'c1' 
    },
    { 
      id: 'v2', 
      make: 'هيونداي', 
      model: 'سوناتا', 
      year: 2021, 
      license_plate: 'د هـ و 456', 
      status: 'completed', 
      customer_id: 'c2' 
    },
    { 
      id: 'v3', 
      make: 'نيسان', 
      model: 'صني', 
      year: 2020, 
      license_plate: 'ز ح ط 789', 
      status: 'pending', 
      customer_id: 'c3' 
    }
  ],
  services: [
    { 
      id: 's1', 
      vehicle_id: 'v1', 
      type: 'تغيير الزيت', 
      description: 'تغيير زيت المحرك والفلاتر', 
      status: 'completed', 
      technician: 'أحمد محمد', 
      date: '2024-01-15', 
      cost: 150, 
      amount_paid: 150, 
      remaining_amount: 0, 
      payment_status: 'paid' 
    }
  ],
  payments: [],
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' },
    { id: 'u2', username: 'user', password: 'user123', name: 'مستخدم عادي', role: 'user' },
    { id: 'u3', username: 'tech', password: 'tech123', name: 'فني متخصص', role: 'technician' }
  ]
};