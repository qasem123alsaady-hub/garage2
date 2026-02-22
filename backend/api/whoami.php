<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
echo json_encode([
    "file" => __FILE__,
    "dir" => __DIR__,
    "method" => $_SERVER['REQUEST_METHOD'],
    "time" => date('Y-m-d H:i:s')
]);
