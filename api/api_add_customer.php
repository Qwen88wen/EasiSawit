<?php
// api/api_add_customer.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->name) ||
    !isset($data->rate) ||
    !isset($data->remark) ||
    trim($data->remark) === ''
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add customer. Name, rate, and service area (remark) are required."));
    die();
}

$contact = isset($data->contact) ? $data->contact : null;
$remark = trim($data->remark);
$remark2 = isset($data->remark2) ? trim($data->remark2) : null;
// Convert empty string to NULL for consistent comparison
if ($remark2 === '') {
    $remark2 = null;
}
$today = date('Y-m-d'); // --- FIX: Set today's date for last_purchase_date ---

// Check 1: Check if exact duplicate exists (same name, contact, remark, and remark2)
$exact_check_sql = "SELECT id FROM customers WHERE name = ? AND (contact = ? OR (contact IS NULL AND ? IS NULL)) AND remark = ? AND (remark2 = ? OR (remark2 IS NULL AND ? IS NULL))";
$exact_check_stmt = $conn->prepare($exact_check_sql);

if (!$exact_check_stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    die();
}

$exact_check_stmt->bind_param("ssssss", $data->name, $contact, $contact, $remark, $remark2, $remark2);
$exact_check_stmt->execute();
$exact_result = $exact_check_stmt->get_result();

if ($exact_result->num_rows > 0) {
    // Exact duplicate found (same name, contact, remark, and remark2)
    http_response_code(409); // 409 Conflict
    echo json_encode(array(
        "message" => "This customer already exists with the same name, contact, service area, and location. Cannot add duplicate.",
        "error" => "DUPLICATE_CUSTOMER"
    ));
    $exact_check_stmt->close();
    $conn->close();
    die();
}
$exact_check_stmt->close();

// Insert customer with remark and remark2 fields
$sql = "INSERT INTO customers (name, contact, rate, remark, remark2, last_purchase_date) VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssdsss",
    $data->name,
    $contact,
    $data->rate,
    $remark,
    $remark2,
    $today
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(array("message" => "Customer was added."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to add customer."));
}

$stmt->close();
$conn->close();
?>