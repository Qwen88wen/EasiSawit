<?php
// api/clear_worklogs.php
// Script to clear all work log records

include 'db_connect.php';

echo "Starting to clear all work log records...\n";

// First, check how many records exist
$count_sql = "SELECT COUNT(*) as total FROM work_logs";
$result = $conn->query($count_sql);
$row = $result->fetch_assoc();
$total_records = $row['total'];

echo "Found {$total_records} work log records.\n";

if ($total_records == 0) {
    echo "No records to delete.\n";
    $conn->close();
    exit(0);
}

// Check settlement_work_logs records
$settlement_count_sql = "SELECT COUNT(*) as total FROM settlement_work_logs";
$settlement_result = $conn->query($settlement_count_sql);
$settlement_row = $settlement_result->fetch_assoc();
$settlement_records = $settlement_row['total'];

echo "Found {$settlement_records} settlement work log records (will be auto-deleted due to CASCADE).\n";

// Delete all work logs (settlement_work_logs will be auto-deleted due to ON DELETE CASCADE)
$delete_sql = "DELETE FROM work_logs";

if ($conn->query($delete_sql) === TRUE) {
    echo "✓ Successfully deleted all {$total_records} work log records.\n";

    // Verify deletion
    $verify_result = $conn->query($count_sql);
    $verify_row = $verify_result->fetch_assoc();
    $remaining = $verify_row['total'];

    echo "Remaining work log records: {$remaining}\n";

    // Verify settlement logs also deleted
    $verify_settlement = $conn->query($settlement_count_sql);
    $verify_settlement_row = $verify_settlement->fetch_assoc();
    $remaining_settlement = $verify_settlement_row['total'];

    echo "Remaining settlement work log records: {$remaining_settlement}\n";

    if ($remaining == 0 && $remaining_settlement == 0) {
        echo "\n✓ All work log records have been successfully cleared!\n";
    }
} else {
    echo "✗ Error deleting work logs: " . $conn->error . "\n";
}

$conn->close();
?>
