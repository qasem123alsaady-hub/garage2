<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

// منع عرض أخطاء PHP في الاستجابة لضمان وصول JSON صالح دائماً
ini_set('display_errors', 0);
error_reporting(E_ALL);

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        $query = "SELECT * FROM employees ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($employees);
    } catch (Exception $e) {
        // في حال لم يكن الجدول موجوداً بعد
        echo json_encode([]);
    }
}

elseif ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
        exit();
    }

    if (!empty($data->name)) {
        try {
            $query = "INSERT INTO employees (name, position, phone, email, salary, hire_date, status, created_at) VALUES (:name, :position, :phone, :email, :salary, :hire_date, :status, NOW())";
            $stmt = $db->prepare($query);

            // استخدام متغيرات وسيطة لتجنب مشاكل التمرير بالمرجع والتحقق من القيم
            $name = $data->name;
            $position = isset($data->position) ? $data->position : '';
            $phone = isset($data->phone) ? $data->phone : '';
            $email = isset($data->email) ? $data->email : '';
            $salary = isset($data->salary) ? $data->salary : 0;
            $hire_date = isset($data->hire_date) ? $data->hire_date : date('Y-m-d');
            $status = isset($data->status) ? $data->status : 'active';

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":position", $position);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":salary", $salary);
            $stmt->bindParam(":hire_date", $hire_date);
            $stmt->bindParam(":status", $status);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Employee added successfully", "id" => $db->lastInsertId()]);
            } else {
                $errorInfo = $stmt->errorInfo();
                echo json_encode(["success" => false, "message" => "Unable to add employee: " . $errorInfo[2]]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
}

elseif ($method == 'PUT') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!empty($data->id)) {
        try {
            $query = "UPDATE employees SET name = :name, position = :position, phone = :phone, email = :email, salary = :salary, hire_date = :hire_date, status = :status WHERE id = :id";
            $stmt = $db->prepare($query);

            $name = strip_tags($data->name);
            $position = isset($data->position) ? strip_tags($data->position) : '';
            $phone = isset($data->phone) ? strip_tags($data->phone) : '';
            $email = isset($data->email) ? strip_tags($data->email) : '';
            $salary = !empty($data->salary) ? floatval($data->salary) : 0;
            $hire_date = !empty($data->hire_date) ? $data->hire_date : null;
            $status = !empty($data->status) ? $data->status : 'active';
            $id = $data->id;

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":position", $position);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":salary", $salary);
            $stmt->bindParam(":hire_date", $hire_date);
            $stmt->bindParam(":status", $status);
            $stmt->bindParam(":id", $id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Employee updated successfully"]);
            } else {
                $errorInfo = $stmt->errorInfo();
                echo json_encode(["success" => false, "message" => "Unable to update employee: " . $errorInfo[2]]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID is required"]);
    }
}

elseif ($method == 'DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!empty($data->id)) {
        try {
            $query = "DELETE FROM employees WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Employee deleted successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to delete employee"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID is required"]);
    }
}
?>