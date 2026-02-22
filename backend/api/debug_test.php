<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$log_file = __DIR__ . '/debug.log';
$msg = "[" . date('Y-m-d H:i:s') . "] DEBUG TEST REACHED
";
file_put_contents($log_file, $msg, FILE_APPEND);

echo json_encode(["success" => true, "message" => "Debug test worked"]);
