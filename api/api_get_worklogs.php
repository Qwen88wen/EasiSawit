<?php
// api/api_get_worklogs.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// We use a JOIN to get the worker and customer names
$sql = "SELECT
            wl.id,
            wl.log_date,
            wl.worker_id,
            wl.customer_id,
            w.name AS worker_name,
            c.name AS customer_name,
            wl.tons,
            wl.rate_per_ton
        FROM
            work_logs wl
        JOIN
            workers w ON wl.worker_id = w.id
        JOIN
            customers c ON wl.customer_id = c.id
        ORDER BY
            wl.log_date DESC";

$logs = array();
$result = $conn->query($sql);

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
    }
    $result->free();
} else {
    // Return empty list with 200 to avoid failing before tables are created
}

$conn->close();
http_response_code(200);
echo json_encode($logs);
?>