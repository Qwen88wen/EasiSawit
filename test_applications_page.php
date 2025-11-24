<?php
/**
 * Test if customer_applications.html can load data correctly
 */

echo "=== TESTING CUSTOMER APPLICATIONS PAGE DATA LOADING ===\n\n";

// Simulate what the page does
session_start();
$_SESSION['logged_in'] = true;
$_SESSION['username'] = 'test_admin';

// Test 1: Call the API that customer_applications.html uses
echo "Test 1: Calling api_get_customer_applications.php...\n";

$url = 'http://localhost/easisawit/api/api_get_customer_applications.php';

// Create session cookie
$cookie = session_name() . '=' . session_id();

$options = [
    'http' => [
        'header'  => "Cookie: {$cookie}\r\n",
        'method'  => 'GET',
    ],
];

$context = stream_context_create($options);
$result = @file_get_contents($url, false, $context);

if ($result === false) {
    echo "❌ Failed to call API\n";
    $error = error_get_last();
    echo "Error: {$error['message']}\n\n";

    // Try direct database query
    echo "Trying direct database query instead...\n";
    include 'api/db_connect.php';

    $sql = "SELECT id, name, email, contact, company_name, rate_requested, status,
            rejection_reason, submitted_at, reviewed_at, reviewed_by
            FROM customer_applications
            ORDER BY submitted_at DESC";
    $dbResult = $conn->query($sql);

    if ($dbResult) {
        $applications = [];
        while ($row = $dbResult->fetch_assoc()) {
            $applications[] = $row;
        }

        echo "✅ Direct query successful\n";
        echo "Total applications: " . count($applications) . "\n\n";

        $result = json_encode(['applications' => $applications]);
    } else {
        echo "❌ Database query failed: {$conn->error}\n";
        exit;
    }

} else {
    echo "✅ API call successful\n\n";
}

$data = json_decode($result, true);

if (!isset($data['applications'])) {
    echo "❌ No 'applications' key in response\n";
    echo "Response: {$result}\n";
    exit;
}

$applications = $data['applications'];
echo "Total applications returned: " . count($applications) . "\n\n";

// Test 2: Display applications by status
echo "Test 2: Applications by status...\n";

$pending = array_filter($applications, function($app) {
    return $app['status'] === 'pending';
});

$approved = array_filter($applications, function($app) {
    return $app['status'] === 'approved';
});

$rejected = array_filter($applications, function($app) {
    return $app['status'] === 'rejected';
});

echo "Pending: " . count($pending) . "\n";
echo "Approved: " . count($approved) . "\n";
echo "Rejected: " . count($rejected) . "\n\n";

// Test 3: Display all pending applications (what user should see)
echo "Test 3: PENDING APPLICATIONS (What you should see on the page):\n";
echo str_repeat("=", 100) . "\n\n";

if (count($pending) === 0) {
    echo "⚠️  NO PENDING APPLICATIONS FOUND!\n";
    echo "This is why you might not see anything on the page.\n\n";
} else {
    foreach ($pending as $app) {
        echo "Application ID: {$app['id']}\n";
        echo "Name: {$app['name']}\n";
        echo "Email: {$app['email']}\n";
        echo "Contact: {$app['contact']}\n";
        echo "Company: " . ($app['company_name'] ?? 'N/A') . "\n";
        echo "Rate: " . ($app['rate_requested'] ? 'RM ' . number_format($app['rate_requested'], 2) : 'N/A') . "\n";
        echo "Status: {$app['status']}\n";
        echo "Submitted: {$app['submitted_at']}\n";
        echo str_repeat("-", 100) . "\n";
    }
}

echo "\n";

// Test 4: Recent submissions
echo "Test 4: MOST RECENT SUBMISSIONS:\n";
echo str_repeat("=", 100) . "\n";

usort($applications, function($a, $b) {
    return strtotime($b['submitted_at']) - strtotime($a['submitted_at']);
});

$recent = array_slice($applications, 0, 5);

printf("%-5s %-25s %-35s %-15s %-10s %-20s\n", "ID", "Name", "Email", "Company", "Status", "Submitted");
echo str_repeat("-", 115) . "\n";

foreach ($recent as $app) {
    printf("%-5s %-25s %-35s %-15s %-10s %-20s\n",
        $app['id'],
        substr($app['name'], 0, 25),
        substr($app['email'], 0, 35),
        substr($app['company_name'] ?? 'N/A', 0, 15),
        $app['status'],
        $app['submitted_at']
    );
}

echo "\n=== DIAGNOSIS ===\n";
echo "If you submitted an application but don't see it:\n\n";

echo "1. Check if your submission is in the list above\n";
echo "2. Make sure you're looking at the 'Pending' tab on the page\n";
echo "3. Try refreshing the Customer Applications page (F5)\n";
echo "4. Clear browser cache (Ctrl+Shift+R)\n";
echo "5. Check if the status filter is set correctly\n\n";

echo "Expected behavior:\n";
echo "- When you submit via register.html, a new record is created with status='pending'\n";
echo "- It should appear immediately in customer_applications.html under 'Pending' tab\n";
echo "- Currently there are " . count($pending) . " pending applications\n";

echo "\n=== TEST COMPLETE ===\n";
?>
