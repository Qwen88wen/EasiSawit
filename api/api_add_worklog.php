<?php
// api/api_add_worklog.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->log_date) ||
    !isset($data->worker_id) ||
    !isset($data->customer_id) ||
    !isset($data->tons) ||
    !isset($data->rate_per_ton)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add work log. Incomplete data."));
    die();
}

// Validate that log_date is not in the future (Malaysia timezone UTC+8)
date_default_timezone_set('Asia/Kuala_Lumpur');
$today = date('Y-m-d');
$log_date = $data->log_date;

if ($log_date > $today) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "操作失败：工作日志日期不能晚于当前日期。",
        "error" => "FUTURE_DATE_NOT_ALLOWED",
        "log_date" => $log_date,
        "current_date" => $today
    ));
    die();
}

$sql = "INSERT INTO work_logs (log_date, worker_id, customer_id, tons, rate_per_ton) VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "siidd",
    $data->log_date,
    $data->worker_id,
    $data->customer_id,
    $data->tons,
    $data->rate_per_ton
);

if ($stmt->execute()) {
    // Update customer's last_purchase_date to today
    $today = date('Y-m-d');
    $update_sql = "UPDATE customers SET last_purchase_date = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    
    if ($update_stmt) {
        $update_stmt->bind_param("si", $today, $data->customer_id);
        $update_stmt->execute();
        $update_stmt->close();
    }
    
    http_response_code(201);
    echo json_encode(array("message" => "Work log was added."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to add work log."));
}

$stmt->close();
$conn->close();
?>