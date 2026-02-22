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
        handleDelete($db, $_GET);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed", "success" => false]);
        break;
}

function handleGet($db, $params) {
    try {
        if (isset($params['id'])) {
            $query = "SELECT * FROM vehicles WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $params['id']);
        } else if (isset($params['customer_id'])) {
            $query = "SELECT * FROM vehicles WHERE customer_id = :customer_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":customer_id", $params['customer_id']);
        } else {
            $query = "SELECT * FROM vehicles ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($vehicles);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error fetching vehicles", "success" => false, "error" => $e->getMessage()]);
    }
}

function handlePost($db, $input) {
    try {
        if (!isset($input['make']) || !isset($input['model']) || !isset($input['license_plate'])) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields", "success" => false]);
            return;
        }

        $query = "INSERT INTO vehicles SET id = :id, make = :make, model = :model, year = :year, license_plate = :license_plate, customer_id = :customer_id, status = :status";
        $stmt = $db->prepare($query);
        
        $id = 'v' . time() . rand(1000, 9999);
        $status = $input['status'] ?? 'pending';
        
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":make", $input['make']);
        $stmt->bindParam(":model", $input['model']);
        $stmt->bindParam(":year", $input['year']);
        $stmt->bindParam(":license_plate", $input['license_plate']);
        $stmt->bindParam(":customer_id", $input['customer_id']);
        $stmt->bindParam(":status", $status);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Vehicle created successfully", "success" => true, "id" => $id]);
        } else {
            throw new Exception("Failed to create vehicle");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}

function handlePut($db, $input) {
    try {
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Vehicle ID is required", "success" => false]);
            return;
        }

        $query = "UPDATE vehicles SET make = :make, model = :model, year = :year, license_plate = :license_plate, customer_id = :customer_id, status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":id", $input['id']);
        $stmt->bindParam(":make", $input['make']);
        $stmt->bindParam(":model", $input['model']);
        $stmt->bindParam(":year", $input['year']);
        $stmt->bindParam(":license_plate", $input['license_plate']);
        $stmt->bindParam(":customer_id", $input['customer_id']);
        $stmt->bindParam(":status", $input['status']);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Vehicle updated successfully", "success" => true]);
        } else {
            throw new Exception("Failed to update vehicle");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}

function handleDelete($db, $params) {
    try {
        $id = $params['id'] ?? '';
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["message" => "Vehicle ID is required", "success" => false]);
            return;
        }

        $query = "DELETE FROM vehicles WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Vehicle deleted successfully", "success" => true]);
        } else {
            throw new Exception("Failed to delete vehicle");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server error", "success" => false, "error" => $e->getMessage()]);
    }
}
