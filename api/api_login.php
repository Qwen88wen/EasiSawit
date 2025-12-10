<?php
/**
 * Secure Login Handler for Admin Users
 * POST: /api/api_login.php
 */

// Security Headers - Protect against common web vulnerabilities
header("X-Content-Type-Options: nosniff");           // Prevent MIME type sniffing
header("X-Frame-Options: DENY");                     // Prevent clickjacking attacks
header("X-XSS-Protection: 1; mode=block");           // Enable XSS protection
header("Referrer-Policy: strict-origin-when-cross-origin"); // Control referrer information

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Allow only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit();
}

// Start session securely with enhanced security settings
if (session_status() === PHP_SESSION_NONE) {
    // Secure session configuration
    ini_set('session.cookie_httponly', 1);      // Prevent JavaScript access to session cookie
    ini_set('session.cookie_secure', 0);         // Set to 1 if using HTTPS in production
    ini_set('session.use_only_cookies', 1);     // Only use cookies for sessions (not URL)
    ini_set('session.cookie_samesite', 'Strict'); // CSRF protection
    ini_set('session.use_strict_mode', 1);      // Reject uninitialized session IDs
    
    session_start();
}

include 'db_connect.php';

// Read JSON from frontend
$data = json_decode(file_get_contents("php://input"), true);

// Validate input fields
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Username and password are required"));
    exit();
}

$username = trim($data['username']);
$password = $data['password'];

// Query admin user
$sql = "SELECT id, username, password, email, full_name, role, is_active 
        FROM admin_users 
        WHERE username = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

// Invalid username
if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(array("message" => "Invalid username or password"));
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

// Check if account is active
if ($user['is_active'] != 1) {
    http_response_code(401);
    echo json_encode(array("message" => "Account is not active"));
    exit();
}

// Validate password ONLY using bcrypt
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Invalid username or password"));
    exit();
}

// Update last login timestamp
$update_sql = "UPDATE admin_users SET last_login = NOW() WHERE id = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("i", $user['id']);
$update_stmt->execute();
$update_stmt->close();

// Set secure session data
$_SESSION['admin_user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['role'] = $user['role'];
$_SESSION['last_activity'] = time();

$conn->close();

// Successful login response
http_response_code(200);
echo json_encode(array(
    "message" => "Login successful",
    "username" => $user['username'],
    "full_name" => $user['full_name'],
    "email" => $user['email']
));
?>
