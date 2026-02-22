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
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    $totalPurchases = $expenseStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // إجمالي مدفوعات الموظفين
    $employeeExpenseQuery = "SELECT SUM(amount) as total FROM employee_payments WHERE status = 'paid'";
    $employeeExpenseStmt = $db->prepare($employeeExpenseQuery);
    $employeeExpenseStmt->execute();
    $totalPayroll = $employeeExpenseStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    $totalExpenses = (float)$totalPurchases + (float)$totalPayroll;

    // إجمالي الإيرادات المعلقة (باستثناء الملغاة)
    $pendingQuery = "SELECT SUM(remaining_amount) as total FROM services WHERE status != 'cancelled'";
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
