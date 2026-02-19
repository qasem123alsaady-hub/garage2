<?php
// إعدادات CORS الشاملة
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");
header("Access-Control-Allow-Credentials: true");

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// تعطيل عرض الأخطاء المباشر لمنع إفساد الـ JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);
