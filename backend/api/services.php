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

// الحصول على البيانات المدخلة
$input = json_decode(file_get_contents("php://input"), true);

// الحصول على معرف من query string إذا كان موجوداً
$id = isset($_GET['id']) ? $_GET['id'] : '';

// إذا لم يكن ID موجوداً في query string، نحاول الحصول عليه من body
if (empty($id) && isset($input['id'])) {
    $id = $input['id'];
}

switch($method) {
    case 'GET':
        handleGet($db, $_GET);
        break;
    case 'POST':
        handlePost($db, $input);
        break;
    case 'PUT':
        handlePut($db, $id, $input);
        break;
    case 'DELETE':
        handleDelete($db, $id, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed", "success" => false]);
        break;
}

function handleGet($db, $params) {
    try {
        // بناء الاستعلام بناءً على المعلمات
        if (isset($params['vehicle_id'])) {
            $query = "SELECT * FROM services WHERE vehicle_id = :vehicle_id ORDER BY date DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":vehicle_id", $params['vehicle_id']);
        } else if (isset($params['id'])) {
            $query = "SELECT * FROM services WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $params['id']);
        } else {
            $query = "SELECT * FROM services ORDER BY date DESC";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($services);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Error fetching services", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}

function handlePost($db, $input) {
    try {
        // التحقق من البيانات المطلوبة
        $required_fields = ['vehicle_id', 'type', 'description', 'technician', 'date', 'cost'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(["message" => "Missing required field: $field", "success" => false]);
                return;
            }
        }

        // إضافة الخدمة
        $query = "INSERT INTO services (id, vehicle_id, type, description, technician, date, cost, status, payment_status, amount_paid, remaining_amount, created_at) 
                  VALUES (:id, :vehicle_id, :type, :description, :technician, :date, :cost, :status, :payment_status, :amount_paid, :remaining_amount, NOW())";
        $stmt = $db->prepare($query);
        
        $serviceId = 's' . time() . rand(1000, 9999);
        $status = $input['status'] ?? 'pending';
        $payment_status = $input['payment_status'] ?? 'pending';
        $amount_paid = 0;
        $remaining_amount = $input['cost'];
        
        $stmt->bindParam(":id", $serviceId);
        $stmt->bindParam(":vehicle_id", $input['vehicle_id']);
        $stmt->bindParam(":type", $input['type']);
        $stmt->bindParam(":description", $input['description']);
        $stmt->bindParam(":technician", $input['technician']);
        $stmt->bindParam(":date", $input['date']);
        $stmt->bindParam(":cost", $input['cost']);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":payment_status", $payment_status);
        $stmt->bindParam(":amount_paid", $amount_paid);
        $stmt->bindParam(":remaining_amount", $remaining_amount);
        
        if ($stmt->execute()) {
            echo json_encode([
                "message" => "تم إضافة الخدمة بنجاح", 
                "success" => true,
                "id" => $serviceId
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Database error: " . $errorInfo[2]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Server error", 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

function handlePut($db, $id, $input) {
    try {
        if(empty($id)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing service ID", "success" => false]);
            return;
        }

        $updateFields = [];
        $updateParams = [];
        
        $allowedFields = ['type', 'description', 'technician', 'date', 'cost', 'status', 'payment_status'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = :$field";
                $updateParams[":$field"] = $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(["message" => "No fields to update", "success" => false]);
            return;
        }
        
        $query = "UPDATE services SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $updateParams[":id"] = $id;
        
        $stmt = $db->prepare($query);
        
        foreach ($updateParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if($stmt->execute()) {
            echo json_encode([
                "message" => "تم تحديث الخدمة بنجاح", 
                "success" => true,
                "affected_rows" => $stmt->rowCount()
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            http_response_code(500);
            echo json_encode([
                "message" => "Database error", 
                "success" => false,
                "error" => $errorInfo[2]
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Server error", 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

function handleDelete($db, $id, $input = []) {
    try {
        // محاولة الحصول على ID من مصادر متعددة
        if (empty($id) && isset($input['id'])) {
            $id = $input['id'];
        }
        
        if(empty($id)) {
            http_response_code(400);
            echo json_encode([
                "message" => "Missing service ID", 
                "success" => false,
                "debug" => [
                    "query_id" => $_GET['id'] ?? 'not_set',
                    "body_id" => $input['id'] ?? 'not_set',
                    "method" => $_SERVER['REQUEST_METHOD']
                ]
            ]);
            return;
        }

        // البدء بمعاملة قاعدة البيانات
        $db->beginTransaction();

        try {
            // 1. حذف جميع الدفعات المرتبطة بالخدمة
            $deletePaymentsQuery = "DELETE FROM payments WHERE service_id = :service_id";
            $deletePaymentsStmt = $db->prepare($deletePaymentsQuery);
            $deletePaymentsStmt->bindParam(":service_id", $id);
            $deletePaymentsStmt->execute();
            
            $deletedPaymentsCount = $deletePaymentsStmt->rowCount();

            // 2. حذف الخدمة نفسها
            $deleteServiceQuery = "DELETE FROM services WHERE id = :id";
            $deleteServiceStmt = $db->prepare($deleteServiceQuery);
            $deleteServiceStmt->bindParam(":id", $id);
            $deleteServiceStmt->execute();
            
            $deletedService = $deleteServiceStmt->rowCount() > 0;
            
            if ($deletedService) {
                // تأكيد المعاملة
                $db->commit();
                
                echo json_encode([
                    "message" => "تم حذف الخدمة والدفعات المرتبطة بها بنجاح", 
                    "success" => true,
                    "deleted_payments" => $deletedPaymentsCount,
                    "deleted_service" => true,
                    "service_id" => $id
                ]);
            } else {
                // التراجع عن المعاملة إذا لم يتم حذف الخدمة
                $db->rollBack();
                
                http_response_code(404);
                echo json_encode([
                    "message" => "الخدمة غير موجودة", 
                    "success" => false,
                    "service_id" => $id
                ]);
            }
            
        } catch (Exception $e) {
            // التراجع عن المعاملة في حالة حدوث خطأ
            $db->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Server error: " . $e->getMessage(), 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}
?>