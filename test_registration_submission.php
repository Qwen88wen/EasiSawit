<?php
/**
 * Test customer registration submission
 */

echo "=== TESTING CUSTOMER REGISTRATION SUBMISSION ===\n\n";

// Test 1: Check if API file exists
echo "Test 1: Checking API file...\n";
$apiFile = __DIR__ . '/api/api_submit_application.php';
if (file_exists($apiFile)) {
    echo "✅ API file exists: {$apiFile}\n";
} else {
    echo "❌ API file NOT found: {$apiFile}\n";
    exit;
}
echo "\n";

// Test 2: Simulate a POST request
echo "Test 2: Simulating form submission...\n";

$testData = [
    'name' => 'Test Submission User',
    'email' => 'testsubmit@example.com',
    'contact' => '012-9999888',
    'company_name' => 'Test Submission Company',
    'rate_requested' => 51.50
];

echo "Submitting data:\n";
foreach ($testData as $key => $value) {
    echo "  {$key}: {$value}\n";
}
echo "\n";

// Delete if already exists
include 'api/db_connect.php';
$sql = "DELETE FROM customer_applications WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $testData['email']);
$stmt->execute();

// Prepare the request
$postData = json_encode($testData);
$url = 'http://localhost/easisawit/api/api_submit_application.php';

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => $postData,
    ],
];

$context = stream_context_create($options);
$result = @file_get_contents($url, false, $context);

if ($result === false) {
    echo "❌ Failed to call API\n";
    $error = error_get_last();
    echo "Error: {$error['message']}\n\n";

    // Try direct inclusion instead
    echo "Trying direct PHP inclusion...\n";

    // Simulate POST request for PHP
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_POST = [];

    // Create temp file for php://input
    $tempFile = tempnam(sys_get_temp_dir(), 'php_input');
    file_put_contents($tempFile, $postData);

    // Manually insert using the same logic as API
    $sql = "INSERT INTO customer_applications (name, email, contact, company_name, rate_requested, status)
            VALUES (?, ?, ?, ?, ?, 'pending')";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo "❌ Database error: " . $conn->error . "\n";
        exit;
    }

    $stmt->bind_param("ssssd",
        $testData['name'],
        $testData['email'],
        $testData['contact'],
        $testData['company_name'],
        $testData['rate_requested']
    );

    if ($stmt->execute()) {
        $application_id = $conn->insert_id;
        echo "✅ Application created successfully\n";
        echo "   Application ID: {$application_id}\n";
    } else {
        echo "❌ Failed to insert: {$stmt->error}\n";
    }

} else {
    echo "✅ API call successful\n";
    echo "Response: {$result}\n";

    $response = json_decode($result, true);
    if (isset($response['application_id'])) {
        echo "✅ Application ID: {$response['application_id']}\n";
    }
}

echo "\n";

// Test 3: Verify in database
echo "Test 3: Verifying in database...\n";
$sql = "SELECT id, name, email, contact, company_name, rate_requested, status, submitted_at
        FROM customer_applications
        WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $testData['email']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "✅ Application found in database!\n";
    echo "   ID: {$row['id']}\n";
    echo "   Name: {$row['name']}\n";
    echo "   Email: {$row['email']}\n";
    echo "   Contact: {$row['contact']}\n";
    echo "   Company: {$row['company_name']}\n";
    echo "   Rate: RM {$row['rate_requested']}\n";
    echo "   Status: {$row['status']}\n";
    echo "   Submitted: {$row['submitted_at']}\n";
} else {
    echo "❌ Application NOT found in database\n";
}

echo "\n";

// Test 4: Check all applications
echo "Test 4: Checking all applications in database...\n";
$sql = "SELECT id, name, email, status, submitted_at FROM customer_applications ORDER BY submitted_at DESC LIMIT 10";
$result = $conn->query($sql);

echo "Total applications: {$result->num_rows}\n\n";

if ($result->num_rows > 0) {
    printf("%-5s %-25s %-35s %-10s %-20s\n", "ID", "Name", "Email", "Status", "Submitted");
    echo str_repeat("-", 100) . "\n";

    while ($row = $result->fetch_assoc()) {
        printf("%-5s %-25s %-35s %-10s %-20s\n",
            $row['id'],
            substr($row['name'], 0, 25),
            substr($row['email'], 0, 35),
            $row['status'],
            $row['submitted_at']
        );
    }
} else {
    echo "No applications found!\n";
}

$conn->close();

echo "\n=== TEST COMPLETE ===\n";
?>
