<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// الحصول على البيانات المدخلة
$input = json_decode(file_get_contents("php://input"), true);

// الحصول على معرف من query string إذا كان موجوداً
$id = isset($_GET['id']) ? $_GET['id'] : '';

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
        handleDelete($db, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed", "success" => false]);
        break;
}

function handleGet($db, $params) {
    try {
        // بناء الاستعلام بناءً على المعلمات
        if (isset($params['customer_id'])) {
            $query = "SELECT * FROM vehicles WHERE customer_id = :customer_id ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":customer_id", $params['customer_id']);
        } else if (isset($params['id'])) {
            $query = "SELECT * FROM vehicles WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $params['id']);
        } else {
            $query = "SELECT * FROM vehicles ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($vehicles);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "message" => "Error fetching vehicles", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}

function handlePost($db, $input) {
    try {
        // التحقق من البيانات المطلوبة
        $required_fields = ['make', 'model', 'license_plate', 'customer_id'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(["message" => "Missing required field: $field", "success" => false]);
                return;
            }
        }

        // التحقق من عدم وجود مركبة بنفس اللوحة
        $checkQuery = "SELECT id FROM vehicles WHERE license_plate = :license_plate";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":license_plate", $input['license_plate']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode([
                "message" => "رقم اللوحة مسجل مسبقاً", 
                "success" => false,
                "error_code" => "LICENSE_PLATE_EXISTS"
            ]);
            return;
        }

        // إضافة المركبة
        $query = "INSERT INTO vehicles (id, make, model, year, license_plate, status, customer_id, created_at) 
                  VALUES (:id, :make, :model, :year, :license_plate, :status, :customer_id, NOW())";
        $stmt = $db->prepare($query);
        
        $vehicleId = 'v' . time() . rand(1000, 9999);
        $year = $input['year'] ?? date('Y');
        $status = $input['status'] ?? 'pending';
        
        $stmt->bindParam(":id", $vehicleId);
        $stmt->bindParam(":make", $input['make']);
        $stmt->bindParam(":model", $input['model']);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":license_plate", $input['license_plate']);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":customer_id", $input['customer_id']);
        
        if ($stmt->execute()) {
            // جلب بيانات المركبة المضافة
            $getQuery = "SELECT * FROM vehicles WHERE id = :id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(":id", $vehicleId);
            $getStmt->execute();
            $vehicle = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                "message" => "تم إضافة المركبة بنجاح", 
                "success" => true,
                "id" => $vehicleId,
                "vehicle" => $vehicle
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
            echo json_encode(["message" => "Missing vehicle ID", "success" => false]);
            return;
        }

        $updateFields = [];
        $updateParams = [];
        
        $allowedFields = ['make', 'model', 'year', 'license_plate', 'status', 'customer_id'];
        
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
        
        $query = "UPDATE vehicles SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $updateParams[":id"] = $id;
        
        $stmt = $db->prepare($query);
        
        foreach ($updateParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if($stmt->execute()) {
            echo json_encode([
                "message" => "تم تحديث بيانات المركبة بنجاح", 
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

function handleDelete($db, $id) {
    try {
        if(empty($id)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing vehicle ID", "success" => false]);
            return;
        }

        // البدء بمعاملة قاعدة البيانات
        $db->beginTransaction();

        try {
            // 1. حذف جميع الخدمات المرتبطة بالمركبة
            $deleteServicesQuery = "DELETE FROM services WHERE vehicle_id = :vehicle_id";
            $deleteServicesStmt = $db->prepare($deleteServicesQuery);
            $deleteServicesStmt->bindParam(":vehicle_id", $id);
            $deleteServicesStmt->execute();
            
            $deletedServicesCount = $deleteServicesStmt->rowCount();

            // 2. حذف المركبة نفسها
            $deleteVehicleQuery = "DELETE FROM vehicles WHERE id = :id";
            $deleteVehicleStmt = $db->prepare($deleteVehicleQuery);
            $deleteVehicleStmt->bindParam(":id", $id);
            $deleteVehicleStmt->execute();
            
            $deletedVehicle = $deleteVehicleStmt->rowCount() > 0;
            
            if ($deletedVehicle) {
                // تأكيد المعاملة
                $db->commit();
                
                echo json_encode([
                    "message" => "تم حذف المركبة والخدمات المرتبطة بها بنجاح", 
                    "success" => true,
                    "deleted_services" => $deletedServicesCount,
                    "deleted_vehicle" => true
                ]);
            } else {
                // التراجع عن المعاملة إذا لم يتم حذف المركبة
                $db->rollBack();
                
                http_response_code(404);
                echo json_encode([
                    "message" => "المركبة غير موجودة", 
                    "success" => false
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