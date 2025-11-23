<?php
// api/api_update_worker.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

// 1. Get JSON data from frontend
$data = json_decode(file_get_contents("php://input"));

// 2. Validate input fields
if (
    !isset($data->id) || 
    !isset($data->name) ||
    !isset($data->type) ||
    !isset($data->status)
) {
    http_response_code(400);
    echo json_encode([
        "message" => "Unable to update worker. Incomplete data.",
        "received_data" => $data
    ]);
    exit();
}

$id = intval($data->id);
$name = trim($data->name);
$type = trim($data->type);
$status = trim($data->status);

// Handle optional fields
$epf = (!empty($data->epf)) ? trim($data->epf) : null;
$permit = (!empty($data->permit)) ? trim($data->permit) : null;

// Handle new optional fields
$identity_number = isset($data->identity_number) && trim($data->identity_number) !== '' ? trim($data->identity_number) : null;
$identity_type = isset($data->identity_type) && trim($data->identity_type) !== '' ? trim($data->identity_type) : null;
$age = isset($data->age) && $data->age !== '' ? intval($data->age) : null;
$marital_status = isset($data->marital_status) && trim($data->marital_status) !== '' ? trim($data->marital_status) : null;
$children_count = isset($data->children_count) && $data->children_count !== '' ? intval($data->children_count) : 0;
$spouse_working = isset($data->spouse_working) && $data->spouse_working !== '' ? intval($data->spouse_working) : null;
$zakat_monthly = isset($data->zakat_monthly) && $data->zakat_monthly !== '' ? floatval($data->zakat_monthly) : null;

// 3. Prepare the SQL update
$sql = "UPDATE workers SET name = ?, type = ?, epf = ?, permit = ?, status = ?, identity_number = ?, identity_type = ?, age = ?, marital_status = ?, children_count = ?, spouse_working = ?, zakat_monthly = ? WHERE id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["message" => "SQL preparation failed.", "error" => $conn->error]);
    exit();
}

// 4. Bind parameters: 7 strings (name, type, epf, permit, status, identity_number, identity_type),
//                      1 int (age), 1 string (marital_status), 2 ints (children_count, spouse_working),
//                      1 double (zakat_monthly), 1 int (id)
$stmt->bind_param("sssssssisiidi", $name, $type, $epf, $permit, $status, $identity_number, $identity_type, $age, $marital_status, $children_count, $spouse_working, $zakat_monthly, $id);

// 5. Execute and handle result
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode([
            "message" => "Worker ID {$id} successfully updated.",
            "rows_affected" => $stmt->affected_rows,
            "changed" => true // <-- FIX: Send clear flag
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            "message" => "Worker ID {$id} updated, but no changes were made (data identical).",
            "changed" => false // <-- FIX: Send clear flag
        ]);
    }
} else {
    http_response_code(500);
    echo json_encode([
        "message" => "Database execution failed.",
        "error" => $stmt->error
    ]);
}

// 6. Close statement and connection
$stmt->close();
$conn->close();
?>
