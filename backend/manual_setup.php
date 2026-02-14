<?php
header("Content-Type: text/plain; charset=UTF-8");

// محاولة تضمين ملف الاتصال
if (file_exists('config/database.php')) {
    include_once 'config/database.php';
} elseif (file_exists('../config/database.php')) {
    include_once '../config/database.php';
} else {
    die("Error: Could not find config/database.php");
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "--- بدء الإنشاء اليدوي للجداول ---\n\n";
    
    // 1. جدول الموردين
    $sql1 = "CREATE TABLE IF NOT EXISTS suppliers (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        products_services TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $db->exec($sql1);
    echo "1. تم إنشاء جدول الموردين (suppliers) بنجاح.\n";
    
    // 2. جدول الفواتير
    $sql2 = "CREATE TABLE IF NOT EXISTS purchase_invoices (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT(11) NOT NULL,
        invoice_number VARCHAR(50),
        invoice_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        items TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $db->exec($sql2);
    echo "2. تم إنشاء جدول فواتير المشتريات (purchase_invoices) بنجاح.\n";
    
    echo "\n--- تمت العملية بنجاح ---";
    
} catch(PDOException $e) {
    echo "خطأ SQL: " . $e->getMessage();
} catch(Exception $e) {
    echo "خطأ عام: " . $e->getMessage();
}
?>