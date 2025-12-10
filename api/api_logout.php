<?php
/**
 * Logout Handler
 * POST: /api/api_logout.php
 * 
 * Clears the admin session
 */

// Security Headers - Protect against common web vulnerabilities
header("X-Content-Type-Options: nosniff");           // Prevent MIME type sniffing
header("X-Frame-Options: DENY");                     // Prevent clickjacking attacks
header("X-XSS-Protection: 1; mode=block");           // Enable XSS protection
header("Referrer-Policy: strict-origin-when-cross-origin"); // Control referrer information

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session with secure configuration
if (session_status() === PHP_SESSION_NONE) {
    // Secure session configuration
    ini_set('session.cookie_httponly', 1);      // Prevent JavaScript access to session cookie
    ini_set('session.cookie_secure', 0);         // Set to 1 if using HTTPS in production
    ini_set('session.use_only_cookies', 1);     // Only use cookies for sessions (not URL)
    ini_set('session.cookie_samesite', 'Strict'); // CSRF protection
    ini_set('session.use_strict_mode', 1);      // Reject uninitialized session IDs
    
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
