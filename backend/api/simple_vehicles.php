<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';

class Vehicle {
    private $conn;
    private $table_name = "vehicles";

    public function __construct($db) {
        $this->conn = $db;
    }

    // الحصول على جميع المركبات
    public function getVehicles() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $vehicles = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $vehicles[] = $row;
        }
        
        return $vehicles;
    }

    // إضافة مركبة جديدة
    public function addVehicle($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                 (make, model, year, license_plate, status, customer_id) 
                 VALUES (:make, :model, :year, :license_plate, :status, :customer_id)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':make', $data->make);
        $stmt->bindParam(':model', $data->model);
        $stmt->bindParam(':year', $data->year);
        $stmt->bindParam(':license_plate', $data->license_plate);
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':customer_id', $data->customer_id);
        
        if ($stmt->execute()) {
            return array("success" => true, "message" => "تم إضافة المركبة بنجاح", "id" => $this->conn->lastInsertId());
        } else {
            return array("success" => false, "message" => "حدث خطأ أثناء إضافة المركبة");
        }
    }
}

// معالجة الطلبات
$method = $_SERVER['REQUEST_METHOD'];
$database = new Database();
$db = $database->getConnection();
$vehicle = new Vehicle($db);

if ($method == 'GET') {
    echo json_encode($vehicle->getVehicles());
} else if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    echo json_encode($vehicle->addVehicle($data));
}
?>