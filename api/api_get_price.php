<?php
// Set headers to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// --- Configuration ---
// FIX: Use __DIR__ to make the path relative to this script, not the working directory.
$cache_file = __DIR__ . '/price_cache.json'; // This file MUST be writable
$cache_time = 3600 * 4; // 4 hours
$mpob_url = 'https://bepi.mpob.gov.my/admin2/price_local_daily_view_cpo_msia.php?more=Y&jenis=3M';

/**
 * Fetches the latest price from MPOB by parsing the chart's JavaScript data.
 *
 * @param string $url The MPOB URL to scrape.
 * @return array An array with either 'data' on success or 'error' on failure.
 */
function scrape_mpob_price($url) {
    // 1. Fetch HTML using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'CustomerPriceBot/1.0 (PHP)');
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // It's good practice to leave this on
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err = curl_error($ch);
    curl_close($ch);

    // --- DETAILED ERROR CHECKING ---
    if ($curl_err) {
        return ['error' => "cURL Error: " . $curl_err];
    }
    if (!$html || $http_code != 200) {
        return ['error' => "HTTP Error: Failed to fetch HTML from MPOB. Server responded with HTTP Code: " . $http_code];
    }

    // --- 2. NEW ROBUST REGEX METHOD (2-Stage) ---

    // Stage 1: Get the entire JS array strings
    
    // Find the 'categories' array string. Use non-greedy .*? to stop at the first ']'
    $date_array_pattern = "/categories:\s*(\[.*?\])/s";
    if (!preg_match($date_array_pattern, $html, $date_array_match)) {
        return ['error' => "Regex Error: Could not find 'categories' array. Website may have changed."];
    }
    $date_array_string = $date_array_match[1];

    // Find the 'series.data' array string. Use non-greedy .*? to stop at the first ']'
    $price_array_pattern = "/series:\s*\[\{\s*name:.*?data:\s*(\[.*?\])/s";
    if (!preg_match($price_array_pattern, $html, $price_array_match)) {
        return ['error' => "Regex Error: Could not find 'series.data' array. Website may have changed."];
    }
    $price_array_string = $price_array_match[1];

    // Stage 2: Get all items from the strings and find the last one

    // Find all quoted dates (e.g., 'Oct 30, 2025')
    if (!preg_match_all("/'([^']+)'/", $date_array_string, $all_dates) || empty($all_dates[1])) {
        return ['error' => "Regex Error: Found 'categories' array, but it contained no dates."];
    }

    // Find all numbers (e.g., 4239.00)
    if (!preg_match_all("/([\d\.]+)/", $price_array_string, $all_prices) || empty($all_prices[1])) {
         return ['error' => "Regex Error: Found 'series.data' array, but it contained no prices."];
    }
    
    // Get the *last* item from each match
    $latest_date_str = end($all_dates[1]);
    $latest_price_str = end($all_prices[1]);


    // 3. Clean and format
    $price_float = floatval(str_replace(',', '', $latest_price_str));

    // Convert date string "Oct 30, 2025" to "2025-10-30"
    $date_obj = DateTime::createFromFormat('M d, Y', $latest_date_str);
    if (!$date_obj) {
        // Fallback for different date format e.g. "d F Y" (30 October 2025)
        $date_obj = DateTime::createFromFormat('d F Y', $latest_date_str);
    }
    $date_iso = $date_obj ? $date_obj->format('Y-m-d') : $latest_date_str; // Fallback

    if ($price_float == 0) {
        // This check is a safeguard
        return ['error' => "Parse Error: Regex matched, but price was 0. Check regex patterns."];
    }

    // --- SUCCESS ---
    return [
        'data' => [
            'latest_date' => $date_iso,
            'latest_price' => $price_float,
            'unit' => 'RM/Tonne',
            'retrieved_at' => date('c'),
        ]
    ];
}

// --- Main Caching Logic ---
$data = null;
$error = null;
$cache_warning = null;

// Check if cache file exists and is "fresh"
if (file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_time)) {
    // 1. Cache is fresh, use it.
    $data = json_decode(file_get_contents($cache_file), true);
} else {
    // 2. Cache is stale, scrape new data
    $scrape_result = scrape_mpob_price($mpob_url);

    if (isset($scrape_result['data'])) {
        // --- Scrape SUCCESS ---
        $data = $scrape_result['data'];
        
        // Save the new data to the cache file
        if (!@file_put_contents($cache_file, json_encode($data))) {
            // Add a non-breaking warning if cache write fails
            $cache_warning = "Warning: Could not write to cache file. Check permissions for " . $cache_file;
        }
    } else {
        // --- Scrape FAILED ---
        $error = $scrape_result['error'] ?? 'Unknown scraping error.';
        
        // Try to use the old (stale) cache as a fallback
        if (file_exists($cache_file)) {
            $data = json_decode(file_get_contents($cache_file), true);
            // Add the error to the stale data
            $data['error'] = "FRESH FETCH FAILED: " . $error . " Displaying last known price.";
        }
    }
}

// --- Return JSON ---
if ($data) {
    // Add the cache warning if it was set
    if ($cache_warning) {
        $data['cache_warning'] = $cache_warning;
    }
    echo json_encode($data);
} else {
    // TOTAL FAILURE (no cache, no scrape)
    http_response_code(500); // Send a 500 error code
    echo json_encode(['error' => $error, 'latest_price' => 'N/A']);
}
exit();
?>
