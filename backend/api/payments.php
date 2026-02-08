<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
    http_response_code(500);
    echo json_encode([
        "message" => "Database connection failed", 
        "success" => false, 
        "error" => $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

log_debug("=== PAYMENTS REQUEST ===");
log_debug("Method: $method");
log_debug("GET Parameters: " . print_r($_GET, true));
log_debug("Input Data: " . print_r($input, true));

switch($method) {
    case 'GET':
        getPayments($db, $_GET);
        break;
    case 'POST':
        createPayment($db, $input);
        break;
    case 'PUT':
        updatePayment($db, $input);
        break;
    case 'DELETE':
        deletePayment($db, $input);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed", "success" => false]);
        break;
}

function getPayments($db, $params) {
    try {
        $service_id = isset($params['service_id']) ? $params['service_id'] : null;
        
        log_debug("GET Payments - service_id: $service_id");
        
        if (!$service_id) {
            http_response_code(400);
            echo json_encode(["message" => "Service ID is required", "success" => false]);
            return;
        }

        $query = "SELECT * FROM payments WHERE service_id = :service_id ORDER BY payment_date DESC, created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":service_id", $service_id);
        $stmt->execute();
        
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        log_debug("Found " . count($payments) . " payments for service $service_id");
        echo json_encode($payments);
        
    } catch (Exception $e) {
        log_debug("GET Payments Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "message" => "Error fetching payments", 
            "success" => false, 
            "error" => $e->getMessage()
        ]);
    }
}

function createPayment($db, $input) {
    try {
        log_debug("CREATE Payment Input: " . print_r($input, true));

        if (!isset($input['service_id']) || !isset($input['amount'])) {
            http_response_code(400);
            echo json_encode(["message" => "Service ID and amount are required", "success" => false]);
            return;
        }

        // جلب بيانات الخدمة أولاً
        $serviceQuery = "SELECT * FROM services WHERE id = :service_id";
        $serviceStmt = $db->prepare($serviceQuery);
        $serviceStmt->bindParam(":service_id", $input['service_id']);
        $serviceStmt->execute();
        $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$service) {
            http_response_code(404);
            echo json_encode(["message" => "Service not found", "success" => false]);
            return;
        }

        // العملية العادية لإضافة دفعة جديدة
        $db->beginTransaction();

        try {
            // 1. حساب المبالغ الحالية من جدول الدفعات (وليس من الخدمة)
            $currentPaymentsQuery = "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE service_id = :service_id";
            $currentPaymentsStmt = $db->prepare($currentPaymentsQuery);
            $currentPaymentsStmt->bindParam(":service_id", $input['service_id']);
            $currentPaymentsStmt->execute();
            $currentPaymentsResult = $currentPaymentsStmt->fetch(PDO::FETCH_ASSOC);
            
            $currentAmountPaid = floatval($currentPaymentsResult['total_paid']);
            $serviceCost = floatval($service['cost']);
            $paymentAmount = floatval($input['amount']);

            log_debug("Current payments total: $currentAmountPaid");
            log_debug("Service cost: $serviceCost");
            log_debug("New payment amount: $paymentAmount");

            // 2. حساب المبالغ الجديدة
            $newAmountPaid = $currentAmountPaid + $paymentAmount;
            $remainingAmount = $serviceCost - $newAmountPaid;

            // التأكد من أن المبالغ منطقية
            if ($paymentAmount <= 0) {
                throw new Exception("Payment amount must be greater than 0");
            }

            if ($newAmountPaid > $serviceCost) {
                throw new Exception("Total paid amount cannot exceed service cost");
            }

            // 3. تحديث حالة الدفع
            if ($remainingAmount <= 0) {
                $paymentStatus = 'paid';
                $remainingAmount = 0;
                $newAmountPaid = $serviceCost; // تأكد من عدم تجاوز التكلفة
            } elseif ($newAmountPaid > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'pending';
            }

            // 4. إضافة الدفعة الجديدة
            $paymentQuery = "INSERT INTO payments SET 
                            id = :id,
                            service_id = :service_id,
                            amount = :amount,
                            payment_method = :payment_method,
                            transaction_id = :transaction_id,
                            notes = :notes,
                            payment_date = :payment_date";

            $paymentStmt = $db->prepare($paymentQuery);
            
            $paymentId = uniqid('pay_');
            $currentDate = date('Y-m-d H:i:s');
            
            $paymentStmt->bindParam(":id", $paymentId);
            $paymentStmt->bindParam(":service_id", $input['service_id']);
            $paymentStmt->bindParam(":amount", $paymentAmount);
            $paymentStmt->bindParam(":payment_method", $input['payment_method']);
            $paymentStmt->bindParam(":transaction_id", $input['transaction_id']);
            $paymentStmt->bindParam(":notes", $input['notes']);
            $paymentStmt->bindParam(":payment_date", $currentDate);

            if (!$paymentStmt->execute()) {
                throw new Exception("Failed to create payment record");
            }

            // 5. تحديث الخدمة بالمبالغ الجديدة
            $updateServiceQuery = "UPDATE services SET 
                                 amount_paid = :amount_paid,
                                 remaining_amount = :remaining_amount,
                                 payment_status = :payment_status,
                                 payment_method = :payment_method,
                                 transaction_id = :transaction_id,
                                 payment_notes = :payment_notes
                                 WHERE id = :service_id";
            
            $updateStmt = $db->prepare($updateServiceQuery);
            $updateStmt->bindParam(":amount_paid", $newAmountPaid);
            $updateStmt->bindParam(":remaining_amount", $remainingAmount);
            $updateStmt->bindParam(":payment_status", $paymentStatus);
            $updateStmt->bindParam(":payment_method", $input['payment_method']);
            $updateStmt->bindParam(":transaction_id", $input['transaction_id']);
            $updateStmt->bindParam(":payment_notes", $input['notes']);
            $updateStmt->bindParam(":service_id", $input['service_id']);
            
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to update service payment details");
            }

            // تأكيد المعاملة
            $db->commit();

            log_debug("Payment created successfully with ID: $paymentId");
            log_debug("New Amount Paid: $newAmountPaid, Remaining: $remainingAmount, Status: $paymentStatus");
            
            echo json_encode([
                "message" => "Payment created successfully", 
                "success" => true,
                "id" => $paymentId,
                "payment_status" => $paymentStatus,
                "new_amount_paid" => $newAmountPaid,
                "remaining_amount" => $remainingAmount
            ]);
            
        } catch (Exception $e) {
            // التراجع عن المعاملة في حالة حدوث خطأ
            $db->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        log_debug("CREATE Payment Exception: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "message" => "Server error: " . $e->getMessage(), 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

function updatePayment($db, $input) {
    try {
        $payment_id = isset($input['payment_id']) ? $input['payment_id'] : '';
        
        log_debug("UPDATE Payment - payment_id: $payment_id");
        log_debug("Update Data: " . print_r($input, true));
        
        if(empty($payment_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing payment ID", "success" => false]);
            return;
        }

        // البدء بمعاملة قاعدة البيانات
        $db->beginTransaction();

        try {
            // 1. جلب بيانات الدفعة الحالية
            $getPaymentQuery = "SELECT * FROM payments WHERE id = :payment_id";
            $getStmt = $db->prepare($getPaymentQuery);
            $getStmt->bindParam(":payment_id", $payment_id);
            $getStmt->execute();
            $currentPayment = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentPayment) {
                throw new Exception("Payment not found");
            }

            $serviceId = $currentPayment['service_id'];
            $oldAmount = floatval($currentPayment['amount']);

            // 2. تحديث الدفعة
            $updateFields = [];
            $updateParams = [];
            
            $allowedFields = ['amount', 'payment_method', 'transaction_id', 'notes', 'payment_date'];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "$field = :$field";
                    $updateParams[":$field"] = $input[$field];
                }
            }
            
            if (empty($updateFields)) {
                throw new Exception("No fields to update");
            }
            
            $updatePaymentQuery = "UPDATE payments SET " . implode(', ', $updateFields) . " WHERE id = :payment_id";
            $updateParams[":payment_id"] = $payment_id;
            
            $updatePaymentStmt = $db->prepare($updatePaymentQuery);
            
            foreach ($updateParams as $key => $value) {
                $updatePaymentStmt->bindValue($key, $value);
            }

            if(!$updatePaymentStmt->execute()) {
                throw new Exception("Failed to update payment");
            }

            // 3. إذا تم تحديث المبلغ، إعادة حساب المبالغ الإجمالية
            $newAmount = isset($input['amount']) ? floatval($input['amount']) : $oldAmount;
            
            if ($newAmount != $oldAmount) {
                log_debug("Payment amount changed from $oldAmount to $newAmount");
                
                // إعادة حساب المبالغ الإجمالية من جدول الدفعات
                $totalPaymentsQuery = "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE service_id = :service_id";
                $totalPaymentsStmt = $db->prepare($totalPaymentsQuery);
                $totalPaymentsStmt->bindParam(":service_id", $serviceId);
                $totalPaymentsStmt->execute();
                $totalPaymentsResult = $totalPaymentsStmt->fetch(PDO::FETCH_ASSOC);
                
                $newAmountPaid = floatval($totalPaymentsResult['total_paid']);

                // جلب تكلفة الخدمة
                $serviceQuery = "SELECT cost FROM services WHERE id = :service_id";
                $serviceStmt = $db->prepare($serviceQuery);
                $serviceStmt->bindParam(":service_id", $serviceId);
                $serviceStmt->execute();
                $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$service) {
                    throw new Exception("Service not found");
                }

                $serviceCost = floatval($service['cost']);
                $remainingAmount = $serviceCost - $newAmountPaid;

                // التأكد من أن المبالغ منطقية
                if ($newAmountPaid < 0) $newAmountPaid = 0;
                if ($remainingAmount < 0) $remainingAmount = 0;

                // تحديث حالة الدفع
                if ($remainingAmount <= 0) {
                    $paymentStatus = 'paid';
                    $remainingAmount = 0;
                    $newAmountPaid = $serviceCost;
                } elseif ($newAmountPaid > 0) {
                    $paymentStatus = 'partial';
                } else {
                    $paymentStatus = 'pending';
                }

                log_debug("Recalculation after payment update:");
                log_debug("Service Cost: $serviceCost");
                log_debug("New Paid Total: $newAmountPaid");
                log_debug("Remaining Amount: $remainingAmount");
                log_debug("Payment Status: $paymentStatus");

                // تحديث الخدمة
                $updateServiceQuery = "UPDATE services SET 
                                      amount_paid = :amount_paid,
                                      remaining_amount = :remaining_amount,
                                      payment_status = :payment_status
                                      WHERE id = :service_id";
                
                $updateServiceStmt = $db->prepare($updateServiceQuery);
                $updateServiceStmt->bindParam(":amount_paid", $newAmountPaid);
                $updateServiceStmt->bindParam(":remaining_amount", $remainingAmount);
                $updateServiceStmt->bindParam(":payment_status", $paymentStatus);
                $updateServiceStmt->bindParam(":service_id", $serviceId);
                
                if (!$updateServiceStmt->execute()) {
                    throw new Exception("Failed to update service");
                }
            }

            // تأكيد المعاملة
            $db->commit();
            
            log_debug("Payment updated successfully: $payment_id");
            
            echo json_encode([
                "message" => "Payment updated successfully", 
                "success" => true,
                "affected_rows" => $updatePaymentStmt->rowCount()
            ]);
            
        } catch (Exception $e) {
            // التراجع عن المعاملة في حالة حدوث خطأ
            $db->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        log_debug("UPDATE Payment Exception: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            "message" => "Server error: " . $e->getMessage(), 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

function deletePayment($db, $input) {
    try {
        $payment_id = isset($input['payment_id']) ? $input['payment_id'] : '';
        log_debug("DELETE Payment - payment_id: $payment_id");
        
        if(empty($payment_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing payment ID", "success" => false]);
            return;
        }

        // البدء بمعاملة قاعدة البيانات
        $db->beginTransaction();

        try {
            // 1. جلب بيانات الدفعة المراد حذفها
            $getPaymentQuery = "SELECT * FROM payments WHERE id = :payment_id";
            $getStmt = $db->prepare($getPaymentQuery);
            $getStmt->bindParam(":payment_id", $payment_id);
            $getStmt->execute();
            $payment = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$payment) {
                throw new Exception("Payment not found");
            }

            $serviceId = $payment['service_id'];
            $deletedAmount = floatval($payment['amount']);

            // 2. حذف الدفعة
            $deleteQuery = "DELETE FROM payments WHERE id = :payment_id";
            $deleteStmt = $db->prepare($deleteQuery);
            $deleteStmt->bindParam(":payment_id", $payment_id);

            if(!$deleteStmt->execute()) {
                throw new Exception("Failed to delete payment");
            }

            // 3. إعادة حساب المبالغ من جدول الدفعات المتبقية
            $remainingPaymentsQuery = "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE service_id = :service_id";
            $remainingPaymentsStmt = $db->prepare($remainingPaymentsQuery);
            $remainingPaymentsStmt->bindParam(":service_id", $serviceId);
            $remainingPaymentsStmt->execute();
            $remainingPaymentsResult = $remainingPaymentsStmt->fetch(PDO::FETCH_ASSOC);
            
            $newAmountPaid = floatval($remainingPaymentsResult['total_paid']);

            // 4. جلب بيانات الخدمة لحساب المبلغ المتبقي
            $serviceQuery = "SELECT cost FROM services WHERE id = :service_id";
            $serviceStmt = $db->prepare($serviceQuery);
            $serviceStmt->bindParam(":service_id", $serviceId);
            $serviceStmt->execute();
            $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                throw new Exception("Service not found");
            }

            $serviceCost = floatval($service['cost']);
            $remainingAmount = $serviceCost - $newAmountPaid;

            // التأكد من أن المبالغ منطقية
            if ($newAmountPaid < 0) $newAmountPaid = 0;
            if ($remainingAmount < 0) $remainingAmount = 0;

            log_debug("Recalculation after deletion:");
            log_debug("Service Cost: $serviceCost");
            log_debug("Deleted Amount: $deletedAmount");
            log_debug("New Paid Total: $newAmountPaid");
            log_debug("Remaining Amount: $remainingAmount");

            // 5. تحديث حالة الدفع
            if ($newAmountPaid <= 0) {
                $paymentStatus = 'pending';
            } elseif ($remainingAmount > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'paid';
                $newAmountPaid = $serviceCost; // تأكد من المطابقة
                $remainingAmount = 0;
            }

            // 6. تحديث الخدمة
            $updateQuery = "UPDATE services SET 
                          amount_paid = :amount_paid,
                          remaining_amount = :remaining_amount,
                          payment_status = :payment_status
                          WHERE id = :service_id";
            
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(":amount_paid", $newAmountPaid);
            $updateStmt->bindParam(":remaining_amount", $remainingAmount);
            $updateStmt->bindParam(":payment_status", $paymentStatus);
            $updateStmt->bindParam(":service_id", $serviceId);
            
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to update service");
            }

            // تأكيد المعاملة
            $db->commit();
            
            log_debug("Payment deleted successfully: $payment_id");
            log_debug("Final - Paid: $newAmountPaid, Remaining: $remainingAmount, Status: $paymentStatus");
            
            echo json_encode([
                "message" => "Payment deleted successfully", 
                "success" => true,
                "deleted_payment_amount" => $deletedAmount,
                "new_amount_paid" => $newAmountPaid,
                "remaining_amount" => $remainingAmount,
                "payment_status" => $paymentStatus
            ]);
            
        } catch (Exception $e) {
            // التراجع عن المعاملة في حالة حدوث خطأ
            $db->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        log_debug("DELETE Payment Exception: " . $e->getMessage());
        
        http_response_code(500);
        echo json_encode([
            "message" => "Server error: " . $e->getMessage(), 
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}
?>