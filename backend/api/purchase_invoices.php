<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

if ($method == 'GET') {
    $query = "SELECT * FROM purchase_invoices ORDER BY invoice_date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($invoices);
}

elseif ($method == 'POST') {
    // Handle both single and multiple invoices
    $invoices = (isset($input[0]) && is_array($input[0])) ? $input : [$input];
    $all_success = true;
    $last_id = null;

    $db->beginTransaction();

    foreach ($invoices as $invoice) {
        if (empty($invoice['supplier_id']) || !isset($invoice['amount'])) {
            $all_success = false;
            break;
        }

        $query = "INSERT INTO purchase_invoices (supplier_id, invoice_number, invoice_date, amount, items, paid_amount, status, created_at) 
                  VALUES (:supplier_id, :invoice_number, :invoice_date, :amount, :items, 0, 'pending', NOW())";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":supplier_id", $invoice['supplier_id']);
        $stmt->bindParam(":invoice_number", $invoice['invoice_number']);
        $stmt->bindParam(":invoice_date", $invoice['invoice_date']);
        $stmt->bindParam(":amount", $invoice['amount']);
        $stmt->bindParam(":items", $invoice['items']);

        if (!$stmt->execute()) {
            $all_success = false;
            break;
        }
        $last_id = $db->lastInsertId();
    }

    if ($all_success) {
        $db->commit();
        $message = count($invoices) > 1 ? "Invoices added successfully" : "Invoice added successfully";
        $response = ["success" => true, "message" => $message];
        if (count($invoices) === 1) {
            $response['id'] = $last_id;
        }
        echo json_encode($response);
    } else {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Unable to add invoice(s). Check data."]);
    }
}

elseif ($method == 'PUT') {
    // هذا الجزء يعالج التحديث العادي والدفع
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID is required"]);
        exit();
    }

    // إذا كان الطلب لتسديد دفعة
    if (isset($input['payment_amount'])) {
        $id = $input['id'];
        $payment_amount = floatval($input['payment_amount']);
        
        // جلب الفاتورة الحالية
        $stmt = $db->prepare("SELECT amount, paid_amount FROM purchase_invoices WHERE id = :id");
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            echo json_encode(["success" => false, "message" => "Invoice not found"]);
            exit();
        }

        $new_paid_amount = floatval($invoice['paid_amount']) + $payment_amount;
        $total_amount = floatval($invoice['amount']);
        
        // تحديد الحالة الجديدة
        $status = 'pending';
        if ($new_paid_amount >= $total_amount) {
            $status = 'paid';
            $new_paid_amount = $total_amount; // منع تجاوز المبلغ الإجمالي
        } elseif ($new_paid_amount > 0) {
            $status = 'partial';
        }

        $query = "UPDATE purchase_invoices SET paid_amount = :paid_amount, status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":paid_amount", $new_paid_amount);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Payment recorded successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Unable to record payment"]);
        }
    } 
    // تحديث بيانات الفاتورة العادية
    else {
        // استخدام التحديث الديناميكي لتجنب الأخطاء عند إرسال بيانات جزئية
        $fields = ['supplier_id', 'invoice_number', 'invoice_date', 'amount', 'items', 'paid_amount', 'status'];
        $updates = [];
        $params = [':id' => $input['id']];

        // جلب البيانات الحالية لحساب الحالة إذا لزم الأمر
        if (isset($input['amount']) || isset($input['paid_amount'])) {
            $stmt = $db->prepare("SELECT amount, paid_amount FROM purchase_invoices WHERE id = :id");
            $stmt->execute([':id' => $input['id']]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($current) {
                $amount = isset($input['amount']) ? floatval($input['amount']) : floatval($current['amount']);
                $paid = isset($input['paid_amount']) ? floatval($input['paid_amount']) : floatval($current['paid_amount']);
                
                $status = 'pending';
                if ($paid >= $amount) {
                    $status = 'paid';
                } elseif ($paid > 0) {
                    $status = 'partial';
                }
                
                // تحديث الحالة تلقائياً
                $input['status'] = $status;
            }
        }

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $input[$field];
            }
        }

        if (empty($updates)) {
            echo json_encode(["success" => true, "message" => "No changes to update"]);
            exit();
        }

        $query = "UPDATE purchase_invoices SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($query);

        if ($stmt->execute($params)) {
            echo json_encode(["success" => true, "message" => "Invoice updated successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Unable to update invoice"]);
        }
    }
}

elseif ($method == 'DELETE') {
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID is required"]);
        exit();
    }

    $query = "DELETE FROM purchase_invoices WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $input['id']);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Invoice deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Unable to delete invoice"]);
    }
}
?>