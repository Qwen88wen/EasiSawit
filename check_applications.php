<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check Applications - EasiSawit</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">Customer Applications Database Check</h1>
            <p class="text-gray-600 mb-4">This page shows ALL applications in the database (no login required)</p>
        </div>

        <?php
        include 'api/db_connect.php';

        // Get all applications
        $sql = "SELECT id, name, email, contact, location, acres, company_name, rate_requested, status, submitted_at
                FROM customer_applications
                ORDER BY submitted_at DESC";
        $result = $conn->query($sql);

        $total = $result->num_rows;
        $pending = 0;
        $approved = 0;
        $rejected = 0;

        $applications = [];
        while ($row = $result->fetch_assoc()) {
            $applications[] = $row;
            if ($row['status'] === 'pending') $pending++;
            if ($row['status'] === 'approved') $approved++;
            if ($row['status'] === 'rejected') $rejected++;
        }
        ?>

        <!-- Statistics -->
        <div class="grid grid-cols-4 gap-6 mb-6">
            <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <p class="text-sm text-blue-600 font-semibold mb-2">Total Applications</p>
                <p class="text-4xl font-bold text-blue-900"><?php echo $total; ?></p>
            </div>
            <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <p class="text-sm text-yellow-600 font-semibold mb-2">Pending</p>
                <p class="text-4xl font-bold text-yellow-900"><?php echo $pending; ?></p>
            </div>
            <div class="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <p class="text-sm text-green-600 font-semibold mb-2">Approved</p>
                <p class="text-4xl font-bold text-green-900"><?php echo $approved; ?></p>
            </div>
            <div class="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <p class="text-sm text-red-600 font-semibold mb-2">Rejected</p>
                <p class="text-4xl font-bold text-red-900"><?php echo $rejected; ?></p>
            </div>
        </div>

        <!-- Applications List -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">All Applications</h2>

            <?php if ($total === 0): ?>
                <p class="text-gray-500 text-center py-8">No applications found</p>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b-2 border-gray-200">
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acres</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($applications as $app): ?>
                                <tr class="border-b border-gray-100 hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm font-mono"><?php echo $app['id']; ?></td>
                                    <td class="px-4 py-3 text-sm font-medium"><?php echo htmlspecialchars($app['name']); ?></td>
                                    <td class="px-4 py-3 text-sm text-gray-600"><?php echo htmlspecialchars($app['email']); ?></td>
                                    <td class="px-4 py-3 text-sm text-gray-600"><?php echo htmlspecialchars($app['contact']); ?></td>
                                    <td class="px-4 py-3 text-sm text-gray-600"><?php echo $app['location'] ? htmlspecialchars($app['location']) : '<span class="text-gray-400">N/A</span>'; ?></td>
                                    <td class="px-4 py-3 text-sm text-gray-600"><?php echo $app['acres'] ? number_format($app['acres'], 2) . ' acres' : '<span class="text-gray-400">N/A</span>'; ?></td>
                                    <td class="px-4 py-3">
                                        <?php
                                        $statusColors = [
                                            'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                            'approved' => 'bg-green-100 text-green-800 border-green-200',
                                            'rejected' => 'bg-red-100 text-red-800 border-red-200'
                                        ];
                                        $color = $statusColors[$app['status']] ?? 'bg-gray-100 text-gray-800 border-gray-200';
                                        ?>
                                        <span class="px-2 py-1 text-xs font-semibold rounded border <?php echo $color; ?>">
                                            <?php echo ucfirst($app['status']); ?>
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-500"><?php echo date('Y-m-d H:i', strtotime($app['submitted_at'])); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>

        <!-- Instructions -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
            <h3 class="text-lg font-bold text-blue-900 mb-3">ℹ️ How to View Applications in Admin Panel</h3>
            <ol class="list-decimal list-inside space-y-2 text-blue-800">
                <li>Make sure you are <strong>logged in</strong> to the admin panel</li>
                <li>Navigate to: <a href="customer_applications.html" class="underline font-semibold">customer_applications.html</a></li>
                <li>The page requires authentication - you must login first</li>
                <li>After login, you should see all <?php echo $pending; ?> pending applications</li>
                <li>Click on the "Pending" tab to filter pending applications</li>
                <li>If you still don't see them, try:
                    <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Press F5 to refresh the page</li>
                        <li>Clear browser cache (Ctrl+Shift+R)</li>
                        <li>Check browser console for errors (F12)</li>
                    </ul>
                </li>
            </ol>
        </div>

        <div class="mt-6 text-center">
            <a href="login.html" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Go to Login Page
            </a>
            <a href="customer_applications.html" class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition ml-3">
                Go to Customer Applications (Requires Login)
            </a>
        </div>

        <?php $conn->close(); ?>
    </div>
</body>
</html>
