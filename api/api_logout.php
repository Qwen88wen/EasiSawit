<?php
/**
 * Logout Handler
 * POST: /api/api_logout.php
 * 
 * Clears the admin session
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Destroy session
session_unset();
$destroy_result = session_destroy();

if ($destroy_result === false) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Failed to destroy session",
        "error" => "Session destruction failed"
    ));
} else {
    http_response_code(200);
    echo json_encode(array("message" => "Logout successful"));
}
?>
