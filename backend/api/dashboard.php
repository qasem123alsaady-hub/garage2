<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // إحصائيات العملاء
    $customerCountQuery = "SELECT COUNT(*) as count FROM customers";
    $customerStmt = $db->prepare($customerCountQuery);
    $customerStmt->execute();
    $customerCount = $customerStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // إحصائيات المركبات
    $vehicleCountQuery = "SELECT COUNT(*) as count FROM vehicles";
    $vehicleStmt = $db->prepare($vehicleCountQuery);
    $vehicleStmt->execute();
    $vehicleCount = $vehicleStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // إحصائيات الخدمات النشطة
    $activeServicesQuery = "SELECT COUNT(*) as count FROM services WHERE status IN ('pending', 'in-progress')";
    $servicesStmt = $db->prepare($activeServicesQuery);
    $servicesStmt->execute();
    $activeServices = $servicesStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // إجمالي الإيرادات (من المدفوعات الفعلية)
    $revenueQuery = "SELECT SUM(amount) as total FROM payments";
    $revenueStmt = $db->prepare($revenueQuery);
    $revenueStmt->execute();
    $totalRevenue = $revenueStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // إجمالي المصروفات
    $expenseQuery = "SELECT SUM(paid_amount) as total FROM purchase_invoices";
    $expenseStmt = $db->prepare($expenseQuery);
    $expenseStmt->execute();
    $totalExpenses = $expenseStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // إجمالي الإيرادات المعلقة
    $pendingQuery = "SELECT SUM(remaining_amount) as total FROM services";
    $pendingStmt = $db->prepare($pendingQuery);
    $pendingStmt->execute();
    $totalPending = $pendingStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    $mainFund = (float)$totalRevenue - (float)$totalExpenses;

    // الخدمات الأخيرة
    $recentServicesQuery = "SELECT s.*, v.make, v.model, v.license_plate 
                           FROM services s 
                           JOIN vehicles v ON s.vehicle_id = v.id 
                           ORDER BY s.created_at DESC LIMIT 5";
    $recentStmt = $db->prepare($recentServicesQuery);
    $recentStmt->execute();
    $recentServices = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "stats" => [
            "total_customers" => (int)$customerCount,
            "total_vehicles" => (int)$vehicleCount,
            "active_services" => (int)$activeServices,
            "total_revenue" => (float)$totalRevenue,
            "total_expenses" => (float)$totalExpenses,
            "total_pending" => (float)$totalPending,
            "main_fund" => (float)$mainFund
        ],
        "recent_services" => $recentServices
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching dashboard data",
        "error" => $e->getMessage()
    ]);
}
?>
