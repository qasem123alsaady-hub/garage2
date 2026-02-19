<?php
// إعدادات CORS الشاملة
$allowed_origins = [
    "https://garage2-r68a.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// تعطيل عرض الأخطاء المباشر لمنع إفساد الـ JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);
