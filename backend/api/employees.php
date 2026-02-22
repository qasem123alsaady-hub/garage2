<?php
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

// منع عرض أخطاء PHP في الاستجابة لضمان وصول JSON صالح دائماً
ini_set('display_errors', 0);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action == 'payroll') {
        try {
            // Balance = (Total Salary Records) - (Total Advances) - (Total Deductions)
            // Note: We sum all statuses for Salary to know what is 'accrued', 
            // but usually we want to compare what was PAID vs what was EARNED.
            // Let's simplify: Balance = (All Salary records) - (All Advance records) - (All Deduction records)
            // This represents the current standing of the employee.
            $query = "SELECT e.*, 
                      (SELECT COALESCE(SUM(amount), 0) FROM employee_payments WHERE employee_id = e.id AND payment_type = 'salary') as total_earned,
                      (SELECT COALESCE(SUM(amount), 0) FROM employee_payments WHERE employee_id = e.id AND payment_type = 'advance') as total_advances,
                      (SELECT COALESCE(SUM(amount), 0) FROM employee_payments WHERE employee_id = e.id AND payment_type = 'deduction') as total_deductions,
                      (SELECT COALESCE(SUM(amount), 0) FROM employee_payments WHERE employee_id = e.id AND payment_type = 'salary' AND status = 'paid') as total_paid_salary
                      FROM employees e 
                      WHERE e.status = 'active'
                      ORDER BY e.name ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($employees as &$emp) {
                // Account Balance = (All Earned) - (All Paid) - (All Advances) - (All Deductions)
                // However, 'total_earned' includes pending ones.
                // Usually, the user wants to see how much the employee 'owes' from advances to subtract from the NEXT salary.
                // So: Previous Balance = (Total Salaries Paid) - (Total Salaries Earned) - Advances - Deductions ? No.
                // Let's stick to a simple Ledger: 
                // Balance = Salaries(Earned) - Advances - Deductions - Salaries(Actually Paid)
                $emp['account_balance'] = (float)$emp['total_earned'] - (float)$emp['total_advances'] - (float)$emp['total_deductions'] - (float)$emp['total_paid_salary'];
            }

            echo json_encode($employees);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } elseif ($action == 'payments') {
        try {
            $query = "SELECT ep.*, e.name as employee_name, e.position as employee_position 
                      FROM employee_payments ep 
                      JOIN employees e ON ep.employee_id = e.id 
                      ORDER BY ep.payment_date DESC, ep.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    } else {
        try {
            $query = "SELECT * FROM employees ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($employees);
        } catch (Exception $e) {
            echo json_encode([]);
        }
    }
}

elseif ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action == 'confirm_payment') {
        if (!empty($data->payment_id)) {
            try {
                $query = "UPDATE employee_payments SET status = 'paid' WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->execute([':id' => $data->payment_id]);
                echo json_encode(["success" => true, "message" => "Payment confirmed"]);
            } catch (Exception $e) {
                echo json_encode(["success" => false, "message" => $e->getMessage()]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing payment_id"]);
        }
        exit();
    }

    if ($action == 'advance') {
        if (!empty($data->employee_id) && !empty($data->amount)) {
            try {
                $query = "INSERT INTO employee_payments (employee_id, amount, payment_type, payment_date, notes, status) 
                          VALUES (:employee_id, :amount, 'advance', :payment_date, :notes, 'pending')";
                $stmt = $db->prepare($query);
                $stmt->execute([
                    ':employee_id' => $data->employee_id,
                    ':amount' => $data->amount,
                    ':payment_date' => $data->payment_date ?? date('Y-m-d'),
                    ':notes' => $data->notes ?? ''
                ]);
                echo json_encode(["success" => true, "message" => "Advance added successfully"]);
            } catch (Exception $e) {
                echo json_encode(["success" => false, "message" => $e->getMessage()]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing data"]);
        }
        exit();
    }

    if ($action == 'payroll_approve') {
        // Expected data: array of {employee_id, amount, notes, payment_type}
        if (isset($data->payments) && is_array($data->payments)) {
            try {
                $db->beginTransaction();
                $query = "INSERT INTO employee_payments (employee_id, amount, payment_type, payment_date, notes, status) 
                          VALUES (:employee_id, :amount, :payment_type, :payment_date, :notes, :status)";
                $stmt = $db->prepare($query);
                
                foreach ($data->payments as $pay) {
                    $stmt->execute([
                        ':employee_id' => $pay->employee_id,
                        ':amount' => $pay->amount,
                        ':payment_type' => $pay->payment_type ?? 'salary',
                        ':payment_date' => $data->payment_date ?? date('Y-m-d'),
                        ':notes' => $pay->notes ?? 'Monthly Salary',
                        ':status' => $pay->status ?? 'pending'
                    ]);
                }
                $db->commit();
                echo json_encode(["success" => true, "message" => "Payroll approved and payments recorded"]);
            } catch (Exception $e) {
                $db->rollBack();
                echo json_encode(["success" => false, "message" => $e->getMessage()]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Invalid payroll data"]);
        }
        exit();
    }

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
        exit();
    }

    if (!empty($data->name)) {
        try {
            $query = "INSERT INTO employees (name, position, phone, email, salary, hire_date, status, created_at) VALUES (:name, :position, :phone, :email, :salary, :hire_date, :status, NOW())";
            $stmt = $db->prepare($query);

            // استخدام متغيرات وسيطة لتجنب مشاكل التمرير بالمرجع والتحقق من القيم
            $name = $data->name;
            $position = isset($data->position) ? $data->position : '';
            $phone = isset($data->phone) ? $data->phone : '';
            $email = isset($data->email) ? $data->email : '';
            $salary = isset($data->salary) ? $data->salary : 0;
            $hire_date = isset($data->hire_date) ? $data->hire_date : date('Y-m-d');
            $status = isset($data->status) ? $data->status : 'active';

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":position", $position);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":salary", $salary);
            $stmt->bindParam(":hire_date", $hire_date);
            $stmt->bindParam(":status", $status);

            if ($stmt->execute()) {
                $employeeId = $db->lastInsertId();

                // إنشاء حساب مستخدم للموظف
                $userId = 'u' . time() . rand(1000, 9999);
                $username = !empty($phone) ? $phone : 'emp' . $employeeId;
                $password = !empty($phone) ? $phone : 'emp' . $employeeId;
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                
                // تحديد الدور بناءً على المسمى الوظيفي
                $role = 'user';
                $pos_lower = mb_strtolower($position, 'UTF-8');
                if (strpos($pos_lower, 'فني') !== false || strpos($pos_lower, 'technician') !== false) {
                    $role = 'technician';
                }

                // التأكد من عدم وجود مستخدم بنفس الاسم
                $checkUserQuery = "SELECT id FROM users WHERE username = :username";
                $checkUserStmt = $db->prepare($checkUserQuery);
                $checkUserStmt->bindParam(":username", $username);
                $checkUserStmt->execute();
                
                if ($checkUserStmt->rowCount() == 0) {
                    $userQuery = "INSERT INTO users (id, username, password, name, role) VALUES (:id, :username, :password, :name, :role)";
                    $userStmt = $db->prepare($userQuery);
                    $userStmt->bindParam(":id", $userId);
                    $userStmt->bindParam(":username", $username);
                    $userStmt->bindParam(":password", $hashedPassword);
                    $userStmt->bindParam(":name", $name);
                    $userStmt->bindParam(":role", $role);
                    $userStmt->execute();
                }

                echo json_encode(["success" => true, "message" => "Employee and user account added successfully", "id" => $employeeId]);
            } else {
                $errorInfo = $stmt->errorInfo();
                echo json_encode(["success" => false, "message" => "Unable to add employee: " . $errorInfo[2]]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
}

elseif ($method == 'PUT') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!empty($data->id)) {
        try {
            $query = "UPDATE employees SET name = :name, position = :position, phone = :phone, email = :email, salary = :salary, hire_date = :hire_date, status = :status WHERE id = :id";
            $stmt = $db->prepare($query);

            $name = strip_tags($data->name);
            $position = isset($data->position) ? strip_tags($data->position) : '';
            $phone = isset($data->phone) ? strip_tags($data->phone) : '';
            $email = isset($data->email) ? strip_tags($data->email) : '';
            $salary = !empty($data->salary) ? floatval($data->salary) : 0;
            $hire_date = !empty($data->hire_date) ? $data->hire_date : null;
            $status = !empty($data->status) ? $data->status : 'active';
            $id = $data->id;

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":position", $position);
            $stmt->bindParam(":phone", $phone);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":salary", $salary);
            $stmt->bindParam(":hire_date", $hire_date);
            $stmt->bindParam(":status", $status);
            $stmt->bindParam(":id", $id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Employee updated successfully"]);
            } else {
                $errorInfo = $stmt->errorInfo();
                echo json_encode(["success" => false, "message" => "Unable to update employee: " . $errorInfo[2]]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID is required"]);
    }
}

elseif ($method == 'DELETE') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!empty($data->payment_id)) {
        try {
            $query = "DELETE FROM employee_payments WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->payment_id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Payment record deleted successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to delete payment record"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        exit();
    }

    if (!empty($data->id)) {
        try {
            $query = "DELETE FROM employees WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id", $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Employee deleted successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Unable to delete employee"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "ID is required"]);
    }
}
?>