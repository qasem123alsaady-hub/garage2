<?php
include_once 'cors.php';
header('Content-Type: application/json');

include_once '../config/database.php';

class Users {
    private $conn;
    private $table_name = "users";
    public $error;

    public function __construct($db) {
        $this->conn = $db;
    }

    // التحقق من وجود اسم مستخدم
    public function usernameExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // إنشاء مستخدم جديد
    public function create($data) {
        $id = isset($data['id']) ? $data['id'] : 'u' . time() . rand(1000, 9999);
        $query = "INSERT INTO " . $this->table_name . " 
                  SET id = :id,
                      username = :username, 
                      password = :password, 
                      name = :name, 
                      role = :role, 
                      customer_id = :customer_id,
                      created_at = NOW()";
        
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            $this->error = "Prepare failed: " . implode(" - ", $this->conn->errorInfo());
            return false;
        }
        
        // ربط القيم
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':password', $data['password']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':customer_id', $data['customer_id']);
        
        if ($stmt->execute()) {
            return $id;
        }
        $this->error = implode(" - ", $stmt->errorInfo());
        return false;
    }

    // جلب جميع المستخدمين
    public function getAllUsers($role = null) {
        $query = "SELECT id, username, name, role, customer_id, created_at FROM " . $this->table_name;
        
        if ($role) {
            $query .= " WHERE role = :role";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($role) {
            $stmt->bindParam(':role', $role);
        }
        
        $stmt->execute();

        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = $row;
        }

        return $users;
    }

    // جلب مستخدم واحد حسب ID
    public function getUserById($id) {
        $query = "SELECT id, username, name, role, customer_id, created_at FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return null;
    }

    // تحديث كلمة مرور المستخدم
    public function updatePassword($id, $newPassword) {
        $query = "UPDATE " . $this->table_name . " SET password = :password WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    // تحديث بيانات المستخدم
    public function updateUser($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET ";
        $updates = [];
        
        if (isset($data['name'])) {
            $updates[] = "name = :name";
        }
        if (isset($data['username'])) {
            $updates[] = "username = :username";
        }
        if (isset($data['password'])) {
            $updates[] = "password = :password";
        }
        if (isset($data['role'])) {
            $updates[] = "role = :role";
        }
        if (isset($data['email']) && false) { // تم التعطيل لأن العمود غير موجود في قاعدة البيانات
            $updates[] = "email = :email";
        }
        if (isset($data['customer_id'])) {
            $updates[] = "customer_id = :customer_id";
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $query .= implode(", ", $updates) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id);
        
        if (isset($data['name'])) {
            $stmt->bindParam(':name', $data['name']);
        }
        if (isset($data['username'])) {
            $stmt->bindParam(':username', $data['username']);
        }
        if (isset($data['password'])) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt->bindParam(':password', $hashedPassword);
        }
        if (isset($data['role'])) {
            $stmt->bindParam(':role', $data['role']);
        }
        if (isset($data['email']) && false) {
            $stmt->bindParam(':email', $data['email']);
        }
        if (isset($data['customer_id'])) {
            $stmt->bindParam(':customer_id', $data['customer_id']);
        }
        
        return $stmt->execute();
    }

    // حذف مستخدم
    public function deleteUser($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
}

$database = new Database();
$db = $database->getConnection();
$users = new Users($db);

$method = $_SERVER['REQUEST_METHOD'];

try {
    // جلب جميع المستخدمين
    if ($method == 'GET') {
        $role = isset($_GET['role']) ? $_GET['role'] : null;
        $allUsers = $users->getAllUsers($role);
        
        echo json_encode($allUsers);
    }

    // إنشاء مستخدم جديد
    else if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // الحالة الخاصة: إنشاء مستخدم للعميل باستخدام رقم الهاتف
        if (isset($data['create_customer_user']) && $data['create_customer_user'] === true) {
            if (!empty($data['phone']) && !empty($data['customer_id']) && !empty($data['customer_name'])) {
                // التحقق من عدم وجود مستخدم بنفس اسم المستخدم (رقم الهاتف)
                if ($users->usernameExists($data['phone'])) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'رقم الهاتف مسجل مسبقاً'
                    ]);
                } else {
                    $userData = [
                        'username' => $data['phone'], // استخدام رقم الهاتف كاسم مستخدم
                        'password' => password_hash('123456', PASSWORD_DEFAULT), // كلمة السر الافتراضية
                        'name' => $data['customer_name'], // اسم العميل
                        'role' => 'customer', // دور العميل
                        'customer_id' => $data['customer_id'] // ربط بالعميل
                    ];
                    
                    $userId = $users->create($userData);
                    
                    if ($userId) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'تم إنشاء مستخدم العميل بنجاح',
                            'user_id' => $userId,
                            'username' => $userData['username'],
                            'default_password' => '123456',
                            'customer_id' => $userData['customer_id']
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'تعذر إنشاء مستخدم العميل: ' . $users->error
                        ]);
                    }
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'بيانات ناقصة: يرجى إدخال رقم الهاتف ورقم العميل واسم العميل'
                ]);
            }
        }
        // الحالة العادية: إنشاء مستخدم عادي
        else if (!empty($data['username']) && !empty($data['password']) && !empty($data['name']) && !empty($data['role'])) {
            // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
            if ($users->usernameExists($data['username'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'اسم المستخدم موجود مسبقاً'
                ]);
                    } else {
                        $userData = [
                            'username' => $data['username'],
                            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                            'name' => $data['name'],
                            'role' => $data['role'],
                            'email' => !empty($data['email']) ? $data['email'] : null,
                            'customer_id' => (!empty($data['customer_id'])) ? $data['customer_id'] : null
                        ];
                        
                        $userId = $users->create($userData);                
                if ($userId) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'تم إنشاء المستخدم بنجاح',
                        'user_id' => $userId
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'تعذر إنشاء المستخدم: ' . $users->error
                    ]);
                }
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'بيانات ناقصة'
            ]);
        }
    }

    // تحديث مستخدم (تغيير كلمة المرور أو البيانات)
    else if ($method == 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['id'])) {
            $updateData = [];
            
            if (isset($data['password']) && !empty($data['password'])) {
                $updateData['password'] = $data['password'];
            }
            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }
            if (isset($data['username'])) {
                $updateData['username'] = $data['username'];
            }
            if (isset($data['role'])) {
                $updateData['role'] = $data['role'];
            }
            if (isset($data['customer_id'])) {
                $updateData['customer_id'] = !empty($data['customer_id']) ? $data['customer_id'] : null;
            }
            
            if ($users->updateUser($data['id'], $updateData)) {
                echo json_encode(['success' => true, 'message' => 'تم تحديث المستخدم بنجاح']);
            } else {
                echo json_encode(['success' => false, 'message' => 'فشل تحديث المستخدم أو لم يتم تغيير أي بيانات']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'معرف المستخدم مفقود']);
        }
    }

    // حذف مستخدم
    else if ($method == 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['id'])) {
            if ($users->deleteUser($data['id'])) {
                echo json_encode(['success' => true, 'message' => 'تم حذف المستخدم بنجاح']);
            } else {
                echo json_encode(['success' => false, 'message' => 'فشل حذف المستخدم']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'معرف المستخدم مفقود']);
        }
    }

    else {
        echo json_encode(['success' => false, 'message' => 'الطريقة غير مدعومة']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'خطأ في الخادم: ' . $e->getMessage()
    ]);
}
?>