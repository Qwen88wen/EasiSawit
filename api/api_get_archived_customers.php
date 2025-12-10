<?php
/**
 * Get Archived Customers
 * GET: /api/api_get_archived_customers.php
 *
 * Returns inactive customers where last_purchase_date is older than 14 days
 * Requires admin authentication
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$archived_customers = array();

// Fetch ARCHIVED customers (last_purchase_date older than 14 days, or NULL)
$sql = "SELECT id, name, rate, contact, acres, remark, remark2, last_purchase_date,
               DATEDIFF(CURDATE(), last_purchase_date) as days_inactive
        FROM customers
        WHERE last_purchase_date IS NULL
           OR last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        ORDER BY last_purchase_date DESC";

$result = $conn->query($sql);

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $archived_customers[] = $row;
        }
    }
    $result->free();
}

$conn->close();
http_response_code(200);
echo json_encode($archived_customers);
?>
