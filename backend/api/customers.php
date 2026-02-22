<?php
// إعداد رؤوس CORS بشكل ديناميكي
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// الحصول على البيانات المدخلة
$input = json_decode(file_get_contents("php://input"), true);

switch($method) {
    case 'GET':
        handleGet($db, $_GET);
        break;
    case 'POST':
        handlePost($db, $input);
        break;
    case 'PUT':
        handlePut($db, $input);
        break;
    case 'DELETE':
        handleDelete($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed", "success" => false]);
        break;
}

function handleGet($db, $params) {
    try {
        if (isset($params['id'])) {
            $query = "SELECT * FROM customers WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $params['id']);
        } else {
            $query = "SELECT * FROM customers ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($customers);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error fetching customers", "success" => false, "error" => $e->getMessage()]);
    }
}

function handlePost($db, $input) {
    try {
        if (!isset($input['name']) || !isset($input['phone'])) {
            http_response_code(400);
            echo json_encode(["message" => "Name and phone are required", "success" => false]);
            return;
        }

        // التحقق من وجود العميل مسبقاً بنفس رقم الهاتف
        $checkQuery = "SELECT id FROM customers WHERE phone = :phone";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":phone", $input['phone']);
        $checkStmt->execute();
        if ($checkStmt->rowCount() > 0) {
            echo json_encode(["message" => "العميل مسجل مسبقاً بنفس رقم الهاتف", "success" => false]);
            return;
        }

        $db->beginTransaction();

        $query = "INSERT INTO customers SET id = :id, name = :name, phone = :phone, email = :email, address = :address";
        $stmt = $db->prepare($query);
        
        $id = 'c' . time() . rand(1000, 9999);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":name", $input['name']);
        $stmt->bindParam(":phone", $input['phone']);
        $stmt->bindParam(":email", $input['email']);
        $stmt->bindParam(":address", $input['address']);
        
        if ($stmt->execute()) {
            // إنشاء حساب مستخدم للعميل
            $userId = 'u' . time() . rand(1000, 9999);
            $username = $input['phone']; // رقم الهاتف هو اسم المستخدم
            $password = $input['phone']; // رقم الهاتف هو كلمة المرور الافتراضية
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $role = 'customer';
            
            // التأكد من عدم وجود مستخدم بنفس الاسم
            $checkUserQuery = "SELECT id FROM users WHERE username = :username";
            $checkUserStmt = $db->prepare($checkUserQuery);
            $checkUserStmt->bindParam(":username", $username);
            $checkUserStmt->execute();
            
            if ($checkUserStmt->rowCount() == 0) {
                $userQuery = "INSERT INTO users (id, username, password, name, role, customer_id) VALUES (:id, :username, :password, :name, :role, :customer_id)";
                $userStmt = $db->prepare($userQuery);
                $userStmt->bindParam(":id", $userId);
                $userStmt->bindParam(":username", $username);
                $userStmt->bindParam(":password", $hashedPassword);
                $userStmt->bindParam(":name", $input['name']);
                $userStmt->bindParam(":role", $role);
                $userStmt->bindParam(":customer_id", $id);
                
                if (!$userStmt->execute()) {
                    $db->rollBack();
                    throw new Exception("Failed to create user account");
                }
            }

            $db->commit();
            echo json_encode([
                "message" => "Customer and user account created successfully", 
                "success" => true, 
                "id" => $id,
                "user_account" => [
                    "username" => $username,
                    "password" => $username
                ]
            ]);
        } else {
            $db->rollBack();
            throw new Exception("Failed to create customer");
        }
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}

function handlePut($db, $input) {
    try {
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Customer ID is required", "success" => false]);
            return;
        }

        $query = "UPDATE customers SET name = :name, phone = :phone, email = :email, address = :address WHERE id = :id";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":id", $input['id']);
        $stmt->bindParam(":name", $input['name']);
        $stmt->bindParam(":phone", $input['phone']);
        $stmt->bindParam(":email", $input['email']);
        $stmt->bindParam(":address", $input['address']);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Customer updated successfully", "success" => true]);
        } else {
            throw new Exception("Failed to update customer");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}

function handleDelete($db, $input) {
    try {
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Customer ID is required", "success" => false]);
            return;
        }

        $query = "DELETE FROM customers WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $input['id']);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Customer deleted successfully", "success" => true]);
        } else {
            throw new Exception("Failed to delete customer");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}
