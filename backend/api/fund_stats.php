<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

    // 2. حساب إجمالي المصروفات من جدول فواتير المشتريات (المبالغ المدفوعة فعلياً)
    $expenseQuery = "SELECT SUM(paid_amount) as total_expenses FROM purchase_invoices";
    $expenseStmt = $db->prepare($expenseQuery);
    $expenseStmt->execute();
    $totalExpenses = $expenseStmt->fetch(PDO::FETCH_ASSOC)['total_expenses'] ?? 0;

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
