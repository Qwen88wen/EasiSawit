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

if (
    !isset($data->id) ||
    !isset($data->name) ||
    !isset($data->rate) ||
    !isset($data->remark) ||
    trim($data->remark) === ''
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update customer. Name, rate, and service area (remark) are required."));
    die();
}

$contact = isset($data->contact) ? $data->contact : null;
$acres = isset($data->acres) ? $data->acres : null;
$remark = trim($data->remark);
$remark2 = isset($data->remark2) ? trim($data->remark2) : null;
if ($remark2 === '') {
    $remark2 = null;
}

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
