<?php
// تشغيل عرض الأخطاء للتشخيص
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
$auth = new Auth($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // ✅ تأكد من وجود action في البيانات
    $action = isset($data->action) ? $data->action : (isset($_POST['action']) ? $_POST['action'] : '');
    
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
?>
