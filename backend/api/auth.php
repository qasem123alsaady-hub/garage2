<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

class Auth {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // تسجيل الدخول
    public function login($username, $password) {
        $query = "SELECT id, username, password, name, role, customer_id, created_at 
                  FROM " . $this->table_name . " 
                  WHERE username = :username 
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $row['password'])) {
                // تحديث آخر تسجيل دخول
                $this->updateLastLogin($row['id']);
                
                // جلب معلومات العميل إذا كان هناك customer_id
                $customerData = null;
                if (!empty($row['customer_id'])) {
                    $customerData = $this->getCustomerData($row['customer_id']);
                }
                
                return [
                    'success' => true,
                    'message' => 'تم تسجيل الدخول بنجاح',
                    'user' => [
                        'id' => $row['id'],
                        'username' => $row['username'],
                        'name' => $row['name'],
                        'role' => $row['role'],
                        'customer_id' => $row['customer_id'],
                        'customer' => $customerData
                    ]
                ];
            }
        }
        
        return [
            'success' => false, 
            'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
        ];
    }

    // تحديث آخر تسجيل دخول
    private function updateLastLogin($userId) {
        $query = "UPDATE " . $this->table_name . " 
                  SET last_login = NOW() 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
    }

    // جلب بيانات العميل
    private function getCustomerData($customerId) {
        $query = "SELECT id, name, phone, email, address 
                  FROM customers 
                  WHERE id = :id 
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $customerId);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return null;
    }

    // تسجيل خروج
    public function logout($userId) {
        // يمكن إضافة تسجيل وقت الخروج إذا أردت
        return [
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح'
        ];
    }

    // التحقق من صحة التوكن (للإصدارات القادمة)
    public function validateToken($token) {
        // يمكن إضافة التحقق من JWT هنا لاحقاً
        return ['success' => false, 'message' => 'Not implemented'];
    }

    // تغيير كلمة المرور
    public function changePassword($userId, $oldPassword, $newPassword) {
        // التحقق من كلمة المرور القديمة
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($oldPassword, $row['password'])) {
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                
                $updateQuery = "UPDATE " . $this->table_name . " 
                               SET password = :password 
                               WHERE id = :id";
                
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bindParam(':password', $hashedPassword);
                $updateStmt->bindParam(':id', $userId);
                
                if ($updateStmt->execute()) {
                    return [
                        'success' => true,
                        'message' => 'تم تغيير كلمة المرور بنجاح'
                    ];
                }
            }
        }
        
        return [
            'success' => false,
            'message' => 'كلمة المرور القديمة غير صحيحة'
        ];
    }

    // إنشاء مستخدم جديد (للإداريين فقط)
    public function createUser($data) {
        // التحقق من عدم وجود اسم مستخدم مكرر
        $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE username = :username";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':username', $data->username);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            return [
                'success' => false,
                'message' => 'اسم المستخدم موجود مسبقاً'
            ];
        }

        // التحقق من وجود العميل إذا تم تحديد customer_id
        if (!empty($data->customer_id)) {
            $customerCheck = "SELECT id FROM customers WHERE id = :id";
            $customerStmt = $this->conn->prepare($customerCheck);
            $customerStmt->bindParam(':id', $data->customer_id);
            $customerStmt->execute();
            
            if ($customerStmt->rowCount() == 0) {
                return [
                    'success' => false,
                    'message' => 'العميل غير موجود'
                ];
            }
        }

        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (username, password, name, role, customer_id) 
                  VALUES 
                  (:username, :password, :name, :role, :customer_id)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':customer_id', $data->customer_id);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'تم إنشاء المستخدم بنجاح',
                'user_id' => $this->conn->lastInsertId()
            ];
        }
        
        return [
            'success' => false,
            'message' => 'فشل في إنشاء المستخدم'
        ];
    }

    // جلب جميع المستخدمين (للإداريين)
    public function getAllUsers() {
        $query = "SELECT id, username, name, role, customer_id, 
                  created_at, updated_at, 
                  DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login 
                  FROM " . $this->table_name . " 
                  ORDER BY id DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // جلب أسماء العملاء لكل مستخدم لديه customer_id
        foreach ($users as &$user) {
            if (!empty($user['customer_id'])) {
                $customerQuery = "SELECT name FROM customers WHERE id = :id";
                $customerStmt = $this->conn->prepare($customerQuery);
                $customerStmt->bindParam(':id', $user['customer_id']);
                $customerStmt->execute();
                
                if ($customerStmt->rowCount() > 0) {
                    $customer = $customerStmt->fetch(PDO::FETCH_ASSOC);
                    $user['customer_name'] = $customer['name'];
                }
            }
        }
        
        return [
            'success' => true,
            'users' => $users
        ];
    }

    // حذف مستخدم
    public function deleteUser($userId) {
        // منع حذف المستخدم admin
        $checkQuery = "SELECT username FROM " . $this->table_name . " WHERE id = :id";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':id', $userId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
            if ($user['username'] === 'admin') {
                return [
                    'success' => false,
                    'message' => 'لا يمكن حذف المستخدم admin'
                ];
            }
        }
        
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'تم حذف المستخدم بنجاح'
            ];
        }
        
        return [
            'success' => false,
            'message' => 'فشل في حذف المستخدم'
        ];
    }
}

// معالجة الطلبات
$database = new Database();
$db = $database->getConnection();
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

switch ($method) {
    case 'POST':
        if (!isset($data->action)) {
            echo json_encode(['success' => false, 'message' => 'لم يتم تحديد الإجراء']);
            break;
        }

        switch ($data->action) {
            case 'login':
                if (isset($data->username) && isset($data->password)) {
                    $result = $auth->login($data->username, $data->password);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'يرجى إدخال اسم المستخدم وكلمة المرور']);
                }
                break;

            case 'logout':
                if (isset($data->user_id)) {
                    $result = $auth->logout($data->user_id);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'معرف المستخدم مطلوب']);
                }
                break;

            case 'change_password':
                if (isset($data->user_id) && isset($data->old_password) && isset($data->new_password)) {
                    $result = $auth->changePassword($data->user_id, $data->old_password, $data->new_password);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'جميع الحقول مطلوبة']);
                }
                break;

            case 'create_user':
                if (isset($data->username) && isset($data->password) && isset($data->name) && isset($data->role)) {
                    $result = $auth->createUser($data);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'جميع الحقول مطلوبة']);
                }
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'إجراء غير معروف']);
        }
        break;

    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'get_users':
                    $result = $auth->getAllUsers();
                    echo json_encode($result);
                    break;
                    
                default:
                    echo json_encode(['success' => false, 'message' => 'إجراء غير معروف']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'لم يتم تحديد الإجراء']);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        if (isset($data->action) && $data->action === 'delete_user' && isset($data->user_id)) {
            $result = $auth->deleteUser($data->user_id);
            echo json_encode($result);
        } else {
            echo json_encode(['success' => false, 'message' => 'معرف المستخدم مطلوب']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
