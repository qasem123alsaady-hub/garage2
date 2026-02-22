<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");
} else {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);
$type = $data['type'] ?? '';
$filters = $data['filters'] ?? [];

try {
    switch ($type) {
        case 'revenue':
            $query = "SELECT DATE(date) as report_date, SUM(cost) as total_cost, SUM(amount_paid) as total_paid 
                      FROM services 
                      WHERE 1=1";
            if (!empty($filters['start_date'])) {
                $query .= " AND date >= :start_date";
            }
            if (!empty($filters['end_date'])) {
                $query .= " AND date <= :end_date";
            }
            $query .= " GROUP BY DATE(date) ORDER BY report_date DESC";
            
            $stmt = $db->prepare($query);
            if (!empty($filters['start_date'])) $stmt->bindParam(':start_date', $filters['start_date']);
            if (!empty($filters['end_date'])) $stmt->bindParam(':end_date', $filters['end_date']);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'customers':
            $query = "SELECT c.*, COUNT(v.id) as vehicle_count 
                      FROM customers c 
                      LEFT JOIN vehicles v ON c.id = v.customer_id 
                      GROUP BY c.id 
                      ORDER BY c.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'vehicles':
            $query = "SELECT v.*, c.name as customer_name, COUNT(s.id) as service_count 
                      FROM vehicles v 
                      JOIN customers c ON v.customer_id = c.id 
                      LEFT JOIN services s ON v.id = s.vehicle_id 
                      GROUP BY v.id 
                      ORDER BY v.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'technicians':
            $query = "SELECT technician, COUNT(*) as service_count, SUM(cost) as total_value 
                      FROM services 
                      WHERE technician IS NOT NULL AND technician != ''
                      GROUP BY technician 
                      ORDER BY total_value DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'unpaid':
            $query = "SELECT s.*, v.make, v.model, v.license_plate, c.name as customer_name, c.phone as customer_phone 
                      FROM services s 
                      JOIN vehicles v ON s.vehicle_id = v.id 
                      JOIN customers c ON v.customer_id = c.id 
                      WHERE s.payment_status != 'paid' 
                      ORDER BY s.date ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        default:
            throw new Exception("Invalid report type");
    }

    echo json_encode([
        "success" => true,
        "data" => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error generating report",
        "error" => $e->getMessage()
    ]);
}
?>
