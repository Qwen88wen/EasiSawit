<?php
// api_get_workers.php
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
$sql = "SELECT id, name, identity_number, identity_type, type, age, epf, permit, status, marital_status, children_count, spouse_working, zakat_monthly FROM workers";
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