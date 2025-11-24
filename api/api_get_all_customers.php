<?php
// api/api_get_all_customers.php
// Get all customers including pending applications

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$customers = array();

// Get ALL customers including pending applications (status field)
$sql = "SELECT id, name, email, contact, company_name as location, status, created_at, updated_at
        FROM customers
        ORDER BY created_at DESC";

$result = $conn->query($sql);

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
    }
    $result->free();
}

$conn->close();
http_response_code(200);
echo json_encode(array("customers" => $customers));
?>
