<?php
// api/api_update_worklog.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->id) ||
    !isset($data->log_date) ||
    !isset($data->worker_id) ||
    !isset($data->customer_id) ||
    !isset($data->tons)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update work log. Incomplete data."));
    die();
}

// Validate that log_date is not in the future (Malaysia timezone UTC+8)
date_default_timezone_set('Asia/Kuala_Lumpur');
$today = date('Y-m-d');
$log_date = $data->log_date;

if ($log_date > $today) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Operation failed: Work log date cannot be later than current date.",
        "error" => "FUTURE_DATE_NOT_ALLOWED",
        "log_date" => $log_date,
        "current_date" => $today
    ));
    die();
}

// Note: rate_per_ton removed for 3NF normalization - now derived from customers.rate
$sql = "UPDATE work_logs SET log_date = ?, worker_id = ?, customer_id = ?, tons = ? WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "siidi",
    $data->log_date,
    $data->worker_id,
    $data->customer_id,
    $data->tons,
    $data->id
);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        // <-- FIX: Send clear flag
        echo json_encode(array("message" => "Work log was updated.", "changed" => true));
    } else {
        http_response_code(200);
        // <-- FIX: Send clear flag
        echo json_encode(array("message" => "No changes were made to the work log.", "changed" => false));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to update work log."));
}

$stmt->close();
$conn->close();
?>
