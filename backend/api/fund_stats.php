<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");
} else {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. حساب إجمالي الإيرادات من جدول الدفعات
    $incomeQuery = "SELECT SUM(amount) as total_income FROM payments";
    $incomeStmt = $db->prepare($incomeQuery);
    $incomeStmt->execute();
    $totalIncome = $incomeStmt->fetch(PDO::FETCH_ASSOC)['total_income'] ?? 0;

    // 2. حساب إجمالي المصروفات من جدول فواتير المشتريات + مدفوعات الموظفين
    $purchaseExpenseQuery = "SELECT SUM(paid_amount) as total_purchases FROM purchase_invoices";
    $purchaseExpenseStmt = $db->prepare($purchaseExpenseQuery);
    $purchaseExpenseStmt->execute();
    $totalPurchases = $purchaseExpenseStmt->fetch(PDO::FETCH_ASSOC)['total_purchases'] ?? 0;

    $employeeExpenseQuery = "SELECT SUM(amount) as total_payroll FROM employee_payments WHERE status = 'paid'";
    $employeeExpenseStmt = $db->prepare($employeeExpenseQuery);
    $employeeExpenseStmt->execute();
    $totalPayroll = $employeeExpenseStmt->fetch(PDO::FETCH_ASSOC)['total_payroll'] ?? 0;

    $totalExpenses = (float)$totalPurchases + (float)$totalPayroll;

    // 3. حساب الصندوق الرئيسي (الصافي)
    $mainFund = (float)$totalIncome - (float)$totalExpenses;

    echo json_encode([
        "success" => true,
        "total_income" => (float)$totalIncome,
        "total_expenses" => (float)$totalExpenses,
        "main_fund" => (float)$mainFund
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error calculating fund stats",
        "error" => $e->getMessage()
    ]);
}
?>
