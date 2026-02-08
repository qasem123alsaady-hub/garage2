-- جدول العملاء
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المركبات
CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('in-service', 'completed', 'pending') DEFAULT 'pending',
    customer_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- جدول الخدمات (محدث مع نظام الدفعات الجزئية)
CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'in-progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    technician VARCHAR(100),
    date DATE NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_notes TEXT,
    payment_date DATE,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- بيانات تجريبية
INSERT INTO customers (id, name, phone, email) VALUES
('101', 'Robert Johnson', '(555) 123-4567', 'robert@example.com'),
('102', 'Emily Chen', '(555) 987-6543', 'emily@example.com'),
('103', 'Michael Rodriguez', '(555) 456-7890', 'michael@example.com');

INSERT INTO vehicles (id, make, model, year, license_plate, status, customer_id) VALUES
('1', 'Toyota', 'Camry', 2018, 'ABC123', 'in-service', '101'),
('2', 'Honda', 'Civic', 2020, 'XYZ789', 'completed', '102'),
('3', 'Ford', 'F-150', 2019, 'TRK456', 'pending', '103');

INSERT INTO services (id, vehicle_id, type, description, status, technician, date, cost, payment_status, payment_method, amount_paid, remaining_amount) VALUES
('s1', '1', 'Oil Change', 'Full synthetic oil change with filter replacement', 'completed', 'John Smith', '2023-06-15', 75.00, 'pending', NULL, 0.00, 75.00),
('s2', '1', 'Brake Service', 'Front brake pad replacement', 'completed', 'Mike Johnson', '2023-05-20', 250.00, 'paid', 'cash', 250.00, 0.00),
('s3', '2', 'Tire Rotation', 'All-season tire rotation', 'completed', 'Sarah Davis', '2023-06-10', 45.00, 'partial', 'card', 20.00, 25.00);