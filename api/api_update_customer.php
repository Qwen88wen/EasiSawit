<?php
// api/api_update_customer.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (
    !isset($data->id) ||
    !isset($data->name) ||
    !isset($data->rate)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update customer. Name and rate are required."));
    die();
}

// Extract and sanitize fields
$contact = isset($data->contact) && $data->contact !== '' ? $data->contact : null;
$acres = isset($data->acres) && $data->acres !== '' && $data->acres !== null ? floatval($data->acres) : null;
$remark = isset($data->remark) ? trim($data->remark) : null;  // Service Area
$remark2 = isset($data->remark2) ? trim($data->remark2) : null;  // Location

// Empty strings should be NULL
if ($contact === '') $contact = null;
if ($remark === '') $remark = null;
if ($remark2 === '') $remark2 = null;

// Log for debugging
error_log("[UPDATE CUSTOMER] ID: {$data->id}, Name: {$data->name}, Acres: $acres, Remark: $remark, Remark2: $remark2");

$sql = "UPDATE customers SET name = ?, contact = ?, acres = ?, rate = ?, remark = ?, remark2 = ? WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssddssi",
    $data->name,
    $contact,
    $acres,
    $data->rate,
    $remark,
    $remark2,
    $data->id
);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        // <-- FIX: Send clear flag
        echo json_encode(array("message" => "Customer was updated.", "changed" => true));
    } else {
        http_response_code(200);
        // <-- FIX: Send clear flag
        echo json_encode(array("message" => "No changes were made to the customer.", "changed" => false));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to update customer."));
}

$stmt->close();
$conn->close();
?>
