<?php
// تنظيف أي مخرجات سابقة لضمان إرسال الهيدرز بشكل صحيح
if (ob_get_length()) ob_clean();

// إعدادات الأخطاء في البداية
ini_set('display_errors', 0);
error_reporting(E_ALL);

// إعدادات CORS الشاملة
$allowed_origins = [
    "https://garage2-r68a.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? rtrim($_SERVER['HTTP_ORIGIN'], '/') : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // السماح للنطاق الرئيسي بشكل افتراضي لضمان عمل التطبيق حتى لو لم يصل الـ Origin بشكل صحيح
    header("Access-Control-Allow-Origin: https://garage2-r68a.onrender.com");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");
header("Access-Control-Max-Age: 86400");

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    http_response_code(200);
    exit();
}
