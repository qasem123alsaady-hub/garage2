<?php
class Database {
    private $host = "localhost";
    private $db_name = "garage";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // إنشاء جميع الجداول إذا لم تكن موجودة
            $this->createTables();
        } catch(PDOException $exception) {
            // إنشاء قاعدة البيانات إذا لم تكن موجودة
            if ($exception->getCode() == 1049) {
                $this->createDatabase();
            } else {
                error_log("Connection error: " . $exception->getMessage());
            }
        }
        return $this->conn;
    }

    private function createDatabase() {
        try {
            // الاتصال بدون تحديد قاعدة البيانات
            $tempConn = new PDO("mysql:host=" . $this->host, $this->username, $this->password);
            $tempConn->exec("CREATE DATABASE IF NOT EXISTS `$this->db_name` CHARACTER SET utf8 COLLATE utf8_general_ci");
            
            // إعادة الاتصال بقاعدة البيانات الجديدة
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // إنشاء الجداول
            $this->createTables();
        } catch(PDOException $exception) {
            error_log("Database creation error: " . $exception->getMessage());
        }
    }

    private function createTables() {
        // إنشاء جدول العملاء
        $customersTable = "CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL UNIQUE,
            email VARCHAR(255),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";

        // إنشاء جدول المركبات
        $vehiclesTable = "CREATE TABLE IF NOT EXISTS vehicles (
            id VARCHAR(50) PRIMARY KEY,
            make VARCHAR(100) NOT NULL,
            model VARCHAR(100) NOT NULL,
            year INT(4) NOT NULL,
            license_plate VARCHAR(50) NOT NULL UNIQUE,
            status ENUM('pending', 'in-service', 'completed') DEFAULT 'pending',
            customer_id VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )";

        // إنشاء جدول الخدمات
        $servicesTable = "CREATE TABLE IF NOT EXISTS services (
            id VARCHAR(50) PRIMARY KEY,
            vehicle_id VARCHAR(50) NOT NULL,
            type VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
            technician VARCHAR(255),
            date DATE NOT NULL,
            cost DECIMAL(10,2) DEFAULT 0.00,
            amount_paid DECIMAL(10,2) DEFAULT 0.00,
            remaining_amount DECIMAL(10,2) DEFAULT 0.00,
            payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
            payment_method ENUM('cash', 'card', 'transfer', 'check') DEFAULT 'cash',
            transaction_id VARCHAR(255),
            payment_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        )";

        // إنشاء جدول الدفعات
        $paymentsTable = "CREATE TABLE IF NOT EXISTS payments (
            id VARCHAR(50) PRIMARY KEY,
            service_id VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('cash', 'card', 'transfer', 'check') DEFAULT 'cash',
            payment_date DATE NOT NULL,
            transaction_id VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )";

        // إنشاء جدول المستخدمين - محدث لدعم العملاء
        $usersTable = "CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            role ENUM('admin', 'user', 'technician', 'customer') DEFAULT 'user',
            customer_id VARCHAR(20) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
        )";

        // إنشاء جدول الموظفين
        $employeesTable = "CREATE TABLE IF NOT EXISTS employees (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            position VARCHAR(255),
            phone VARCHAR(50),
            email VARCHAR(255),
            salary DECIMAL(10,2),
            hire_date DATE,
            status ENUM('active', 'archived') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";

        // إنشاء جدول الموردين
        $suppliersTable = "CREATE TABLE IF NOT EXISTS suppliers (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            phone VARCHAR(50),
            email VARCHAR(255),
            address TEXT,
            products_services TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";

        // إنشاء جدول فواتير المشتريات
        $purchaseInvoicesTable = "CREATE TABLE IF NOT EXISTS purchase_invoices (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT(11) NOT NULL,
            invoice_number VARCHAR(50),
            invoice_date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            paid_amount DECIMAL(10,2) DEFAULT 0.00,
            status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
            items TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        )";

        // إنشاء جدول دفعات المشتريات
        $purchasePaymentsTable = "CREATE TABLE IF NOT EXISTS purchase_payments (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT(11) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('cash', 'card', 'transfer', 'check') DEFAULT 'cash',
            payment_date DATE NOT NULL,
            receipt_number VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE
        )";

        try {
            // تنفيذ إنشاء الجداول
            // استخدام try-catch لكل جدول لضمان عدم توقف العملية بالكامل عند حدوث خطأ في جدول واحد
            try { $this->conn->exec($customersTable); } catch(PDOException $e) {}
            
            try { $this->conn->exec($vehiclesTable); } catch(PDOException $e) {}
            
            try { $this->conn->exec($servicesTable); } catch(PDOException $e) {}
            
            try { $this->conn->exec($paymentsTable); } catch(PDOException $e) {}
            
            try { $this->conn->exec($usersTable); } catch(PDOException $e) {}
            
            try { $this->conn->exec($employeesTable); } catch(PDOException $e) {}
            
            // جداول المشتريات والموردين
            try { 
                $this->conn->exec($suppliersTable); 
            } catch(PDOException $e) {
                error_log("Error creating suppliers table: " . $e->getMessage());
            }
            
            try { 
                $this->conn->exec($purchaseInvoicesTable); 
            } catch(PDOException $e) {
                error_log("Error creating purchase_invoices table: " . $e->getMessage());
            }

            try { 
                $this->conn->exec($purchasePaymentsTable); 
            } catch(PDOException $e) {
                error_log("Error creating purchase_payments table: " . $e->getMessage());
            }

            // تحديث جدول فواتير المشتريات إذا كان موجوداً مسبقاً
            $checkInvoiceCols = $this->conn->query("SHOW COLUMNS FROM purchase_invoices LIKE 'paid_amount'");
            if ($checkInvoiceCols->rowCount() == 0) {
                $this->conn->exec("ALTER TABLE purchase_invoices ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0.00");
                $this->conn->exec("ALTER TABLE purchase_invoices ADD COLUMN status ENUM('pending', 'partial', 'paid') DEFAULT 'pending'");
            }

            // تحديث جدول دفعات المشتريات إذا كان موجوداً مسبقاً
            $checkPurchasePaymentCols = $this->conn->query("SHOW COLUMNS FROM purchase_payments LIKE 'payment_method'");
            if ($checkPurchasePaymentCols->rowCount() == 0) {
                $this->conn->exec("ALTER TABLE purchase_payments ADD COLUMN payment_method ENUM('cash', 'card', 'transfer', 'check') DEFAULT 'cash'");
            }

            // إصلاح تلقائي: إضافة عمود status إذا كان مفقوداً في قاعدة البيانات الحالية
            // هذا يحل مشكلة "Column not found" إذا تم إنشاء الجدول سابقاً بدون هذا العمود
            $checkStatus = $this->conn->query("SHOW COLUMNS FROM employees LIKE 'status'");
            if ($checkStatus->rowCount() == 0) {
                $this->conn->exec("ALTER TABLE employees ADD COLUMN status ENUM('active', 'archived') DEFAULT 'active'");
            }

            // إضافة المستخدمين الافتراضيين
            $this->createDefaultUsers();

        } catch(PDOException $exception) {
            error_log("Error creating tables: " . $exception->getMessage());
        }
    }

    private function createDefaultUsers() {
        // المستخدمين الافتراضيين
        $defaultUsers = [
            [
                'username' => 'admin',
                'password' => 'admin123',
                'name' => 'مدير النظام',
                'role' => 'admin'
            ],
            [
                'username' => 'user',
                'password' => 'user123',
                'name' => 'مستخدم عادي',
                'role' => 'user'
            ],
            [
                'username' => 'technician',
                'password' => 'tech123',
                'name' => 'فني متخصص',
                'role' => 'technician'
            ]
        ];

        foreach ($defaultUsers as $user) {
            $checkUser = "SELECT id FROM users WHERE username = :username";
            $stmt = $this->conn->prepare($checkUser);
            $stmt->bindParam(':username', $user['username']);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                $userId = 'u' . time() . rand(1000, 9999);
                $hashedPassword = password_hash($user['password'], PASSWORD_DEFAULT);
                $insertUser = "INSERT INTO users (id, username, password, name, role) VALUES 
                    (:id, :username, :password, :name, :role)";
                
                $stmt = $this->conn->prepare($insertUser);
                $stmt->bindParam(':id', $userId);
                $stmt->bindParam(':username', $user['username']);
                $stmt->bindParam(':password', $hashedPassword);
                $stmt->bindParam(':name', $user['name']);
                $stmt->bindParam(':role', $user['role']);
                $stmt->execute();
            }
        }
    }
}