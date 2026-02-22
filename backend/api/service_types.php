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

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
$id = isset($_GET['id']) ? $_GET['id'] : '';

switch($method) {
    case 'GET':
        handleGet($db, $id);
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

function handleGet($db, $id) {
    try {
        if (!empty($id)) {
            $stmt = $db->prepare("SELECT * FROM service_types WHERE id = :id");
            $stmt->bindParam(':id', $id);
        } else {
            $stmt = $db->prepare("SELECT * FROM service_types ORDER BY name_en ASC");
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage(), "success" => false]);
    }
}

function handlePost($db, $input) {
    try {
        if (!isset($input['name_ar']) || !isset($input['name_en'])) {
            throw new Exception("Missing required fields");
        }
        
        $stmt = $db->prepare("INSERT INTO service_types (name_ar, name_en) VALUES (:name_ar, :name_en)");
        $stmt->bindParam(':name_ar', $input['name_ar']);
        $stmt->bindParam(':name_en', $input['name_en']);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Service type added successfully", "success" => true, "id" => $db->lastInsertId()]);
        } else {
            throw new Exception("Failed to add service type");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage(), "success" => false]);
    }
}

function handlePut($db, $id, $input) {
    try {
        if (empty($id) || !isset($input['name_ar']) || !isset($input['name_en'])) {
            throw new Exception("Missing required fields");
        }
        
        $stmt = $db->prepare("UPDATE service_types SET name_ar = :name_ar, name_en = :name_en WHERE id = :id");
        $stmt->bindParam(':name_ar', $input['name_ar']);
        $stmt->bindParam(':name_en', $input['name_en']);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Service type updated successfully", "success" => true]);
        } else {
            throw new Exception("Failed to update service type");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage(), "success" => false]);
    }
}

function handleDelete($db, $id) {
    try {
        if (empty($id)) {
            throw new Exception("Missing ID");
        }
        
        $stmt = $db->prepare("DELETE FROM service_types WHERE id = :id");
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Service type deleted successfully", "success" => true]);
        } else {
            throw new Exception("Failed to delete service type");
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage(), "success" => false]);
    }
}
?>