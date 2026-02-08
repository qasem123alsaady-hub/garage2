<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // الحصول على جميع العملاء
    $query = "SELECT * FROM customers ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $customers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $customers[] = $row;
    }
    
    echo json_encode($customers);
}

if ($method == 'POST') {
    // إضافة عميل جديد
    $data = json_decode(file_get_contents("php://input"));
    
    $name = $data->name ?? '';
    $phone = $data->phone ?? '';
    $email = $data->email ?? '';
    $address = $data->address ?? '';
    
    // التحقق من البيانات المطلوبة
    if (empty($name) || empty($phone)) {
        http_response_code(400);
        echo json_encode([
            "message" => "الرجاء إدخال الاسم ورقم الهاتف", 
            "success" => false
        ]);
        exit();
    }
    
    // التحقق من وجود رقم الهاتف مسبقاً
    $checkQuery = "SELECT id FROM customers WHERE phone = :phone";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":phone", $phone);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            "message" => "رقم الهاتف مسجل مسبقاً لدى عميل آخر", 
            "success" => false,
            "error_code" => "PHONE_EXISTS"
        ]);
        exit();
    }
    
    // إنشاء ID فريد للعميل
    $id = 'c' . time() . rand(1000, 9999);
    
    // إضافة العميل
    $query = "INSERT INTO customers (id, name, phone, email, address, created_at) 
              VALUES (:id, :name, :phone, :email, :address, NOW())";
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":address", $address);
    
    if($stmt->execute()) {
        // محاولة إنشاء حساب مستخدم للعميل الجديد
        $user_creation_result = createCustomerUserAccount($db, $name, $phone, $id);
        
        // إعداد الاستجابة
        $response = [
            "message" => "تم إضافة العميل بنجاح", 
            "success" => true, 
            "id" => $id,
            "customer" => [
                "id" => $id,
                "name" => $name,
                "phone" => $phone,
                "email" => $email,
                "address" => $address,
                "created_at" => date('Y-m-d H:i:s')
            ]
        ];
        
        if ($user_creation_result['success']) {
            $response['user_account'] = [
                "username" => $user_creation_result['username'],
                "password" => $user_creation_result['password'],
                "user_id" => $user_creation_result['user_id']
            ];
            $response['message'] = "تم إضافة العميل وإنشاء حساب المستخدم بنجاح";
        } else {
            $response['user_account_error'] = $user_creation_result['message'];
            $response['message'] = "تم إضافة العميل بنجاح، ولكن حدث خطأ في إنشاء حساب المستخدم: " . $user_creation_result['message'];
        }
        
        echo json_encode($response);
    } else {
        http_response_code(500);
        echo json_encode([
            "message" => "فشل في إضافة العميل", 
            "success" => false
        ]);
    }
}

if ($method == 'PUT') {
    // تحديث بيانات العميل
    $data = json_decode(file_get_contents("php://input"));
    
    $id = $data->id ?? '';
    $name = $data->name ?? '';
    $phone = $data->phone ?? '';
    $email = $data->email ?? '';
    $address = $data->address ?? '';
    
    if (empty($id) || empty($name) || empty($phone)) {
        http_response_code(400);
        echo json_encode([
            "message" => "بيانات ناقصة للتحديث", 
            "success" => false
        ]);
        exit();
    }
    
    // التحقق من وجود رقم الهاتف مسبقاً (لعميل آخر)
    $checkQuery = "SELECT id FROM customers WHERE phone = :phone AND id != :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":phone", $phone);
    $checkStmt->bindParam(":id", $id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            "message" => "رقم الهاتف مسجل مسبقاً لدى عميل آخر", 
            "success" => false,
            "error_code" => "PHONE_EXISTS"
        ]);
        exit();
    }
    
    $query = "UPDATE customers SET name = :name, phone = :phone, email = :email, address = :address, updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":address", $address);
    
    if($stmt->execute()) {
        echo json_encode([
            "message" => "تم تحديث بيانات العميل بنجاح", 
            "success" => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "message" => "فشل في تحديث بيانات العميل", 
            "success" => false
        ]);
    }
}

