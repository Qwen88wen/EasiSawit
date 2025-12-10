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
    !isset($data->notes) ||
    trim($data->notes) === ''
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add customer. Name, rate, and notes are required."));
    die();
}

$contact = isset($data->contact) ? $data->contact : null;
$acres = isset($data->acres) ? $data->acres : null;
$notes = trim($data->notes);  // 3NF: renamed from remark
$additional_notes = isset($data->additional_notes) ? trim($data->additional_notes) : null;  // 3NF: renamed from remark2
// Convert empty string to NULL for consistent comparison
if ($additional_notes === '') {
    $additional_notes = null;
}
$today = date('Y-m-d'); // --- FIX: Set today's date for last_purchase_date ---

// Check 1: Check if exact duplicate exists (same name, contact, notes, and additional_notes)
$exact_check_sql = "SELECT id FROM customers WHERE name = ? AND (contact = ? OR (contact IS NULL AND ? IS NULL)) AND notes = ? AND (additional_notes = ? OR (additional_notes IS NULL AND ? IS NULL))";
$exact_check_stmt = $conn->prepare($exact_check_sql);

if (!$exact_check_stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    die();
}

$exact_check_stmt->bind_param("ssssss", $data->name, $contact, $contact, $notes, $additional_notes, $additional_notes);
$exact_check_stmt->execute();
$exact_result = $exact_check_stmt->get_result();

if ($exact_result->num_rows > 0) {
    // Exact duplicate found (same name, contact, notes, and additional_notes)
    http_response_code(409); // 409 Conflict
    echo json_encode(array(
        "message" => "This customer already exists with the same name, contact, and notes. Cannot add duplicate.",
        "error" => "DUPLICATE_CUSTOMER"
    ));
    $exact_check_stmt->close();
    $conn->close();
    die();
}
$exact_check_stmt->close();

// Insert customer with notes, additional_notes, and acres fields (3NF normalized)
$sql = "INSERT INTO customers (name, contact, acres, rate, notes, additional_notes, last_purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssddsss",
    $data->name,
    $contact,
    $acres,
    $data->rate,
    $notes,
    $additional_notes,
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