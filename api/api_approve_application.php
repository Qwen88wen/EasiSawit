<?php
/**
 * Approve Customer Application
 * POST: /api/api_approve_application.php
 *
 * Approves a customer application by:
 * 1. Creating a new customer in the customers table
 * 2. Setting last_purchase_date to today (so customer appears in Customers page)
 * 3. Updating the application status to 'approved'
 * 4. Recording review details
 *
 * Request JSON:
 * {
 *   "application_id": 123
 * }
 *
 * Response:
 * - Success (200): {"message": "Application approved", "customer_id": 456}
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

// Start transaction
$conn->begin_transaction();

try {
    // 1. Get application details
    $sql = "SELECT * FROM customer_applications WHERE id = ? AND status = 'pending'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $application_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Application not found or already processed");
    }

    $application = $result->fetch_assoc();
    $stmt->close();

    // 2. Check if email already exists in customers table
    $sql = "SELECT id FROM customers WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $application['email']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        throw new Exception("Customer with this email already exists");
    }
    $stmt->close();

    // 3. Insert into customers table
    // Set last_purchase_date to NULL so new customers appear in Archived Customers (no purchases yet)
    // They will become active once their first work log is created
    // Map fields: service_area -> remark, location -> remark2, company_name -> company_name, rate_requested -> rate
    $sql = "INSERT INTO customers (name, email, contact, acres, company_name, rate, remark, remark2, status, last_purchase_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', NULL, NOW(), NOW())";
    $stmt = $conn->prepare($sql);

    $rate = $application['rate_requested'] ?? 0;
    $acres = $application['acres'] ?? null;
    $company_name = $application['company_name'] ?? null;
    $service_area = $application['service_area'] ?? null; // Map service_area to remark (Service Area)
    $location = $application['location'] ?? null; // Map location to remark2

    $stmt->bind_param("sssdsdss",
        $application['name'],
        $application['email'],
        $application['contact'],
        $acres,
        $company_name,
        $rate,
        $service_area,
        $location
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to create customer: " . $stmt->error);
    }

    $customer_id = $conn->insert_id;
    $stmt->close();

    // 4. Update application status
    $reviewed_by = isset($_SESSION['username']) ? $_SESSION['username'] : 'admin';
    $sql = "UPDATE customer_applications
            SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?
            WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $reviewed_by, $application_id);

    if (!$stmt->execute()) {
        throw new Exception("Failed to update application status: " . $stmt->error);
    }
    $stmt->close();

    // 5. Commit transaction
    $conn->commit();

    http_response_code(200);
    echo json_encode(array(
        "message" => "Application approved successfully. Customer has been created.",
        "customer_id" => $customer_id,
        "application_id" => $application_id
    ));

} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();

    http_response_code(400);
    echo json_encode(array("message" => $e->getMessage()));
}

$conn->close();
?>
