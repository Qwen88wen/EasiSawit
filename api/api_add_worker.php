<?php
// api/api_add_worker.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

// 1. Get the JSON data sent from the React app
$data = json_decode(file_get_contents("php://input"));

// 2. Check if data is valid
if (
    !isset($data->name) ||
    !isset($data->type) ||
    !isset($data->status)
) {
    // Send error response
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add worker. Incomplete data."));
    die();
}

// Handle null values for epf/permit
$epf = null;
$permit = null;

if ($data->type === 'Local') {
    $epf = isset($data->epf) ? $data->epf : null;
} else if ($data->type === 'Foreign') {
    $permit = isset($data->permit) ? $data->permit : null;
}

// Handle optional new fields
$identity_number = isset($data->identity_number) && trim($data->identity_number) !== '' ? trim($data->identity_number) : null;
$identity_type = isset($data->identity_type) && trim($data->identity_type) !== '' ? trim($data->identity_type) : null;
$age = isset($data->age) && $data->age !== '' ? intval($data->age) : null;
$marital_status = isset($data->marital_status) && trim($data->marital_status) !== '' ? trim($data->marital_status) : null;
$children_count = isset($data->children_count) && $data->children_count !== '' ? intval($data->children_count) : 0;
$spouse_working = isset($data->spouse_working) && $data->spouse_working !== '' ? intval($data->spouse_working) : null;
$zakat_monthly = isset($data->zakat_monthly) && $data->zakat_monthly !== '' ? floatval($data->zakat_monthly) : null;

// Check for duplicate worker
// For Local workers: check name + epf
// For Foreign workers: check name + permit
$duplicate_check_sql = "";
if ($data->type === 'Local' && !empty($epf)) {
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND epf = ? AND type = 'Local'";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $epf);
} else if ($data->type === 'Foreign' && !empty($permit)) {
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND permit = ? AND type = 'Foreign'";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $permit);
} else {
    // If no EPF/Permit provided, just check by name and type
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND type = ?";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $data->type);
}

if (isset($check_stmt)) {
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows > 0) {
        // Duplicate found
        http_response_code(409); // 409 = Conflict
        $error_detail = "";
        if ($data->type === 'Local') {
            $error_detail = !empty($epf) ? "EPF number" : "name";
        } else {
            $error_detail = !empty($permit) ? "permit number" : "name";
        }
        echo json_encode(array(
            "message" => "This worker already exists. A worker with the same name" .
                        ($data->type === 'Local' && !empty($epf) ? ", EPF number" : "") .
                        ($data->type === 'Foreign' && !empty($permit) ? ", permit number" : "") .
                        " has already been added."
        ));
        $check_stmt->close();
        $conn->close();
        die();
    }
    $check_stmt->close();
}

// 3. Use Prepared Statements to prevent SQL injection
$sql = "INSERT INTO workers (name, type, epf, permit, status, identity_number, identity_type, age, marital_status, children_count, spouse_working, zakat_monthly) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

// 4. Bind the variables from the JSON data to the SQL statement
// 'sssssssisiid' = 7 strings (name, type, epf, permit, status, identity_number, identity_type),
//                  1 int (age), 1 string (marital_status), 2 ints (children_count, spouse_working), 1 double (zakat_monthly)
$stmt->bind_param(
    "sssssssisiid",
    $data->name,
    $data->type,
    $epf,
    $permit,
    $data->status,
    $identity_number,
    $identity_type,
    $age,
    $marital_status,
    $children_count,
    $spouse_working,
    $zakat_monthly
);

// 5. Execute the statement
if ($stmt->execute()) {
    // Send success response
    http_response_code(201); // 201 = Created
    echo json_encode(array("message" => "Worker was added."));
} else {
    // Send error response
    http_response_code(503); // 503 = Service Unavailable
    echo json_encode(array("message" => "Unable to add worker."));
}

$stmt->close();
$conn->close();
?>