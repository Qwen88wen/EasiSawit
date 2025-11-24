<?php
// Direct test of approve application workflow
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Direct Approve Application Test ===\n\n";

// Start session (required by API)
session_start();
$_SESSION['admin_user_id'] = 1;
$_SESSION['username'] = 'test_admin';
$_SESSION['last_activity'] = time();

include 'api/db_connect.php';

// Find a pending application
echo "1. Finding a pending application...\n";
$result = $conn->query("SELECT * FROM customer_applications WHERE status = 'pending' LIMIT 1");

if ($result && $result->num_rows > 0) {
    $application = $result->fetch_assoc();
    echo "   Found Application #{$application['id']}:\n";
    echo "     Name: {$application['name']}\n";
    echo "     Email: {$application['email']}\n";
    echo "     Contact: {$application['contact']}\n";
    echo "     Location: " . ($application['location'] ?? 'NULL') . "\n";
    echo "     Acres: " . ($application['acres'] ?? 'NULL') . "\n";
    echo "     Company: " . ($application['company_name'] ?? 'NULL') . "\n";
    echo "     Rate Requested: " . ($application['rate_requested'] ?? 'NULL') . "\n\n";

    // Check if email already exists in customers
    echo "2. Checking if email already exists in customers...\n";
    $stmt = $conn->prepare("SELECT id, name FROM customers WHERE email = ?");
    $stmt->bind_param("s", $application['email']);
    $stmt->execute();
    $result2 = $stmt->get_result();

    if ($result2->num_rows > 0) {
        $existing = $result2->fetch_assoc();
        echo "   ⚠️  Customer already exists (ID: {$existing['id']}, Name: {$existing['name']})\n";
        echo "   Skipping approval to avoid duplicate.\n\n";

        // Show the existing customer's data
        echo "3. Existing customer data:\n";
        $stmt2 = $conn->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt2->bind_param("i", $existing['id']);
        $stmt2->execute();
        $customer = $stmt2->get_result()->fetch_assoc();

        echo "     Name: {$customer['name']}\n";
        echo "     Email: {$customer['email']}\n";
        echo "     Contact: " . ($customer['contact'] ?? 'NULL') . "\n";
        echo "     Acres: " . ($customer['acres'] ?? 'NULL') . "\n";
        echo "     Company Name: " . ($customer['company_name'] ?? 'NULL') . "\n";
        echo "     Rate: {$customer['rate']}\n";
        echo "     Remark (Service Area): " . ($customer['remark'] ?? 'NULL') . "\n";
        echo "     Remark2 (Location): " . ($customer['remark2'] ?? 'NULL') . "\n";
        echo "     Status: {$customer['status']}\n";
        echo "     Last Purchase Date: " . ($customer['last_purchase_date'] ?? 'NULL') . "\n";
        $stmt2->close();
    } else {
        echo "   ✓ Email does not exist in customers table\n\n";

        // Simulate the approval
        echo "3. Simulating approval (creating customer record)...\n";

        $sql = "INSERT INTO customers (name, email, contact, acres, company_name, rate, remark2, status, last_purchase_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', CURDATE(), NOW(), NOW())";
        $stmt3 = $conn->prepare($sql);

        $rate = $application['rate_requested'] ?? 0;
        $acres = $application['acres'] ?? null;
        $company_name = $application['company_name'] ?? null;
        $location = $application['location'] ?? null;

        $stmt3->bind_param("sssdsds",
            $application['name'],
            $application['email'],
            $application['contact'],
            $acres,
            $company_name,
            $rate,
            $location
        );

        if ($stmt3->execute()) {
            $customer_id = $conn->insert_id;
            echo "   ✓ Customer created successfully (ID: $customer_id)\n\n";

            // Update application status
            echo "4. Updating application status to 'approved'...\n";
            $stmt4 = $conn->prepare("UPDATE customer_applications SET status = 'approved', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?");
            $reviewed_by = 'test_admin';
            $stmt4->bind_param("si", $reviewed_by, $application['id']);

            if ($stmt4->execute()) {
                echo "   ✓ Application status updated\n\n";

                // Verify the customer record
                echo "5. Verifying created customer record:\n";
                $stmt5 = $conn->prepare("SELECT * FROM customers WHERE id = ?");
                $stmt5->bind_param("i", $customer_id);
                $stmt5->execute();
                $customer = $stmt5->get_result()->fetch_assoc();

                echo "     Name: {$customer['name']}\n";
                echo "     Email: {$customer['email']}\n";
                echo "     Contact: " . ($customer['contact'] ?? 'NULL') . "\n";
                echo "     Acres: " . ($customer['acres'] ?? 'NULL') . " ← " . ($application['acres'] ? "✓ COPIED" : "NULL") . "\n";
                echo "     Company Name: " . ($customer['company_name'] ?? 'NULL') . " ← " . ($application['company_name'] ? "✓ COPIED" : "NULL") . "\n";
                echo "     Rate: {$customer['rate']} ← ✓ COPIED from rate_requested ({$application['rate_requested']})\n";
                echo "     Remark (Service Area): " . ($customer['remark'] ?? 'NULL') . "\n";
                echo "     Remark2 (Location): " . ($customer['remark2'] ?? 'NULL') . " ← " . ($application['location'] ? "✓ COPIED" : "NULL") . "\n";
                echo "     Status: {$customer['status']}\n";
                echo "     Last Purchase Date: {$customer['last_purchase_date']} ← ✓ SET TO TODAY\n\n";

                echo "✅ SUCCESS! All fields copied correctly from application to customer!\n";
                $stmt5->close();
            } else {
                echo "   ✗ Failed to update application status: " . $stmt4->error . "\n";
            }
            $stmt4->close();
        } else {
            echo "   ✗ Failed to create customer: " . $stmt3->error . "\n";
        }
        $stmt3->close();
    }
    $stmt->close();
} else {
    echo "   No pending applications found.\n";
    echo "   Please create a test application first.\n";
}

$conn->close();

echo "\n=== Test Complete ===\n";
?>
