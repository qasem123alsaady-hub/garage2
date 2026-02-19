<?php
try {
    include_once 'cors.php';
    include_once '../config/database.php';

    class Auth {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // تسجيل الدخول
    public function login($username, $password) {
        $query = "SELECT id, username, password, name, role, customer_id FROM " . $this->table_name . " WHERE username = :username";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($password, $row['password'])) {
                return [
                    'success' => true,
                    'user' => [
                        'id' => $row['id'],
                        'username' => $row['username'],
                        'name' => $row['name'],
                        'role' => $row['role'],
                        'customer_id' => $row['customer_id'] ?? null
                    ]
                ];
            }
        }
        return ['success' => false, 'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'];
    }
}

// معالجة طلبات تسجيل الدخول فقط
$database = new Database();
$db = $database->getConnection();

// Logging for debug
$log_file = 'debug.log';
$timestamp = date('[Y-m-d H:i:s] ');
file_put_contents($log_file, $timestamp . "Auth.php called - Method: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

if (!$db) {
    file_put_contents($log_file, $timestamp . "Database connection failed\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $raw_input = file_get_contents("php://input");
    file_put_contents($log_file, $timestamp . "Input Data: " . $raw_input . "\n", FILE_APPEND);
    
    $data = json_decode($raw_input);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        file_put_contents($log_file, $timestamp . "JSON Parse Error: " . json_last_error_msg() . "\n", FILE_APPEND);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit();
    }
    
    // ✅ تأكد من وجود action في البيانات
    $action = isset($data->action) ? $data->action : '';
    
    if ($action === 'login') {
        $username = isset($data->username) ? $data->username : '';
        $password = isset($data->password) ? $data->password : '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'يرجى إدخال اسم المستخدم وكلمة المرور']);
            exit();
        }
        
        $result = $auth->login($username, $password);
        echo json_encode($result);
    } else {
        echo json_encode(['success' => false, 'message' => 'الإجراء غير معروف']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
} catch (Exception $e) {
    if (isset($log_file)) {
        file_put_contents($log_file, date('[Y-m-d H:i:s] ') . "Fatal Error: " . $e->getMessage() . "\n", FILE_APPEND);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
?>
