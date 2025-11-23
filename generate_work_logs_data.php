<?php
// generate_work_logs_data.php
// Generate 3 months of work logs data (September, October, November 2025)
// Ensures each piece-rate worker earns more than RM1700 per month
// Total tons per month <= 600

include 'api/db_connect.php';

echo "=== EasiSawit Work Logs Data Generator ===\n\n";

// Step 1: Get all active workers
$workers_sql = "SELECT id, name, type FROM workers WHERE status = 'Active' ORDER BY id";
$workers_result = $conn->query($workers_sql);

if (!$workers_result) {
    die("Error fetching workers: " . $conn->error . "\n");
}

$workers = [];
$local_workers = [];
$foreign_workers = [];

while ($row = $workers_result->fetch_assoc()) {
    $workers[] = $row;
    if ($row['type'] === 'Local') {
        $local_workers[] = $row;
    } else {
        $foreign_workers[] = $row;
    }
}

echo "Found " . count($workers) . " active workers:\n";
echo "  - Local workers: " . count($local_workers) . "\n";
echo "  - Foreign workers: " . count($foreign_workers) . "\n\n";

// Step 2: Get all customers
$customers_sql = "SELECT id, name, rate FROM customers ORDER BY id";
$customers_result = $conn->query($customers_sql);

if (!$customers_result) {
    die("Error fetching customers: " . $conn->error . "\n");
}

$customers = [];
while ($row = $customers_result->fetch_assoc()) {
    $customers[] = $row;
}

echo "Found " . count($customers) . " customers\n\n";

if (count($workers) == 0) {
    die("Error: No workers found. Please add workers first.\n");
}

if (count($customers) == 0) {
    die("Error: No customers found. Please add customers first.\n");
}

// Configuration
$months = [
    ['year' => 2025, 'month' => 9, 'name' => 'September', 'days' => 30],
    ['year' => 2025, 'month' => 10, 'name' => 'October', 'days' => 31],
    ['year' => 2025, 'month' => 11, 'name' => 'November', 'days' => 30],
];

$max_tons_per_month = 900;  // Adjusted for 26 workers to meet minimum salary
$min_salary_per_worker = 1700;

// Calculate required tons per worker to meet minimum salary
// Using average rate from customers
$total_rate = 0;
foreach ($customers as $customer) {
    $total_rate += floatval($customer['rate']);
}
$avg_rate = $total_rate / count($customers);

$min_tons_per_worker = ceil($min_salary_per_worker / $avg_rate * 10) / 10; // Round up to 1 decimal

echo "Configuration:\n";
echo "  - Months: September, October, November 2025\n";
echo "  - Max tons per month: {$max_tons_per_month}\n";
echo "  - Min salary per worker: RM {$min_salary_per_worker}\n";
echo "  - Average customer rate: RM " . number_format($avg_rate, 2) . " per ton\n";
echo "  - Min tons per worker: {$min_tons_per_worker} tons\n\n";

// Calculate distribution
$num_workers = count($workers);
$max_tons_per_worker = floor($max_tons_per_month / $num_workers);

echo "Distribution:\n";
echo "  - Tons per worker (max): {$max_tons_per_worker} tons\n";
echo "  - Expected salary range: RM " . number_format($min_tons_per_worker * $avg_rate, 2) .
     " - RM " . number_format($max_tons_per_worker * $avg_rate, 2) . "\n\n";

// Confirmation
echo "This will generate work logs for {$num_workers} workers over 3 months.\n";
echo "Total records to create: approximately " . ($num_workers * 3 * 20) . " records\n\n";

echo "Proceeding with data generation...\n\n";

// Start transaction
$conn->begin_transaction();

try {
    $total_inserted = 0;
    $month_stats = [];

    foreach ($months as $month_info) {
        $year = $month_info['year'];
        $month = $month_info['month'];
        $month_name = $month_info['name'];
        $days_in_month = $month_info['days'];

        echo "Generating data for {$month_name} {$year}...\n";

        $month_total_tons = 0;
        $worker_month_stats = [];

        // Generate work logs for each worker
        foreach ($workers as $worker) {
            $worker_id = $worker['id'];
            $worker_name = $worker['name'];

            // Randomize tons per worker (ensuring minimum salary)
            $worker_tons = mt_rand($min_tons_per_worker * 10, $max_tons_per_worker * 10) / 10;

            // Distribute work across multiple days in the month
            $num_work_days = mt_rand(15, 25); // Workers work 15-25 days per month
            $tons_per_day = $worker_tons / $num_work_days;

            $worker_total_tons = 0;
            $worker_total_amount = 0;

            // Generate random work days
            $work_days = [];
            while (count($work_days) < $num_work_days) {
                $day = mt_rand(1, $days_in_month);
                if (!in_array($day, $work_days)) {
                    $work_days[] = $day;
                }
            }
            sort($work_days);

            // Create work logs
            foreach ($work_days as $day) {
                // Randomize daily tons (±20% variation)
                $daily_tons = round($tons_per_day * (0.8 + mt_rand(0, 40) / 100), 2);

                // Randomly select a customer
                $customer = $customers[array_rand($customers)];
                $customer_id = $customer['id'];
                $rate = floatval($customer['rate']);

                $log_date = sprintf("%04d-%02d-%02d", $year, $month, $day);

                // Insert work log
                $sql = "INSERT INTO work_logs (log_date, worker_id, customer_id, tons, rate_per_ton)
                        VALUES (?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("siidd", $log_date, $worker_id, $customer_id, $daily_tons, $rate);

                if (!$stmt->execute()) {
                    throw new Exception("Error inserting work log: " . $stmt->error);
                }

                $worker_total_tons += $daily_tons;
                $worker_total_amount += ($daily_tons * $rate);
                $month_total_tons += $daily_tons;
                $total_inserted++;
            }

            $worker_month_stats[] = [
                'name' => $worker_name,
                'tons' => $worker_total_tons,
                'amount' => $worker_total_amount,
                'days' => $num_work_days
            ];
        }

        // Store month statistics
        $month_stats[$month_name] = [
            'total_tons' => $month_total_tons,
            'worker_stats' => $worker_month_stats
        ];

        echo "  ✓ Generated approximately " . count($workers) . " workers × ~20 days = ~" . (count($workers) * 20) . " records\n";
        echo "  ✓ Total tons: " . number_format($month_total_tons, 2) . " tons\n\n";
    }

    // Commit transaction
    $conn->commit();

    echo "=== SUCCESS ===\n";
    echo "Total work logs inserted: {$total_inserted}\n\n";

    // Display detailed statistics
    echo "=== MONTHLY STATISTICS ===\n\n";
    foreach ($month_stats as $month_name => $stats) {
        echo "{$month_name} 2025:\n";
        echo "  Total tons: " . number_format($stats['total_tons'], 2) . " / {$max_tons_per_month} tons\n";
        echo "  Worker salaries:\n";

        foreach ($stats['worker_stats'] as $worker_stat) {
            $status = $worker_stat['amount'] >= $min_salary_per_worker ? "✓" : "✗";
            echo "    {$status} {$worker_stat['name']}: " .
                 number_format($worker_stat['tons'], 2) . " tons, " .
                 "RM " . number_format($worker_stat['amount'], 2) .
                 " ({$worker_stat['days']} days)\n";
        }
        echo "\n";
    }

} catch (Exception $e) {
    $conn->rollback();
    echo "=== ERROR ===\n";
    echo $e->getMessage() . "\n";
    exit(1);
}

$conn->close();
echo "Data generation completed successfully!\n";
?>
