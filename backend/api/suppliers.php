<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        $query = "SELECT * FROM suppliers ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($suppliers);
    } catch (Exception $e) {
        echo json_encode([]);
    }
}

elseif ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!empty($data->name)) {
        try {
            // التأكد من وجود جدول الموردين (إجراء احتياطي)
            $db->exec("CREATE TABLE IF NOT EXISTS suppliers (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                address TEXT,
                products_services TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $query = "INSERT INTO suppliers (name, contact_person, phone, email, address, products_services, created_at) 
                      VALUES (:name, :contact_person, :phone, :email, :address, :products_services, NOW())";
            $stmt = $db->prepare($query);

            $name = $data->name;
            $contact_person = isset($data->contact_person) ? $data->contact_person : '';
            $phone = isset($data->phone) ? $data->phone : '';
            $email = isset($data->email) ? $data->email : '';
            $address = isset($data->address) ? $data->address : '';
            $products_services = isset($data->products_services) ? $data->products_services : '';

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":contact_person", $contact_person);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":address", $address);
            $stmt->bindParam(":products_services", $products_services);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Supplier added successfully", "id" => $db->lastInsertId()]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to add supplier"]);
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
            $query = "UPDATE suppliers SET name = :name, contact_person = :contact_person, phone = :phone, email = :email, address = :address, products_services = :products_services WHERE id = :id";
            $stmt = $db->prepare($query);

            $name = $data->name;
            $contact_person = isset($data->contact_person) ? $data->contact_person : '';
            $phone = isset($data->phone) ? $data->phone : '';
            $email = isset($data->email) ? $data->email : '';
            $address = isset($data->address) ? $data->address : '';
            $products_services = isset($data->products_services) ? $data->products_services : '';
            $id = $data->id;

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":contact_person", $contact_person);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":address", $address);
            $stmt->bindParam(":products_services", $products_services);
            $stmt->bindParam(":id", $id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Supplier updated successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to update supplier"]);
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
            $query = "DELETE FROM suppliers WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Supplier deleted successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to delete supplier"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID is required"]);
    }
}
?>