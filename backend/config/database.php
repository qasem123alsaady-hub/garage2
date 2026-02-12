<?php
class Database {
    private $host = "localhost";
    private $db_name = "garage";
    private $username = "if0_40726306";
    private $password = "QhDFUWoTIAL";
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
                echo "Connection error: " . $exception->getMessage();
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
            echo "Database creation error: " . $exception->getMessage();
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
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
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
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            vehicle_id INT(11) NOT NULL,
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
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            service_id INT(11) NOT NULL,
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
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            role ENUM('admin', 'user', 'technician', 'customer') DEFAULT 'user',
            customer_id VARCHAR(20) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
        )";

        try {
            // تنفيذ إنشاء الجداول
            $this->conn->exec($customersTable);
            $this->conn->exec($vehiclesTable);
            $this->conn->exec($servicesTable);
            $this->conn->exec($paymentsTable);
            $this->conn->exec($usersTable);

            // إضافة المستخدمين الافتراضيين
            $this->createDefaultUsers();

        } catch(PDOException $exception) {
            echo "Error creating tables: " . $exception->getMessage();
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
                $hashedPassword = password_hash($user['password'], PASSWORD_DEFAULT);
                $insertUser = "INSERT INTO users (username, password, name, role) VALUES 
                    (:username, :password, :name, :role)";
                
                $stmt = $this->conn->prepare($insertUser);
                $stmt->bindParam(':username', $user['username']);
                $stmt->bindParam(':password', $hashedPassword);
                $stmt->bindParam(':name', $user['name']);
                $stmt->bindParam(':role', $user['role']);
                $stmt->execute();
            }
        }
    }
}
?>
