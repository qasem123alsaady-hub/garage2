<?php
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");
} else {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

header("Content-Type: application/json; charset=UTF-8");

// إظهار جميع الأخطاء
error_reporting(E_ALL);
ini_set('display_errors', 1);

// معالجة طلبات OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// دالة آمنة للتصحيح
function log_debug($message) {
    $log_file = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message\n";
    
    if (is_writable(__DIR__) || (file_exists($log_file) && is_writable($log_file))) {
        file_put_contents($log_file, $log_message, FILE_APPEND | LOCK_EX);
    } else {
        error_log($log_message);
    }
}

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("فشل الاتصال بقاعدة البيانات");
    }
    
} catch (Exception $e) {
    http_response_code(500 );
    echo json_encode([
        "message" => "Database connection failed", 
        "success" => false, 
        "error" => $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

log_debug("=== REVENUE REQUEST ===");
log_debug("Method: $method");
log_debug("Action: $action");
log_debug("GET Parameters: " . print_r($_GET, true));
log_debug("Input Data: " . print_r($input, true));

if ($action == 'get_stats') {
    getRevenueStats($db);
} elseif ($action == 'get_by_date_range') {
    getRevenueByDateRange($db, $_GET);
} elseif ($method == 'POST' && $action == 'generate_report') {
    generateRevenueReport($db, $input);
} else {
    http_response_code(400 );
    echo json_encode(["message" => "Invalid action", "success" => false]);
}

/**
 * دالة جديدة لحساب الإيرادات المعلقة (الخدمات المكتملة غير مدفوعة بالكامل)
 */
function getPendingRevenue($db) {
    try {
        // استعلام لجلب الخدمات المكتملة التي لم يتم دفعها بالكامل
        $query = "
            SELECT 
                s.id as service_id,
                s.total_cost,
                COALESCE(SUM(p.amount), 0) as total_paid,
                (s.total_cost - COALESCE(SUM(p.amount), 0)) as pending_amount,
                c.name as customer_name,
                v.make,
                v.model
            FROM services s
            LEFT JOIN payments p ON s.id = p.service_id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE s.status = 'completed' -- تأكد من أن هذه هي الحالة الصحيحة للخدمات المكتملة
            GROUP BY s.id, s.total_cost, c.name, v.make, v.model
            HAVING pending_amount > 0
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $pendingServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // إضافة اسم المركبة الكامل
        foreach ($pendingServices as &$service) {
            $service['vehicle_name'] = $service['make'] . ' ' . $service['model'];
        }
        
        // حساب إجمالي الإيرادات المعلقة
        $totalPending = array_sum(array_column($pendingServices, 'pending_amount'));
        
        return [
            'total_pending' => floatval($totalPending),
            'services' => $pendingServices
        ];
        
    } catch (Exception $e) {
        log_debug("Error in getPendingRevenue: " . $e->getMessage());
        return null; // إرجاع null في حالة حدوث خطأ
    }
}

function getRevenueStats($db) {
    try {
        $today = date('Y-m-d');
        $weekStart = date('Y-m-d', strtotime('monday this week'));
        $weekEnd = date('Y-m-d', strtotime('sunday this week'));
        $monthStart = date('Y-m-01');
        $monthEnd = date('Y-m-t');
        $yearStart = date('Y-01-01');
        $yearEnd = date('Y-12-31');
        
        // الإيرادات اليومية
        $dailyQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) = :today";
        $dailyStmt = $db->prepare($dailyQuery);
        $dailyStmt->bindParam(":today", $today);
        $dailyStmt->execute();
        $dailyRevenue = floatval($dailyStmt->fetch(PDO::FETCH_ASSOC)['total']);
        
        // الإيرادات الأسبوعية
        $weeklyQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) BETWEEN :weekStart AND :weekEnd";
        $weeklyStmt = $db->prepare($weeklyQuery);
        $weeklyStmt->bindParam(":weekStart", $weekStart);
        $weeklyStmt->bindParam(":weekEnd", $weekEnd);
        $weeklyStmt->execute();
        $weeklyRevenue = floatval($weeklyStmt->fetch(PDO::FETCH_ASSOC)['total']);
        
        // الإيرادات الشهرية
        $monthlyQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) BETWEEN :monthStart AND :monthEnd";
        $monthlyStmt = $db->prepare($monthlyQuery);
        $monthlyStmt->bindParam(":monthStart", $monthStart);
        $monthlyStmt->bindParam(":monthEnd", $monthEnd);
        $monthlyStmt->execute();
        $monthlyRevenue = floatval($monthlyStmt->fetch(PDO::FETCH_ASSOC)['total']);
        
        // الإيرادات السنوية
        $yearlyQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) BETWEEN :yearStart AND :yearEnd";
        $yearlyStmt = $db->prepare($yearlyQuery);
        $yearlyStmt->bindParam(":yearStart", $yearStart);
        $yearlyStmt->bindParam(":yearEnd", $yearEnd);
        $yearlyStmt->execute();
        $yearlyRevenue = floatval($yearlyStmt->fetch(PDO::FETCH_ASSOC)['total']);
        
        // المدفوعات اليوم
        $todayPaymentsQuery = "
            SELECT p.*, s.type as service_type, v.make, v.model, c.name as customer_name 
            FROM payments p 
            LEFT JOIN services s ON p.service_id = s.id 
            LEFT JOIN vehicles v ON s.vehicle_id = v.id 
            LEFT JOIN customers c ON v.customer_id = c.id 
            WHERE DATE(p.payment_date) = :today 
            ORDER BY p.payment_date DESC 
            LIMIT 10
        ";
        $todayPaymentsStmt = $db->prepare($todayPaymentsQuery);
        $todayPaymentsStmt->bindParam(":today", $today);
        $todayPaymentsStmt->execute();
        $todayPayments = $todayPaymentsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($todayPayments as &$payment) {
            $payment['vehicle_name'] = $payment['make'] . ' ' . $payment['model'];
        }
        
        // ** دمج الإيرادات المعلقة **
        $pendingRevenueData = getPendingRevenue($db);
        
        $stats = [
            'daily' => $dailyRevenue,
            'weekly' => $weeklyRevenue,
            'monthly' => $monthlyRevenue,
            'yearly' => $yearlyRevenue,
            'pending' => $pendingRevenueData ? $pendingRevenueData['total_pending'] : 0, // الإجمالي المعلق
            'pending_details' => $pendingRevenueData ? $pendingRevenueData['services'] : [], // تفاصيل الخدمات المعلقة
            'todayPayments' => $todayPayments
        ];
        
        echo json_encode([
            "success" => true,
            "stats" => $stats
        ]);
        
    } catch (Exception $e) {
        log_debug("GET Revenue Stats Error: " . $e->getMessage());
        http_response_code(500 );
        echo json_encode([
            "message" => "Error fetching revenue stats", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}

function getRevenueByDateRange($db, $params) {
    try {
        $startDate = isset($params['start_date']) ? $params['start_date'] : date('Y-m-01');
        $endDate = isset($params['end_date']) ? $params['end_date'] : date('Y-m-d');
        
        log_debug("Getting revenue from $startDate to $endDate");
        
        // استعلام الإيرادات المدفوعة
        $query = "
            SELECT 
                DATE(p.payment_date) as payment_day,
                COUNT(p.id) as payment_count,
                SUM(p.amount) as total_amount
            FROM payments p
            WHERE DATE(p.payment_date) BETWEEN :startDate AND :endDate
            GROUP BY DATE(p.payment_date)
            ORDER BY payment_day DESC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":startDate", $startDate);
        $stmt->bindParam(":endDate", $endDate);
        $stmt->execute();
        $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // تفاصيل المدفوعات
        $dailyDetailsQuery = "
            SELECT p.*, s.type as service_type, v.make, v.model, c.name as customer_name, c.phone as customer_phone
            FROM payments p
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE DATE(p.payment_date) BETWEEN :startDate AND :endDate
            ORDER BY p.payment_date DESC
        ";
        
        $dailyDetailsStmt = $db->prepare($dailyDetailsQuery);
        $dailyDetailsStmt->bindParam(":startDate", $startDate);
        $dailyDetailsStmt->bindParam(":endDate", $endDate);
        $dailyDetailsStmt->execute();
        $dailyDetails = $dailyDetailsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($dailyDetails as &$detail) {
            $detail['vehicle_name'] = $detail['make'] . ' ' . $detail['model'];
        }
        
        // ** دمج الإيرادات المعلقة **
        $pendingRevenueData = getPendingRevenue($db);
        
        $result = [
            'summary' => $revenueData,
            'details' => $dailyDetails,
            'total_revenue' => array_sum(array_column($revenueData, 'total_amount')),
            'total_payments' => array_sum(array_column($revenueData, 'payment_count')),
            'pending_revenue' => $pendingRevenueData ? $pendingRevenueData['total_pending'] : 0,
            'pending_details' => $pendingRevenueData ? $pendingRevenueData['services'] : []
        ];
        
        echo json_encode([
            "success" => true,
            "revenue_data" => $result
        ]);
        
    } catch (Exception $e) {
        log_debug("GET Revenue by Date Range Error: " . $e->getMessage());
        http_response_code(500 );
        echo json_encode([
            "message" => "Error fetching revenue data", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}

function generateRevenueReport($db, $input) {
    try {
        $startDate = isset($input['start_date']) ? $input['start_date'] : date('Y-m-01');
        $endDate = isset($input['end_date']) ? $input['end_date'] : date('Y-m-d');
        
        log_debug("Generating revenue report from $startDate to $endDate");
        
        // استعلام الإيرادات المدفوعة
        $query = "
            SELECT 
                DATE(p.payment_date) as payment_day,
                COUNT(p.id) as payment_count,
                SUM(p.amount) as total_amount
            FROM payments p
            WHERE DATE(p.payment_date) BETWEEN :startDate AND :endDate
            GROUP BY DATE(p.payment_date)
            ORDER BY payment_day DESC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":startDate", $startDate);
        $stmt->bindParam(":endDate", $endDate);
        $stmt->execute();
        $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // تفاصيل المدفوعات
        $dailyDetailsQuery = "
            SELECT p.*, s.type as service_type, v.make, v.model, c.name as customer_name, c.phone as customer_phone
            FROM payments p
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE DATE(p.payment_date) BETWEEN :startDate AND :endDate
            ORDER BY p.payment_date DESC
        ";
        
        $dailyDetailsStmt = $db->prepare($dailyDetailsQuery);
        $dailyDetailsStmt->bindParam(":startDate", $startDate);
        $dailyDetailsStmt->bindParam(":endDate", $endDate);
        $dailyDetailsStmt->execute();
        $dailyDetails = $dailyDetailsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($dailyDetails as &$detail) {
            $detail['vehicle_name'] = $detail['make'] . ' ' . $detail['model'];
        }
        
        // إحصائيات طرق الدفع
        $statsQuery = "
            SELECT p.payment_method, COUNT(p.id) as count, SUM(p.amount) as total
            FROM payments p
            WHERE DATE(p.payment_date) BETWEEN :startDate AND :endDate
            GROUP BY p.payment_method
        ";
        
        $statsStmt = $db->prepare($statsQuery);
        $statsStmt->bindParam(":startDate", $startDate);
        $statsStmt->bindParam(":endDate", $endDate);
        $statsStmt->execute();
        $paymentMethodsStats = $statsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // ** دمج الإيرادات المعلقة **
        $pendingRevenueData = getPendingRevenue($db);
        
        $result = [
            'summary' => $revenueData,
            'details' => $dailyDetails,
            'payment_methods_stats' => $paymentMethodsStats,
            'total_revenue' => array_sum(array_column($revenueData, 'total_amount')),
            'total_payments' => array_sum(array_column($revenueData, 'payment_count')),
            'pending_revenue' => $pendingRevenueData ? $pendingRevenueData['total_pending'] : 0,
            'pending_details' => $pendingRevenueData ? $pendingRevenueData['services'] : [],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'report_generated_at' => date('Y-m-d H:i:s')
        ];
        
        echo json_encode([
            "success" => true,
            "report" => $result,
            "message" => "تم إنشاء التقرير بنجاح"
        ]);
        
    } catch (Exception $e) {
        log_debug("Generate Revenue Report Error: " . $e->getMessage());
        http_response_code(500 );
        echo json_encode([
            "message" => "Error generating revenue report", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}
?>
