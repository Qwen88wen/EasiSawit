<?php
/**
 * Reactivate Archived Customer
 * POST: /api/api_reactivate_customer.php
 * 
 * Takes a customer_id and sets their last_purchase_date to today,
 * moving them back to the "Active" customers list.
 * 
 * Request JSON:
 * {
 *   "customer_id": 123
 * }
 * 
 * Requires admin authentication
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['customer_id'])) {
    http_response_code(400);
    echo json_encode(array("message" => "customer_id is required"));
    die();
}

$customer_id = intval($data['customer_id']);
$today = date('Y-m-d');

// Update customer's last_purchase_date to today
$sql = "UPDATE customers SET last_purchase_date = ? WHERE id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    die();
}

$stmt->bind_param("si", $today, $customer_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Customer reactivated successfully",
            "customer_id" => $customer_id,
            "last_purchase_date" => $today
        ));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Customer not found"));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to reactivate customer"));
}

$stmt->close();
$conn->close();
?>
