<?php
// api/api_clear_all_worklogs.php
// API endpoint to clear all work log records

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Security: Check session/authentication
include 'check_auth.php';

include 'db_connect.php';

// Only allow POST or DELETE methods
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed. Use POST or DELETE."));
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // First, get counts before deletion
    $count_sql = "SELECT COUNT(*) as total FROM work_logs";
    $result = $conn->query($count_sql);
    $row = $result->fetch_assoc();
    $total_worklogs = $row['total'];

    $settlement_count_sql = "SELECT COUNT(*) as total FROM settlement_work_logs";
    $settlement_result = $conn->query($settlement_count_sql);
    $settlement_row = $settlement_result->fetch_assoc();
    $total_settlement_logs = $settlement_row['total'];

    if ($total_worklogs == 0) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "No work log records to delete.",
            "work_logs_deleted" => 0,
            "settlement_logs_deleted" => 0
        ));
        $conn->close();
        exit();
    }

    // Delete all work logs (settlement_work_logs will be auto-deleted due to ON DELETE CASCADE)
    $delete_sql = "DELETE FROM work_logs";

    if ($conn->query($delete_sql) !== TRUE) {
        throw new Exception("Error deleting work logs: " . $conn->error);
    }

    // Commit transaction
    $conn->commit();

    // Verify deletion
    $verify_result = $conn->query($count_sql);
    $verify_row = $verify_result->fetch_assoc();
    $remaining_worklogs = $verify_row['total'];

    $verify_settlement = $conn->query($settlement_count_sql);
    $verify_settlement_row = $verify_settlement->fetch_assoc();
    $remaining_settlement = $verify_settlement_row['total'];

    http_response_code(200);
    echo json_encode(array(
        "message" => "All work log records have been successfully cleared.",
        "work_logs_deleted" => $total_worklogs,
        "settlement_logs_deleted" => $total_settlement_logs,
        "remaining_work_logs" => $remaining_worklogs,
        "remaining_settlement_logs" => $remaining_settlement
    ));

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();

    http_response_code(500);
    echo json_encode(array(
        "message" => "Failed to clear work log records.",
        "error" => $e->getMessage()
    ));
}

$conn->close();
?>
