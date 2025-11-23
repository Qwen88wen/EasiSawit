<?php
// api_get_customers.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php'; // Connect to the database

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$customers = array();

// Only fetch ACTIVE customers (last_purchase_date within last 14 days)
$sql = "SELECT id, name, rate, contact, remark, remark2, last_purchase_date FROM customers
        WHERE last_purchase_date IS NOT NULL
        AND last_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        ORDER BY last_purchase_date DESC";
$result = $conn->query($sql);

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
    }
    $result->free();
} else {
    // Return empty list with 200 if table missing; avoids hard failure on first run
}

$conn->close();
http_response_code(200);
echo json_encode($customers);

?>