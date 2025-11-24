<?php
/**
 * Reject Customer Application
 * POST: /api/api_reject_application.php
 *
 * Rejects a customer application by:
 * 1. Updating the application status to 'rejected'
 * 2. Recording the rejection reason
 * 3. Recording review details
 *
 * Request JSON:
 * {
 *   "application_id": 123,
 *   "rejection_reason": "Does not meet requirements" (optional)
 * }
 *
 * Response:
 * - Success (200): {"message": "Application rejected"}
 * - Error (400): {"message": "Error message"}
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->application_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Missing required field: application_id"));
    exit();
}

$application_id = intval($data->application_id);
$rejection_reason = isset($data->rejection_reason) ? trim($data->rejection_reason) : null;

// Check if application exists and is pending
$sql = "SELECT id FROM customer_applications WHERE id = ? AND status = 'pending'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $application_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(array("message" => "Application not found or already processed"));
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Update application status to rejected
$reviewed_by = isset($_SESSION['username']) ? $_SESSION['username'] : 'admin';
$sql = "UPDATE customer_applications
        SET status = 'rejected', rejection_reason = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $rejection_reason, $reviewed_by, $application_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(array(
        "message" => "Application rejected successfully.",
        "application_id" => $application_id
    ));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Failed to reject application: " . $stmt->error));
}

$stmt->close();
$conn->close();
?>
