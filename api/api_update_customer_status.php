<?php
// api/api_update_customer_status.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing required fields: id and status."));
    die();
}

$allowed_statuses = array('Pending', 'Active', 'Rejected');
if (!in_array($data->status, $allowed_statuses)) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid status. Allowed: Pending, Active, Rejected."));
    die();
}

// When approving a customer (status = 'Active'), set last_purchase_date to today
// This ensures the customer appears in the Customers page immediately
if ($data->status === 'Active') {
    $sql = "UPDATE customers SET status = ?, updated_at = NOW(), last_purchase_date = CURDATE() WHERE id = ?";
} else {
    $sql = "UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?";
}

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    die();
}

$stmt->bind_param("si", $data->status, $data->id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);

        $action = '';
        if ($data->status === 'Active') {
            $action = 'approved';
        } elseif ($data->status === 'Rejected') {
            $action = 'rejected';
        } else {
            $action = 'updated';
        }

        echo json_encode(array(
            "message" => "Customer application has been " . $action . ".",
            "status" => $data->status,
            "changed" => true
        ));
    } else {
        http_response_code(200);
        echo json_encode(array(
            "message" => "No changes were made. Status may already be set.",
            "changed" => false
        ));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to update customer status: " . $stmt->error));
}

$stmt->close();
$conn->close();
?>
