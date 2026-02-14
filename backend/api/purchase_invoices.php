<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    if (empty($input['supplier_id']) || empty($input['amount'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
        exit();
    }

    $query = "INSERT INTO purchase_invoices (supplier_id, invoice_number, invoice_date, amount, items, paid_amount, status, created_at) 
              VALUES (:supplier_id, :invoice_number, :invoice_date, :amount, :items, 0, 'pending', NOW())";
    
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(":supplier_id", $input['supplier_id']);
    $stmt->bindParam(":invoice_number", $input['invoice_number']);
    $stmt->bindParam(":invoice_date", $input['invoice_date']);
    $stmt->bindParam(":amount", $input['amount']);
    $stmt->bindParam(":items", $input['items']);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Invoice added successfully", "id" => $db->lastInsertId()]);
    } else {
        echo json_encode(["success" => false, "message" => "Unable to add invoice"]);
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
        // التحقق مما إذا كان تم إرسال المبلغ المدفوع لتحديثه
        $update_paid = isset($input['paid_amount']);
        
        $query = "UPDATE purchase_invoices SET supplier_id = :supplier_id, invoice_number = :invoice_number, 
                  invoice_date = :invoice_date, amount = :amount, items = :items";
        
        if ($update_paid) {
            $query .= ", paid_amount = :paid_amount, status = :status";
        }
        
        $query .= " WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":supplier_id", $input['supplier_id']);
        $stmt->bindParam(":invoice_number", $input['invoice_number']);
        $stmt->bindParam(":invoice_date", $input['invoice_date']);
        $stmt->bindParam(":amount", $input['amount']);
        $stmt->bindParam(":items", $input['items']);
        $stmt->bindParam(":id", $input['id']);

        if ($update_paid) {
            $paid = floatval($input['paid_amount']);
            $total = floatval($input['amount']);
            $status = 'pending';
            
            if ($paid >= $total) {
                $status = 'paid';
                // لا نجبر المبلغ المدفوع أن يساوي الإجمالي هنا للسماح بتصحيح الأخطاء، لكن الحالة تصبح مدفوعة
            } elseif ($paid > 0) {
                $status = 'partial';
            }
            
            $stmt->bindParam(":paid_amount", $paid);
            $stmt->bindParam(":status", $status);
        }

        if ($stmt->execute()) {
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