<?php
include_once 'cors.php';
echo json_encode([
    "status" => "ok",
    "message" => "API is reachable",
    "server_time" => date('Y-m-d H:i:s'),
    "method" => $_SERVER['REQUEST_METHOD']
]);
