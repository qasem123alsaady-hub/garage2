<?php
// تضمين ملف CORS
include_once __DIR__ . '/api/cors.php';

// توجيه الطلبات
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// تسجيل للتصحيح
error_log("Request: $request_method $request_uri");

// استخراج اسم الملف المطلوب
$path = parse_url($request_uri, PHP_URL_PATH);
$path = ltrim($path, '/');
$path_parts = explode('/', $path);
$endpoint = end($path_parts); // مثلاً: auth.php

// البحث عن الملف في مجلد api
$file_path = __DIR__ . '/api/' . $endpoint;

if (file_exists($file_path)) {
    // تضمين الملف المطلوب
    include $file_path;
} else {
    // إذا كان الملف غير موجود
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'API endpoint not found',
        'path' => $path,
        'file' => $file_path
    ]);
}
?>