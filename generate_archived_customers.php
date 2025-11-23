<?php
/**
 * Generate Archived Customer Test Data
 *
 * This script inserts test customers with old last_purchase_date values
 * to simulate archived customers (inactive for >14 days)
 *
 * Usage: php generate_archived_customers.php
 */

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "easisawit_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");
    echo "Connected to database successfully.\n\n";

    // Start transaction
    $conn->begin_transaction();

    // Customers data with various inactive periods
    $archived_customers = [
        // Customers inactive for 15-30 days
        ['Kedah Plantation Estate', '011-1111111', 45.00, 'North Region', 'Sungai Petani', 15],
        ['JB Agricultural Co', '011-2222222', 48.00, 'South Region', 'Johor Bahru', 16],
        ['Pahang Palm Industries', '011-3333333', 52.00, 'East Region', 'Kuantan', 18],
        ['Negeri Sembilan Agro Sdn Bhd', '011-4444444', 46.00, 'Central Region', 'Seremban', 20],
        ['Perak Sawit Holdings', '011-5555555', 50.00, 'West Region', 'Ipoh', 22],

        // Customers inactive for 1-2 months
        ['Sabah Palm Oil Mill', '011-6666666', 44.00, 'Sabah', 'Kota Kinabalu', 25],
        ['Sarawak Plantation Group', '011-7777777', 47.00, 'Sarawak', 'Kuching', 30],
        ['Penang Agricultural Services', '011-8888888', 51.00, 'Penang', 'George Town', 35],
        ['Melaka Agro Resources', '011-9999999', 49.00, 'Melaka', 'Melaka City', 40],
        ['Temerloh Estate Management', '011-0000000', 53.00, 'Pahang', 'Temerloh', 45],

        // Customers inactive for 2-3 months
        ['Kedah Oil Palm Cooperative', '011-1234567', 55.00, 'Kedah', 'Alor Setar', 60],
        ['Kelantan Plantation Services', '011-2345678', 48.00, 'Kelantan', 'Kota Bharu', 75],
        ['Terengganu Agro Enterprise', '011-3456789', 46.00, 'Terengganu', 'Kuala Terengganu', 80],

        // Recently inactive: Exactly 15 days ago (should be archived)
        ['Perlis Palm Industries', '011-4567890', 50.00, 'Perlis', 'Kangar', 15],
    ];

    $insert_count = 0;
    $stmt = $conn->prepare("INSERT INTO customers (name, contact, rate, remark, remark2, created_at, last_purchase_date) VALUES (?, ?, ?, ?, ?, NOW(), DATE_SUB(CURDATE(), INTERVAL ? DAY))");

    foreach ($archived_customers as $customer) {
        $name = $customer[0];
        $contact = $customer[1];
        $rate = $customer[2];
        $remark = $customer[3];
        $remark2 = $customer[4];
        $days_ago = $customer[5];

        $stmt->bind_param("ssdssi", $name, $contact, $rate, $remark, $remark2, $days_ago);

        if ($stmt->execute()) {
            $insert_count++;
            echo "✓ Inserted: $name (inactive for $days_ago days)\n";
        } else {
            echo "✗ Failed to insert: $name - " . $stmt->error . "\n";
        }
    }

    // Insert customers with NULL last_purchase_date (newly registered, no purchases yet)
    $null_customers = [
        ['Port Dickson Palm Estate', '011-5678901', 45.00, 'Negeri Sembilan', 'Port Dickson'],
        ['KL Metropolitan Agro Services', '011-6789012', 47.00, 'Kuala Lumpur', 'KLCC'],
        ['Putrajaya Green Holdings', '011-7890123', 50.00, 'Putrajaya', 'Precinct 1'],
    ];

    $stmt_null = $conn->prepare("INSERT INTO customers (name, contact, rate, remark, remark2, created_at, last_purchase_date) VALUES (?, ?, ?, ?, ?, NOW(), NULL)");

    foreach ($null_customers as $customer) {
        $name = $customer[0];
        $contact = $customer[1];
        $rate = $customer[2];
        $remark = $customer[3];
        $remark2 = $customer[4];

        $stmt_null->bind_param("ssdss", $name, $contact, $rate, $remark, $remark2);

        if ($stmt_null->execute()) {
            $insert_count++;
            echo "✓ Inserted: $name (new registration, no purchases)\n";
        } else {
            echo "✗ Failed to insert: $name - " . $stmt_null->error . "\n";
        }
    }

    $stmt->close();
    $stmt_null->close();

    // Commit transaction
    $conn->commit();

    echo "\n========================================\n";
    echo "✓ Successfully inserted $insert_count archived customers!\n";
    echo "========================================\n\n";

    // Show summary statistics
    $result = $conn->query("SELECT
        COUNT(*) as total_customers,
        COUNT(CASE WHEN last_purchase_date IS NULL OR last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 14 DAY) THEN 1 END) as archived_count,
        COUNT(CASE WHEN last_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) THEN 1 END) as active_count
    FROM customers");

    if ($result) {
        $stats = $result->fetch_assoc();
        echo "Database Statistics:\n";
        echo "  Total Customers: {$stats['total_customers']}\n";
        echo "  Active Customers: {$stats['active_count']}\n";
        echo "  Archived Customers: {$stats['archived_count']}\n\n";
    }

    // Show sample of archived customers
    echo "Sample Archived Customers:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-30s %-15s %-15s %s\n", "Name", "Last Purchase", "Days Inactive", "Status");
    echo str_repeat("-", 80) . "\n";

    $result = $conn->query("SELECT
        name,
        last_purchase_date,
        CASE
            WHEN last_purchase_date IS NULL THEN NULL
            ELSE DATEDIFF(CURDATE(), last_purchase_date)
        END as days_inactive
    FROM customers
    WHERE last_purchase_date IS NULL OR last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    ORDER BY last_purchase_date DESC
    LIMIT 10");

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $last_purchase = $row['last_purchase_date'] ?? 'No purchases';
            $days = $row['days_inactive'] !== null ? $row['days_inactive'] : 'N/A';
            $status = $row['last_purchase_date'] === null ? 'No purchases' : 'Archived';
            printf("%-30s %-15s %-15s %s\n",
                substr($row['name'], 0, 29),
                $last_purchase,
                $days,
                $status
            );
        }
    }
    echo str_repeat("-", 80) . "\n";

    $conn->close();

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
        $conn->close();
    }
    die("Error: " . $e->getMessage() . "\n");
}
?>
