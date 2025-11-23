<?php
// api/api_delete_worker.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
// Allow DELETE requests
header("Access-Control-Allow-Methods: DELETE"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

// 1. Get the worker ID from the URL query parameter
// We expect the request URL to look like: .../api_delete_worker.php?id=123
$id = isset($_GET['id']) ? intval($_GET['id']) : 0; // Use intval for security

// 2. Check if ID is valid
if ($id <= 0) {
    // Send error response
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Invalid worker ID provided."));
    die();
}

// 3. Use Prepared Statements to prevent SQL injection
$sql = "DELETE FROM workers WHERE id = ?";

$stmt = $conn->prepare($sql);

// 4. Bind the ID to the SQL statement
// 'i' means the parameter is an integer
$stmt->bind_param("i", $id);

// 5. Execute the statement
if ($stmt->execute()) {
    // Check if any row was actually deleted
    if ($stmt->affected_rows > 0) {
        // Send success response
        http_response_code(200); // OK
        echo json_encode(array("message" => "Worker was deleted."));
    } else {
        // ID might not exist
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "Worker not found with ID {$id}."));
    }
} else {
    // Send server error response (e.g., database error)
    http_response_code(503); // Service Unavailable
    echo json_encode(array("message" => "Unable to delete worker."));
}

$stmt->close();
$conn->close();
?>