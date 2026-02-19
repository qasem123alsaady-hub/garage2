<?php
// إعدادات CORS الشاملة
$allowed_origins = [
    "https://garage2-r68a.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // السماح للنطاق الرئيسي بشكل افتراضي لضمان عمل التطبيق حتى لو لم يصل الـ Origin بشكل صحيح
    header("Access-Control-Allow-Origin: https://garage2-r68a.onrender.com");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// تعطيل عرض الأخطاء المباشر لمنع إفساد الـ JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);
