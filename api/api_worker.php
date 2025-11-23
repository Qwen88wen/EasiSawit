<?php
// api_get_workers.php

// These headers are important for security and to allow
// your React app to talk to this PHP file (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'db_connect.php'; // Connect to the database

// Handle preflight (harmless here and improves robustness if ever called cross-origin)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$workers = array();

// Gracefully handle cases where table may not exist yet
$sql = "SELECT id, name, type, epf, permit, status FROM workers";
$result = $conn->query($sql);

if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $workers[] = $row;
        }
    }
    $result->free();
} else {
    // Return empty list with 200 to avoid frontend failing before tables are created
    // Optionally include error message for debugging
    // header('X-SQL-Error: ' . urlencode($conn->error));
}

$conn->close();
http_response_code(200);
echo json_encode($workers);

?>