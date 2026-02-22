<?php
/**
 * API Payments - معالجة المدفوعات
 * الإصدار المحدث مع دعم CORS الكامل
 */

// 1. إعداد CORS بشكل ديناميكي وقوي
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");
} else {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// 2. معالجة طلبات OPTIONS (Preflight) فوراً
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. إعداد تصحيح الأخطاء والسجلات
error_reporting(E_ALL);
ini_set('display_errors', 1);

function log_debug($message) {
    $log_file = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message\n";
    @file_put_contents($log_file, $log_message, FILE_APPEND | LOCK_EX);
}

// 4. الاتصال بقاعدة البيانات
include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) throw new Exception("Database connection failed");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
    exit();
}

// 5. معالجة الطلبات
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

log_debug("New Request: $method " . ($_SERVER['REQUEST_URI'] ?? ''));

switch($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        if (isset($input['action']) && $input['action'] === 'bulk') {
            handleBulkPost($db, $input);
        } else {
            handleSinglePost($db, $input);
        }
        break;
    case 'PUT':
        handlePut($db, $input);
        break;
    case 'DELETE':
        handleDelete($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
        break;
}

// --- دوال المعالجة ---

function handleGet($db) {
    try {
        $service_id = $_GET['service_id'] ?? null;
        $vehicle_id = $_GET['vehicle_id'] ?? null;
        
        $query = "SELECT p.*, s.type as service_type, s.vehicle_id 
                  FROM payments p 
                  JOIN services s ON p.service_id = s.id";
        
        $where = [];
        $params = [];

        if ($service_id && $service_id !== 'all') {
            $where[] = "p.service_id = :sid";
            $params[':sid'] = $service_id;
        }
        if ($vehicle_id && $vehicle_id !== 'all') {
            $where[] = "s.vehicle_id = :vid";
            $params[':vid'] = $vehicle_id;
        }

        if (!empty($where)) $query .= " WHERE " . implode(" AND ", $where);
        $query .= " ORDER BY p.payment_date DESC, p.created_at DESC";

        $stmt = $db->prepare($query);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function handleSinglePost($db, $input) {
    try {
        if (!isset($input['service_id'], $input['amount'])) {
            throw new Exception("Missing required fields (service_id, amount)");
        }

        $sid = $input['service_id'];
        $amount = round(floatval($input['amount']), 2);
        if ($amount <= 0) throw new Exception("Amount must be greater than 0");

        $db->beginTransaction();

        // جلب بيانات الخدمة
        $stmt = $db->prepare("SELECT cost, amount_paid FROM services WHERE id = :id");
        $stmt->execute([':id' => $sid]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$service) throw new Exception("Service not found");

        $totalPaid = round(floatval($service['amount_paid']) + $amount, 2);
        $cost = floatval($service['cost']);
        
        if ($totalPaid > ($cost + 0.01)) {
            throw new Exception("Payment exceeds cost (Paid: $totalPaid, Cost: $cost)");
        }

        // إضافة الدفعة
        $pid = uniqid('pay_');
        $pdate = date('Y-m-d H:i:s');
        $method = $input['payment_method'] ?? 'cash';
        $tid = $input['transaction_id'] ?? ($input['transactionId'] ?? '');
        $notes = $input['notes'] ?? '';

        $p_query = "INSERT INTO payments (id, service_id, amount, payment_method, payment_date, transaction_id, notes) 
                    VALUES (:id, :sid, :amt, :meth, :pdate, :tid, :notes)";
        $db->prepare($p_query)->execute([
            ':id' => $pid, ':sid' => $sid, ':amt' => $amount, ':meth' => $method,
            ':pdate' => $pdate, ':tid' => $tid, ':notes' => $notes
        ]);

        // تحديث الخدمة
        $rem = max(0, round($cost - $totalPaid, 2));
        $status = ($rem <= 0) ? 'paid' : 'partial';
        
        $u_query = "UPDATE services SET amount_paid = :paid, remaining_amount = :rem, payment_status = :stat WHERE id = :id";
        $db->prepare($u_query)->execute([':paid' => $totalPaid, ':rem' => $rem, ':stat' => $status, ':id' => $sid]);

        $db->commit();
        echo json_encode(["success" => true, "id" => $pid, "payment_status" => $status, "remaining_amount" => $rem]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function handleBulkPost($db, $input) {
    try {
        if (!isset($input['vehicle_id'], $input['amount'])) {
            throw new Exception("Missing vehicle_id or amount");
        }

        $vid = $input['vehicle_id'];
        $dist_rem = round(floatval($input['amount']), 2);
        if ($dist_rem <= 0) throw new Exception("Amount must be > 0");

        $db->beginTransaction();

        $stmt = $db->prepare("SELECT id, cost, amount_paid FROM services WHERE vehicle_id = :vid AND payment_status != 'paid' ORDER BY date ASC, created_at ASC");
        $stmt->execute([':vid' => $vid]);
        $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($pending as $s) {
            if ($dist_rem <= 0) break;
            
            $s_rem = round(floatval($s['cost']) - floatval($s['amount_paid']), 2);
            if ($s_rem <= 0) continue;

            $to_pay = min($dist_rem, $s_rem);
            $new_paid = round(floatval($s['amount_paid']) + $to_pay, 2);
            $new_rem = round(floatval($s['cost']) - $new_paid, 2);
            $status = ($new_rem <= 0) ? 'paid' : 'partial';

            // إضافة سجل
            $pid = uniqid('pay_');
            $db->prepare("INSERT INTO payments (id, service_id, amount, payment_method, payment_date, notes) VALUES (?,?,?,?,?,?)")
               ->execute([$pid, $s['id'], $to_pay, $input['payment_method'] ?? 'cash', date('Y-m-d H:i:s'), $input['notes'] ?? 'Bulk Payment']);

            // تحديث خدمة
            $db->prepare("UPDATE services SET amount_paid = ?, remaining_amount = ?, payment_status = ? WHERE id = ?")
               ->execute([$new_paid, $new_rem, $status, $s['id']]);

            $dist_rem = round($dist_rem - $to_pay, 2);
        }

        $db->commit();
        echo json_encode(["success" => true, "remaining_from_input" => $dist_rem]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function handlePut($db, $input) {
    try {
        $pid = $input['payment_id'] ?? '';
        if (!$pid) throw new Exception("Missing payment_id");

        $db->beginTransaction();

        $stmt = $db->prepare("SELECT * FROM payments WHERE id = ?");
        $stmt->execute([$pid]);
        $old_p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$old_p) throw new Exception("Payment not found");

        $sid = $old_p['service_id'];
        $fields = [];
        $params = [];
        
        if (isset($input['transactionId']) && !isset($input['transaction_id'])) $input['transaction_id'] = $input['transactionId'];
        
        foreach (['amount', 'payment_method', 'transaction_id', 'notes', 'payment_date'] as $f) {
            if (isset($input[$f])) {
                $fields[] = "$f = ?";
                $params[] = $input[$f];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $pid;
            $db->prepare("UPDATE payments SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }

        // إعادة حساب مبالغ الخدمة
        $stmt = $db->prepare("SELECT ROUND(SUM(amount), 2) as tp FROM payments WHERE service_id = ?");
        $stmt->execute([$sid]);
        $new_tp = floatval($stmt->fetch(PDO::FETCH_ASSOC)['tp'] ?? 0);

        $stmt = $db->prepare("SELECT cost FROM services WHERE id = ?");
        $stmt->execute([$sid]);
        $cost = floatval($stmt->fetch(PDO::FETCH_ASSOC)['cost'] ?? 0);

        $rem = max(0, round($cost - $new_tp, 2));
        $stat = ($rem <= 0) ? 'paid' : ($new_tp > 0 ? 'partial' : 'pending');

        $db->prepare("UPDATE services SET amount_paid = ?, remaining_amount = ?, payment_status = ? WHERE id = ?")
           ->execute([$new_tp, $rem, $stat, $sid]);

        $db->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function handleDelete($db, $input) {
    try {
        $pid = $input['payment_id'] ?? '';
        if (!$pid) throw new Exception("Missing payment_id");

        $db->beginTransaction();

        $stmt = $db->prepare("SELECT service_id FROM payments WHERE id = ?");
        $stmt->execute([$pid]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$p) throw new Exception("Payment not found");

        $sid = $p['service_id'];
        $db->prepare("DELETE FROM payments WHERE id = ?")->execute([$pid]);

        // إعادة حساب
        $stmt = $db->prepare("SELECT ROUND(SUM(amount), 2) as tp FROM payments WHERE service_id = ?");
        $stmt->execute([$sid]);
        $new_tp = floatval($stmt->fetch(PDO::FETCH_ASSOC)['tp'] ?? 0);

        $stmt = $db->prepare("SELECT cost FROM services WHERE id = ?");
        $stmt->execute([$sid]);
        $cost = floatval($stmt->fetch(PDO::FETCH_ASSOC)['cost'] ?? 0);

        $rem = max(0, round($cost - $new_tp, 2));
        $stat = ($rem <= 0) ? 'paid' : ($new_tp > 0 ? 'partial' : 'pending');

        $db->prepare("UPDATE services SET amount_paid = ?, remaining_amount = ?, payment_status = ? WHERE id = ?")
           ->execute([$new_tp, $rem, $stat, $sid]);

        $db->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
