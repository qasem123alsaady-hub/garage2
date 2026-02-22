<?php
// Clear any previous output
if (ob_get_level()) ob_end_clean();
ob_start();

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

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

function log_pdf_debug($message) {
    $log_file = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] [PDF] $message\n";
    file_put_contents($log_file, $log_message, FILE_APPEND | LOCK_EX);
}

require_once __DIR__ . '/../../vendor/autoload.php';
include_once __DIR__ . '/../config/database.php';

use Dompdf\Dompdf;
use Dompdf\Options;

class ArabicReshaper {
    private static $map = [
        0x0621 => [0xFE80, 0xFE80, 0xFE80, 0xFE80], 0x0622 => [0xFE81, 0xFE82, 0xFE81, 0xFE82],
        0x0623 => [0xFE83, 0xFE84, 0xFE83, 0xFE84], 0x0624 => [0xFE85, 0xFE86, 0xFE85, 0xFE86],
        0x0625 => [0xFE87, 0xFE88, 0xFE87, 0xFE88], 0x0626 => [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C],
        0x0627 => [0xFE8D, 0xFE8E, 0xFE8D, 0xFE8E], 0x0628 => [0xFE8F, 0xFE90, 0xFE91, 0xFE92],
        0x0629 => [0xFE93, 0xFE94, 0xFE93, 0xFE94], 0x062A => [0xFE95, 0xFE96, 0xFE97, 0xFE98],
        0x062B => [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C], 0x062C => [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0],
        0x062D => [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4], 0x062E => [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8],
        0x062F => [0xFEA9, 0xFEAA, 0xFEA9, 0xFEAA], 0x0630 => [0xFEAB, 0xFEAC, 0xFEAB, 0xFEAC],
        0x0631 => [0xFEAD, 0xFEAE, 0xFEAD, 0xFEAE], 0x0632 => [0xFEAF, 0xFEB0, 0xFEAF, 0xFEB0],
        0x0633 => [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4], 0x0634 => [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
        0x0635 => [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC], 0x0636 => [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0],
        0x0637 => [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4], 0x0638 => [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8],
        0x0639 => [0xFEC9, 0xFECA, 0xFECB, 0xFECC], 0x063A => [0xFECD, 0xFECE, 0xFECF, 0xFED0],
        0x0641 => [0xFED1, 0xFED2, 0xFED3, 0xFED4], 0x0642 => [0xFED5, 0xFED6, 0xFED7, 0xFED8],
        0x0643 => [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC], 0x0644 => [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0],
        0x0645 => [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4], 0x0646 => [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
        0x0647 => [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC], 0x0648 => [0xFEED, 0xFEEE, 0xFEED, 0xFEEE],
        0x0649 => [0xFEEF, 0xFEF0, 0xFEEF, 0xFEF0], 0x064A => [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4],
    ];

    private static function getOrd($char) {
        if (!$char) return 0;
        $k = mb_convert_encoding($char, 'UCS-2BE', 'UTF-8');
        return ord($k[0]) * 256 + ord($k[1]);
    }

    private static function isArabic($char) {
        $ord = self::getOrd($char);
        return ($ord >= 0x0600 && $ord <= 0x06FF);
    }

    private static function canConnectBefore($char) {
        $ord = self::getOrd($char);
        return isset(self::$map[$ord]);
    }

    private static function canConnectAfter($char) {
        $ord = self::getOrd($char);
        if (!isset(self::$map[$ord])) return false;
        return !in_array($ord, [0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062F, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649]);
    }

    public static function reshape($text) {
        if (!$text) return "";
        $chars = mb_str_split($text);
        $reshaped = [];
        $count = count($chars);
        for ($i = 0; $i < $count; $i++) {
            $current = $chars[$i];
            if (!self::isArabic($current)) { $reshaped[] = $current; continue; }
            $prev = ($i > 0) ? $chars[$i - 1] : null;
            $next = ($i < $count - 1) ? $chars[$i + 1] : null;
            $ord = self::getOrd($current);
            $form = 0;
            $connectedBefore = self::isArabic($prev) && self::canConnectAfter($prev);
            $connectedAfter = self::isArabic($next) && self::canConnectBefore($next);
            if ($connectedBefore && $connectedAfter) $form = 2;
            elseif ($connectedBefore) $form = 1;
            elseif ($connectedAfter) $form = 3;
            $reshaped[] = mb_convert_encoding(pack('n', self::$map[$ord][$form]), 'UTF-8', 'UCS-2BE');
        }
        $final = ''; $buffer = [];
        foreach ($reshaped as $char) {
            if (self::isArabic($char) || (trim($char) == "" && !empty($buffer))) { $buffer[] = $char; }
            else {
                if (!empty($buffer)) { $final .= implode('', array_reverse($buffer)); $buffer = []; }
                $final .= $char;
            }
        }
        if (!empty($buffer)) $final .= implode('', array_reverse($buffer));
        return $final;
    }
}

mb_internal_encoding("UTF-8");

$database = new Database();
$db = $database->getConnection();

$lang = $_GET['lang'] ?? 'ar';
$isRtl = ($lang === 'ar');
$type = $_GET['type'] ?? 'services';
$start_date = $_GET['start_date'] ?? date('Y-m-01');
$end_date = $_GET['end_date'] ?? date('Y-m-d');
$customer_id = $_GET['customer_id'] ?? null;
$vehicle_id = $_GET['vehicle_id'] ?? null;
$payment_id = $_GET['payment_id'] ?? null;

$translations = [
    'ar' => [
        'services_report' => 'تقرير الخدمات', 'financial_report' => 'التقرير المالي', 'customer_statement' => 'كشف حساب عميل',
        'vehicle_statement' => 'سجل صيانة مركبة', 'payment_receipt' => 'إيصال استلام نقدية', 'garage_name' => 'مركز صيانة السيارات (GaragePro Manager)',
        'date' => 'التاريخ', 'customer' => 'العميل', 'vehicle' => 'المركبة', 'service_type' => 'نوع الخدمة', 'cost' => 'التكلفة',
        'status' => 'الحالة', 'payment_date' => 'تاريخ الدفع', 'service' => 'الخدمة', 'amount' => 'المبلغ', 'payment_method' => 'طريقة الدفع',
        'paid' => 'المدفوع', 'remaining' => 'المتبقي', 'total_due' => 'إجمالي المستحق', 'total_paid' => 'إجمالي المدفوع',
        'total_remaining' => 'إجمالي المتبقي', 'technician' => 'الفني', 'payment_status' => 'حالة الدفع', 'receipt_no' => 'رقم الإيصال',
        'statement' => 'البيان', 'received_amount' => 'المبلغ المستلم', 'from_date' => 'من تاريخ', 'to_date' => 'إلى تاريخ',
        'generated_on' => 'تم استخراج هذا التقرير بتاريخ', 'unknown' => 'غير معروف', 'license_plate' => 'رقم اللوحة',
        'owner' => 'المالك', 'phone' => 'رقم الهاتف', 'email' => 'البريد الإلكتروني', 'payment_for' => 'دفعة عن خدمة', 'transaction_id' => 'رقم المعاملة',
        'oil_change' => 'تغيير الزيت', 'brake_service' => 'خدمة الفرامل', 'tire_rotation' => 'تدوير الإطارات', 'engine_repair' => 'إصلاح المحرك',
        'other' => 'أخرى', 'pending' => 'قيد الانتظار', 'in-service' => 'قيد الخدمة', 'completed' => 'مكتمل', 'cancelled' => 'ملغي',
        'paid_status' => 'مدفوع', 'partial' => 'جزئي', 'unpaid' => 'غير مدفوع', 'cash' => 'نقدي', 'card' => 'بطاقة', 'transfer' => 'تحويل', 'check' => 'شيك'
    ],
    'en' => [
        'services_report' => 'Services Report', 'financial_report' => 'Financial Report', 'customer_statement' => 'Customer Statement',
        'vehicle_statement' => 'Vehicle Service History', 'payment_receipt' => 'Payment Receipt', 'garage_name' => 'GaragePro Manager',
        'date' => 'Date', 'customer' => 'Customer', 'vehicle' => 'Vehicle', 'service_type' => 'Service Type', 'cost' => 'Cost',
        'status' => 'Status', 'payment_date' => 'Payment Date', 'service' => 'Service', 'amount' => 'Amount', 'payment_method' => 'Payment Method',
        'paid' => 'Paid', 'remaining' => 'Remaining', 'total_due' => 'Total Due', 'total_paid' => 'Total Paid',
        'total_remaining' => 'Total Remaining', 'technician' => 'Technician', 'payment_status' => 'Payment Status', 'receipt_no' => 'Receipt No',
        'statement' => 'Statement', 'received_amount' => 'Received Amount', 'from_date' => 'From Date', 'to_date' => 'To Date',
        'generated_on' => 'Generated on', 'unknown' => 'Unknown', 'license_plate' => 'License Plate', 'owner' => 'Owner',
        'phone' => 'Phone', 'email' => 'Email', 'payment_for' => 'Payment for service', 'transaction_id' => 'Transaction ID',
        'oil_change' => 'Oil Change', 'brake_service' => 'Brake Service', 'tire_rotation' => 'Tire Rotation', 'engine_repair' => 'Engine Repair',
        'other' => 'Other', 'pending' => 'Pending', 'in-service' => 'In Service', 'completed' => 'Completed', 'cancelled' => 'Cancelled',
        'paid_status' => 'Paid', 'partial' => 'Partial', 'unpaid' => 'Unpaid', 'cash' => 'Cash', 'card' => 'Card', 'transfer' => 'Transfer', 'check' => 'Check'
    ]
];

function translateValue($val, $tr) {
    if (!$val) return $val;
    $map = [
        'Oil Change' => 'oil_change', 'تغيير الزيت' => 'oil_change', 'oil_change' => 'oil_change',
        'Brake Service' => 'brake_service', 'خدمة الفرامل' => 'brake_service', 'brake_service' => 'brake_service',
        'Tire Rotation' => 'tire_rotation', 'تدوير الإطارات' => 'tire_rotation', 'tire_rotation' => 'tire_rotation',
        'Engine Repair' => 'engine_repair', 'إصلاح المحرك' => 'engine_repair', 'engine_repair' => 'engine_repair',
        'Other' => 'other', 'أخرى' => 'other', 'other' => 'other',
        'pending' => 'pending', 'in-service' => 'in-service', 'completed' => 'completed', 'cancelled' => 'cancelled',
        'paid' => 'paid_status', 'partial' => 'partial', 'unpaid' => 'unpaid',
        'cash' => 'cash', 'card' => 'card', 'transfer' => 'transfer', 'check' => 'check'
    ];
    $key = $map[$val] ?? $val;
    return $tr[$key] ?? $val;
}

$tr = $translations[$lang];
$report_title = ""; $columns = []; $rows = []; $totals = []; $meta_info = [];

try {
    if ($type == 'services') {
        $report_title = $tr['services_report'];
        $query = "SELECT s.*, c.name as customer_name, v.make, v.model, v.license_plate FROM services s JOIN vehicles v ON s.vehicle_id = v.id JOIN customers c ON v.customer_id = c.id WHERE s.date BETWEEN :start_date AND :end_date ORDER BY s.date DESC";
        $stmt = $db->prepare($query); $stmt->execute([':start_date' => $start_date, ':end_date' => $end_date]);
        $columns = [$tr['date'], $tr['customer'], $tr['vehicle'], $tr['service_type'], $tr['cost'], $tr['status']];
        $total_cost = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rows[] = [$row['date'], $row['customer_name'], $row['make'].' '.$row['model'], translateValue($row['type'], $tr), number_format($row['cost'], 2), translateValue($row['status'], $tr)];
            $total_cost += $row['cost'];
        }
        $totals[$tr['total_due']] = number_format($total_cost, 2);

    } elseif ($type == 'financial') {
        $report_title = $tr['financial_report'];
        $query = "SELECT p.*, s.type as service_type FROM payments p LEFT JOIN services s ON p.service_id = s.id WHERE p.payment_date BETWEEN :start_date AND :end_date ORDER BY p.payment_date DESC";
        $stmt = $db->prepare($query); $stmt->execute([':start_date' => $start_date, ':end_date' => $end_date]);
        $columns = [$tr['payment_date'], $tr['service'], $tr['amount'], $tr['payment_method']];
        $total_income = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rows[] = [$row['payment_date'], translateValue($row['service_type'], $tr) ?? '-', number_format($row['amount'], 2), translateValue($row['payment_method'], $tr)];
            $total_income += $row['amount'];
        }
        $totals[$tr['received_amount']] = number_format($total_income, 2);

    } elseif ($type == 'customer_statement' && $customer_id) {
        $cust_stmt = $db->prepare("SELECT * FROM customers WHERE id = ?"); $cust_stmt->execute([$customer_id]); $customer = $cust_stmt->fetch(PDO::FETCH_ASSOC);
        $report_title = $tr['customer_statement'];
        $meta_info = [$tr['customer'] => $customer['name'], $tr['phone'] => $customer['phone']];
        $query = "SELECT s.*, v.make, v.model FROM services s JOIN vehicles v ON s.vehicle_id = v.id WHERE v.customer_id = :id ORDER BY s.date DESC";
        $stmt = $db->prepare($query); $stmt->execute([':id' => $customer_id]);
        $columns = [$tr['date'], $tr['vehicle'], $tr['service'], $tr['cost'], $tr['paid'], $tr['remaining']];
        $tc=0; $tp=0; $trm=0;
        while($r=$stmt->fetch(PDO::FETCH_ASSOC)) {
            $rows[] = [$r['date'], $r['make'].' '.$r['model'], translateValue($r['type'], $tr), number_format($r['cost'], 2), number_format($r['amount_paid'], 2), number_format($r['remaining_amount'], 2)];
            $tc+=$r['cost']; $tp+=$r['amount_paid']; $trm+=$r['remaining_amount'];
        }
        $totals = [$tr['total_due'] => number_format($tc, 2), $tr['total_paid'] => number_format($tp, 2), $tr['total_remaining'] => number_format($trm, 2)];

    } elseif ($type == 'vehicle_statement' && $vehicle_id) {
        $veh_stmt = $db->prepare("SELECT v.*, c.name as customer_name FROM vehicles v JOIN customers c ON v.customer_id = c.id WHERE v.id = ?"); $veh_stmt->execute([$vehicle_id]); $vehicle = $veh_stmt->fetch(PDO::FETCH_ASSOC);
        $report_title = $tr['vehicle_statement'];
        $meta_info = [$tr['vehicle'] => $vehicle['make'] . ' ' . $vehicle['model'], $tr['license_plate'] => $vehicle['license_plate']];
        $query = "SELECT * FROM services WHERE vehicle_id = :id ORDER BY date DESC";
        $stmt = $db->prepare($query); $stmt->execute([':id' => $vehicle_id]);
        $columns = [$tr['date'], $tr['service_type'], $tr['technician'], $tr['cost'], $tr['payment_status']];
        $tc=0;
        while($r=$stmt->fetch(PDO::FETCH_ASSOC)) {
            $rows[] = [$r['date'], translateValue($r['type'], $tr), $r['technician'], number_format($r['cost'], 2), translateValue($r['payment_status'], $tr)];
            $tc+=$r['cost'];
        }
        $totals[$tr['total_due']] = number_format($tc, 2);

    } elseif ($type == 'payment_receipt' && $payment_id) {
        $report_title = $tr['payment_receipt'];
        $query = "SELECT p.*, s.type as service_type, c.name as customer_name, v.license_plate FROM payments p JOIN services s ON p.service_id = s.id JOIN vehicles v ON s.vehicle_id = v.id JOIN customers c ON v.customer_id = c.id WHERE p.id = :id";
        $stmt = $db->prepare($query); $stmt->execute([':id' => $payment_id]); $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($p) {
            $meta_info = [$tr['receipt_no'] => $p['id'], $tr['date'] => $p['payment_date'], $tr['customer'] => $p['customer_name']];
            $columns = [$tr['statement'], $tr['amount']];
            $rows[] = [$tr['payment_for'].': '.translateValue($p['service_type'], $tr), number_format($p['amount'], 2)];
            $totals = [$tr['received_amount'] => number_format($p['amount'], 2)];
        }
    }
} catch (Exception $e) { ob_end_clean(); die("Query failed"); }

