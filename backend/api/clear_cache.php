<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

if (function_exists('opcache_reset')) {
    $result = opcache_reset();
    echo json_encode(["success" => $result, "message" => "OpCache reset attempt completed"]);
} else {
    echo json_encode(["success" => false, "message" => "OpCache not enabled or function not exists"]);
}
