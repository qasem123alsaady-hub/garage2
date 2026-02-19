<?php
include_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $query = "SELECT * FROM purchase_payments ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->invoice_id) && !empty($data->amount)) {
        try {
            $db->beginTransaction();
            
            $query = "INSERT INTO purchase_payments (invoice_id, amount, payment_date, receipt_number, notes) VALUES (:invoice_id, :amount, :payment_date, :receipt_number, :notes)";
            $stmt = $db->prepare($query);
            
            $receipt_number = 'REC-' . time() . '-' . rand(100, 999);
            $date = $data->payment_date ?? date('Y-m-d');
            $notes = $data->notes ?? '';
            
            $stmt->bindParam(":invoice_id", $data->invoice_id);
            $stmt->bindParam(":amount", $data->amount);
            $stmt->bindParam(":payment_date", $date);
            $stmt->bindParam(":receipt_number", $receipt_number);
            $stmt->bindParam(":notes", $notes);
            
            $stmt->execute();
            $paymentId = $db->lastInsertId();
            
            updateInvoiceStatus($db, $data->invoice_id);
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Payment added", "id" => $paymentId, "receipt_number" => $receipt_number]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
}

if ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->id) && !empty($data->amount)) {
        try {
            $db->beginTransaction();
            
            // Get original payment to find invoice_id
            $stmt = $db->prepare("SELECT invoice_id FROM purchase_payments WHERE id = :id");
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$row) throw new Exception("Payment not found");
            $invoice_id = $row['invoice_id'];

            $query = "UPDATE purchase_payments SET 
                      amount = :amount, 
                      payment_date = :payment_date, 
                      notes = :notes 
                      WHERE id = :id";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(":amount", $data->amount);
            $stmt->bindParam(":payment_date", $data->payment_date);
            $stmt->bindParam(":notes", $data->notes);
            $stmt->bindParam(":id", $data->id);
            
            $stmt->execute();
            
            updateInvoiceStatus($db, $invoice_id);
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Payment updated"]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
}

if ($method == 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->id)) {
        try {
            $db->beginTransaction();
            
            $stmt = $db->prepare("SELECT invoice_id FROM purchase_payments WHERE id = :id");
            $stmt->bindParam(":id", $data->id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                $invoice_id = $row['invoice_id'];
                
                $delStmt = $db->prepare("DELETE FROM purchase_payments WHERE id = :id");
                $delStmt->bindParam(":id", $data->id);
                $delStmt->execute();
                
                updateInvoiceStatus($db, $invoice_id);
                
                $db->commit();
                echo json_encode(["success" => true, "message" => "Payment deleted"]);
            } else {
                $db->rollBack();
                echo json_encode(["success" => false, "message" => "Payment not found"]);
            }
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    }
}

function updateInvoiceStatus($db, $invoice_id) {
    $stmt = $db->prepare("SELECT SUM(amount) as total_paid FROM purchase_payments WHERE invoice_id = :id");
    $stmt->bindParam(":id", $invoice_id);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_paid = $row['total_paid'] ?? 0;
    
    $stmt = $db->prepare("SELECT amount FROM purchase_invoices WHERE id = :id");
    $stmt->bindParam(":id", $invoice_id);
    $stmt->execute();
    $invRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $amount = $invRow['amount'] ?? 0;
    
    $status = 'pending';
    if ($total_paid >= $amount) {
        $status = 'paid';
    } elseif ($total_paid > 0) {
        $status = 'partial';
    }
    
    $updateStmt = $db->prepare("UPDATE purchase_invoices SET paid_amount = :paid, status = :status WHERE id = :id");
    $updateStmt->bindParam(":paid", $total_paid);
    $updateStmt->bindParam(":status", $status);
    $updateStmt->bindParam(":id", $invoice_id);
    $updateStmt->execute();
}
?>