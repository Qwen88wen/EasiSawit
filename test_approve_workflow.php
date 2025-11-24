<?php
// Test script to verify approve application workflow
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing Approve Application Workflow ===\n\n";

include 'api/db_connect.php';

// Test 1: Check current applications
echo "1. Checking current applications:\n";
$result = $conn->query("SELECT id, name, email, contact, location, acres, company_name, rate_requested, status FROM customer_applications ORDER BY submitted_at DESC LIMIT 5");
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "   Application #{$row['id']}: {$row['name']} ({$row['email']}) - Status: {$row['status']}\n";
        if ($row['status'] === 'pending') {
            echo "     → Location: " . ($row['location'] ?? 'NULL') . "\n";
            echo "     → Acres: " . ($row['acres'] ?? 'NULL') . "\n";
            echo "     → Company: " . ($row['company_name'] ?? 'NULL') . "\n";
            echo "     → Rate: " . ($row['rate_requested'] ?? 'NULL') . "\n";
        }
    }
} else {
    echo "   No applications found\n";
}

// Test 2: Check field mapping
echo "\n2. Field mapping from customer_applications to customers:\n";
echo "   customer_applications.name          -> customers.name\n";
echo "   customer_applications.email         -> customers.email\n";
echo "   customer_applications.contact       -> customers.contact\n";
echo "   customer_applications.acres         -> customers.acres\n";
echo "   customer_applications.company_name  -> customers.company_name\n";
echo "   customer_applications.location      -> customers.remark2 (Location)\n";
echo "   customer_applications.rate_requested -> customers.rate\n";

// Test 3: Check if customers table has all necessary fields
echo "\n3. Verifying customers table structure:\n";
$fields = ['name', 'email', 'contact', 'acres', 'company_name', 'rate', 'remark', 'remark2', 'status', 'last_purchase_date'];
$result = $conn->query("DESCRIBE customers");
$existing_fields = [];
while ($row = $result->fetch_assoc()) {
    $existing_fields[] = $row['Field'];
}

foreach ($fields as $field) {
    $exists = in_array($field, $existing_fields);
    echo "   - $field: " . ($exists ? "✓ EXISTS" : "✗ MISSING") . "\n";
}

// Test 4: Sample data simulation
echo "\n4. Sample application data that will be approved:\n";
echo "   When approving application #1:\n";
echo "   {\n";
echo "     name: 'Test Customer',\n";
echo "     email: 'test@example.com',\n";
echo "     contact: '012-3456789',\n";
echo "     location: 'Kuala Lumpur',        → remark2\n";
echo "     acres: 150.50,\n";
echo "     company_name: 'ABC Plantation',\n";
echo "     rate_requested: 55.00,            → rate\n";
echo "   }\n";
echo "   Will create customer with:\n";
echo "   {\n";
echo "     name: 'Test Customer',\n";
echo "     email: 'test@example.com',\n";
echo "     contact: '012-3456789',\n";
echo "     acres: 150.50,\n";
echo "     company_name: 'ABC Plantation',\n";
echo "     rate: 55.00,\n";
echo "     remark: NULL,                     ← Service Area (can be NULL)\n";
echo "     remark2: 'Kuala Lumpur',         ← Location\n";
echo "     status: 'Active',\n";
echo "     last_purchase_date: TODAY\n";
echo "   }\n";

$conn->close();

echo "\n=== Workflow Test Complete ===\n";
echo "\nTo test the actual approval:\n";
echo "1. Create a test application\n";
echo "2. Use the UI or API to approve it\n";
echo "3. Check the customers table to verify all fields are copied correctly\n";
?>
