<?php
// api/api_delete_worklog.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid work log ID provided."));
    die();
}

$sql = "DELETE FROM work_logs WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array("message" => "Work log was deleted."));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Work log not found with ID {$id}."));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to delete work log."));
}

$stmt->close();
$conn->close();
?>