if ($method == 'DELETE') {
    // حذف العميل
    $data = json_decode(file_get_contents("php://input"));
    
    $id = $data->id ?? '';
    
    if (empty($id)) {
        http_response_code(400);
        echo json_encode([
            "message" => "معرف العميل مطلوب", 
            "success" => false
        ]);
        exit();
    }
    
    try {
        $db->beginTransaction();
        
        // حذف جميع الخدمات المرتبطة بمركبات العميل أولاً
        $deleteServicesQuery = "DELETE services FROM services 
                               INNER JOIN vehicles ON services.vehicle_id = vehicles.id 
                               WHERE vehicles.customer_id = :id";
        $stmt1 = $db->prepare($deleteServicesQuery);
        $stmt1->bindParam(":id", $id);
        $stmt1->execute();
        
        // حذف جميع مركبات العميل
        $deleteVehiclesQuery = "DELETE FROM vehicles WHERE customer_id = :id";
        $stmt2 = $db->prepare($deleteVehiclesQuery);
        $stmt2->bindParam(":id", $id);
        $stmt2->execute();
        
        // حذف حساب المستخدم المرتبط (إن وجد)
        $deleteUserQuery = "DELETE FROM users WHERE customer_id = :id";
        $stmt3 = $db->prepare($deleteUserQuery);
        $stmt3->bindParam(":id", $id);
        $stmt3->execute();
        
        // حذف العميل
        $deleteCustomerQuery = "DELETE FROM customers WHERE id = :id";
        $stmt4 = $db->prepare($deleteCustomerQuery);
        $stmt4->bindParam(":id", $id);
        $stmt4->execute();
        
        $db->commit();
        
        echo json_encode([
            "message" => "تم حذف العميل وجميع البيانات المرتبطة به بنجاح", 
            "success" => true
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode([
            "message" => "فشل في حذف العميل: " . $e->getMessage(), 
            "success" => false
        ]);
    }
}

// دالة مساعدة لإنشاء حساب مستخدم للعميل
function createCustomerUserAccount($db, $customer_name, $customer_phone, $customer_id) {
    try {
        // تنظيف رقم الهاتف
        $cleaned_phone = preg_replace('/[^0-9]/', '', $customer_phone);
        
        if (empty($cleaned_phone)) {
            return ['success' => false, 'message' => 'رقم الهاتف غير صالح'];
        }
        
        $username = $cleaned_phone;
        $password = '123456';
        $name = $customer_name;
        $role = 'customer';
        
        // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
        $check_query = "SELECT id FROM users WHERE username = :username";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':username', $username);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            return [
                'success' => false, 
                'message' => 'رقم الهاتف مسجل مسبقاً كاسم مستخدم',
                'username' => $username
            ];
        }
        
        // إنشاء ID فريد للمستخدم
        $user_id = 'u' . time() . rand(1000, 9999);
        
        // إنشاء المستخدم الجديد
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO users (id, username, password, name, role, customer_id, created_at) 
                  VALUES (:id, :username, :password, :name, :role, :customer_id, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $user_id);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':role', $role);
        $stmt->bindParam(':customer_id', $customer_id);
        
        if ($stmt->execute()) {
            return [
                'success' => true, 
                'message' => 'تم إنشاء حساب المستخدم بنجاح',
                'user_id' => $user_id,
                'username' => $username,
                'password' => $password,
                'name' => $name,
                'role' => $role,
                'customer_id' => $customer_id
            ];
        } else {
            $error_info = $stmt->errorInfo();
            return [
                'success' => false, 
                'message' => 'فشل في إنشاء حساب المستخدم: ' . $error_info[2]
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false, 
            'message' => 'خطأ في إنشاء حساب المستخدم: ' . $e->getMessage()
        ];
    }
}
?>