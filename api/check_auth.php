<?php
/**
 * Session/Authentication Middleware
 * Include this file at the top of protected API endpoints
 * Usage: include 'check_auth.php'; // Before your API logic
 */

// Start session if not already started with secure configuration
if (session_status() === PHP_SESSION_NONE) {
    // Secure session configuration
    ini_set('session.cookie_httponly', 1);      // Prevent JavaScript access to session cookie
    ini_set('session.cookie_secure', 0);         // Set to 1 if using HTTPS in production
    ini_set('session.use_only_cookies', 1);     // Only use cookies for sessions (not URL)
    ini_set('session.cookie_samesite', 'Strict'); // CSRF protection
    ini_set('session.use_strict_mode', 1);      // Reject uninitialized session IDs
    
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['admin_user_id']) || !isset($_SESSION['username'])) {
    http_response_code(401);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(array(
        "message" => "Unauthorized. Please login first.",
        "error" => "NO_SESSION"
    ));
    exit();
}

// Optional: Check session timeout (30 minutes)
$session_timeout = 30 * 60; // 30 minutes in seconds
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $session_timeout)) {
    // Session expired
    session_unset();
    session_destroy();
    http_response_code(401);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(array(
        "message" => "Session expired. Please login again.",
        "error" => "SESSION_EXPIRED"
    ));
    exit();
}

// Update last activity timestamp
$_SESSION['last_activity'] = time();

// Set current user info for logging
$current_user_id = $_SESSION['admin_user_id'];
$current_username = $_SESSION['username'];

// If this file is called directly (not included), return success JSON
if (basename($_SERVER['PHP_SELF']) === 'check_auth.php') {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(array(
        "success" => true,
        "message" => "Authenticated",
        "username" => $current_username
    ));
    exit();
}
?>
