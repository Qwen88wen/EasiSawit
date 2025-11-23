<?php
/**
 * Customer Application Registration
 * POST: /api/api_submit_application.php
 * 
 * Public endpoint (NO LOGIN REQUIRED) for customer registration
 * Receives customer details and sends email to admin for review
 * Does NOT add customer to database (manual approval process)
 * 
 * Request JSON:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "contact": "016-123-4567",
 *   "company_name": "My Oil Company",
 *   "rate_requested": 50.00
 * }
 * 
 * Response:
 * - Success (201): {"message": "Application submitted successfully"}
 * - Error (400): {"message": "Validation error message"}
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit();
}

include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validation
$required_fields = ['name', 'email', 'contact'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(array("message" => "Field '{$field}' is required"));
        exit();
    }
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid email address"));
    exit();
}

// Sanitize inputs
$name = trim($data['name']);
$email = trim($data['email']);
$contact = trim($data['contact']);
$company_name = isset($data['company_name']) ? trim($data['company_name']) : null;
$rate_requested = isset($data['rate_requested']) ? floatval($data['rate_requested']) : null;

// Insert application into database
$sql = "INSERT INTO customer_applications (name, email, contact, company_name, rate_requested, status) 
        VALUES (?, ?, ?, ?, ?, 'pending')";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $conn->error));
    exit();
}

$stmt->bind_param("ssssd", $name, $email, $contact, $company_name, $rate_requested);

if (!$stmt->execute()) {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to submit application"));
    $stmt->close();
    $conn->close();
    exit();
}

$application_id = $stmt->insert_id;
$stmt->close();

// Send email to admin
$admin_email = "admin@easisawit.local"; // Change this to your admin email
$subject = "New Customer Registration Application - " . $name;

// Build HTML email
$email_body = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 10px; border-radius: 3px; }
        .section { margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #3498db; }
        .label { font-weight: bold; color: #2c3e50; }
        .action-btn { background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block; margin-top: 10px; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>New Customer Registration Application</h2>
        </div>
        
        <div class='section'>
            <p><span class='label'>Applicant Name:</span><br/>" . htmlspecialchars($name) . "</p>
        </div>
        
        <div class='section'>
            <p><span class='label'>Email Address:</span><br/>" . htmlspecialchars($email) . "</p>
        </div>
        
        <div class='section'>
            <p><span class='label'>Contact Number:</span><br/>" . htmlspecialchars($contact) . "</p>
        </div>
";

if ($company_name) {
    $email_body .= "
        <div class='section'>
            <p><span class='label'>Company Name:</span><br/>" . htmlspecialchars($company_name) . "</p>
        </div>
    ";
}

if ($rate_requested) {
    $email_body .= "
        <div class='section'>
            <p><span class='label'>Requested Rate:</span><br/>RM " . number_format($rate_requested, 2) . " per ton</p>
        </div>
    ";
}

$email_body .= "
        <div class='section'>
            <p><span class='label'>Application ID:</span><br/>#" . $application_id . "</p>
            <p><span class='label'>Submitted:</span><br/>" . date('Y-m-d H:i:s') . "</p>
        </div>
        
        <div class='footer'>
            <p>Please review this application in the EasiSawit admin dashboard and take appropriate action (Approve/Reject).</p>
            <p style='margin-top: 10px;'>Dashboard URL: <a href='http://localhost/easisawit/'>http://localhost/easisawit/</a></p>
        </div>
    </div>
</body>
</html>
";

// Send email (requires mail server configured on your system)
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: noreply@easisawit.local\r\n";

// Attempt to send email (may fail on local dev without mail server)
$email_sent = @mail($admin_email, $subject, $email_body, $headers);

$conn->close();

http_response_code(201);
echo json_encode(array(
    "message" => "Application submitted successfully. Please check your email for confirmation.",
    "application_id" => $application_id,
    "email_sent" => $email_sent
));
?>