if ($isRtl) {
    $report_title = ArabicReshaper::reshape($report_title);
    $tr['garage_name'] = ArabicReshaper::reshape($tr['garage_name']);
    $tr['generated_on'] = ArabicReshaper::reshape($tr['generated_on']);
    foreach ($columns as &$col) $col = ArabicReshaper::reshape($col);
    foreach ($rows as &$row) { foreach ($row as &$cell) $cell = ArabicReshaper::reshape($cell); }
    $new_t = []; foreach ($totals as $l => $v) $new_t[ArabicReshaper::reshape($l)] = $v; $totals = $new_t;
    $new_m = []; foreach ($meta_info as $l => $v) $new_m[ArabicReshaper::reshape($l)] = ArabicReshaper::reshape($v); $meta_info = $new_m;
}

$html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><style>
body { font-family: "DejaVu Sans", sans-serif; font-size: 10px; color: #333; }
.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th, td { border: 1px solid #999; padding: 6px; text-align: ' . ($isRtl ? 'right' : 'left') . '; }
th { background-color: #eee; }
.meta { margin-bottom: 15px; background: #f9f9f9; padding: 10px; border: 1px solid #ccc; }
.totals { text-align: ' . ($isRtl ? 'left' : 'right') . '; }
.total-box { display: inline-block; border: 1px solid #333; padding: 5px 10px; background: #eee; font-weight: bold; }
</style></head><body style="direction: ltr;">
<div class="header"><h2>' . $tr['garage_name'] . '</h2><h3>' . $report_title . '</h3></div>
<div class="meta">';
foreach ($meta_info as $l => $v) $html .= "<p><strong>$l:</strong> $v</p>";
if (empty($meta_info)) $html .= "<p><strong>" . ($isRtl ? ArabicReshaper::reshape($tr['from_date']) : $tr['from_date']) . ":</strong> $start_date <strong>" . ($isRtl ? ArabicReshaper::reshape($tr['to_date']) : $tr['to_date']) . ":</strong> $end_date</p>";
$html .= '</div><table><thead><tr>';
foreach ($columns as $c) $html .= "<th>$c</th>";
$html .= '</tr></thead><tbody>';
if (empty($rows)) $html .= '<tr><td colspan="' . count($columns) . '" style="text-align:center;">' . ($isRtl ? ArabicReshaper::reshape('لا توجد بيانات متاحة') : 'No data available') . '</td></tr>';
else foreach ($rows as $r) { $html .= '<tr>'; foreach ($r as $c) $html .= "<td>$c</td>"; $html .= '</tr>'; }
$html .= '</tbody></table><div class="totals">';
foreach ($totals as $l => $v) $html .= '<div class="total-box"><span>' . $l . ':</span> ' . $v . '</div> ';
$html .= '</div><div style="margin-top:20px; font-size:8px; text-align:center;">' . $tr['generated_on'] . ' ' . date('Y-m-d H:i:s') . '</div></body></html>';

try {
    $options = new Options();
    $options->set('isRemoteEnabled', true);
    $options->set('defaultFont', 'dejavu sans');
    $options->set('fontDir', __DIR__ . '/../../vendor/dompdf/dompdf/lib/fonts');
    $options->set('fontCache', __DIR__ . '/../../vendor/dompdf/dompdf/lib/fonts');
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    $out = $dompdf->output();
    ob_end_clean();
    header("Content-Type: application/pdf");
    header("Content-Disposition: inline; filename=report.pdf");
    echo $out;
} catch (Exception $e) { ob_end_clean(); http_response_code(500); }
?>
