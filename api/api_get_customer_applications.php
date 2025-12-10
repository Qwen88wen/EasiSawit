<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$applications = array();

// Get optional status filter
$status_filter = isset($_GET['status']) ? $_GET['status'] : null;

// Build query
if ($status_filter && in_array($status_filter, ['pending', 'approved', 'rejected'])) {
    $sql = "SELECT id, name, email, contact, location, acres, company_name, rate_requested, status,
            rejection_reason, submitted_at, reviewed_at, reviewed_by
            FROM customer_applications
            WHERE status = ?
            ORDER BY submitted_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $status_filter);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    // Get all applications
    $sql = "SELECT id, name, email, contact, location, acres, company_name, rate_requested, status,
            rejection_reason, submitted_at, reviewed_at, reviewed_by
            FROM customer_applications
            ORDER BY submitted_at DESC";
    $result = $conn->query($sql);
}

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $applications[] = $row;
        }
    }
    $result->free();
}

$conn->close();
http_response_code(200);
echo json_encode(array("applications" => $applications));
?>
