<?php
/**
 * Login Handler for Admin Users
 * POST: /api/api_login.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit();
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Username and password are required"));
    exit();
}

$username = trim($data['username']);
$password = $data['password'];

// Try direct query first
$sql = "SELECT id, username, password, email, full_name, role, is_active FROM admin_users WHERE username = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(array("message" => "User not found"));
    $stmt->close();
    $conn->close();
    exit();
}

$user = $result->fetch_assoc();
$stmt->close();

// Check if active
if (isset($user['is_active']) && $user['is_active'] != 1) {
    http_response_code(401);
    echo json_encode(array("message" => "Account is not active"));
    $conn->close();
    exit();
}

// Verify password
$passwordValid = false;

// Try bcrypt
if (password_verify($password, $user['password'])) {
    $passwordValid = true;
} 
// Try plain text
elseif ($password === $user['password']) {
    $passwordValid = true;
}

if (!$passwordValid) {
    http_response_code(401);
    echo json_encode(array(
        "message" => "Wrong password",
        "debug" => array(
            "received_password_length" => strlen($password),
            "stored_password_length" => strlen($user['password']),
            "passwords_match" => ($password === $user['password']) ? "yes" : "no"
        )
    ));
    $conn->close();
    exit();
}

// Update last login
$update_sql = "UPDATE admin_users SET last_login = NOW() WHERE id = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("i", $user['id']);
$update_stmt->execute();
$update_stmt->close();

// Set session variables
$_SESSION['admin_user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['role'] = $user['role'];
$_SESSION['last_activity'] = time();

$conn->close();

http_response_code(200);
echo json_encode(array(
    "message" => "Login successful",
    "username" => $user['username'],
    "full_name" => $user['full_name'],
    "email" => $user['email']
));
?>