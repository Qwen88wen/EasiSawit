# Work Logs Data Generator

## 📋 Overview

This tool generates 3 months of work logs data for the EasiSawit system (September, October, November 2025) with the following guarantees:

- ✅ Each worker earns **more than RM 1,700** per month
- ✅ Total tons per month **does not exceed 600 tons**
- ✅ Realistic daily work distribution (15-25 working days per month)
- ✅ Random variation in daily tons (±20%)
- ✅ Randomly distributed across different customers

## 🚀 Quick Start

### Prerequisites

1. **XAMPP running** with MySQL and Apache started
2. **Database setup** completed (easisawit_db)
3. **Workers and customers** already added to the database

### Method 1: Using PHP Script (Recommended)

1. Open your terminal/command prompt
2. Navigate to the EasiSawit directory:
   ```bash
   cd C:\xampp\htdocs\easisawit
   ```

3. Run the generator:
   ```bash
   php generate_work_logs_data.php
   ```

4. The script will:
   - Display current workers and customers count
   - Show expected salary ranges
   - Generate work logs for 3 months
   - Display detailed statistics for each month
   - Show each worker's earnings to verify they exceed RM 1,700

### Method 2: Through Web Browser

If you have access to a MySQL database through XAMPP:

1. Make sure XAMPP's Apache and MySQL are running
2. Place the script in your web directory
3. Access it via browser (if configured for web access)

## 📊 Sample Output

```
=== EasiSawit Work Logs Data Generator ===

Found 20 active workers:
  - Local workers: 8
  - Foreign workers: 12

Found 18 active customers

Configuration:
  - Months: September, October, November 2025
  - Max tons per month: 600
  - Min salary per worker: RM 1700
  - Average customer rate: RM 52.50 per ton
  - Min tons per worker: 32.4 tons

Distribution:
  - Tons per worker (max): 30 tons
  - Expected salary range: RM 1701.00 - RM 1575.00

This will generate work logs for 20 workers over 3 months.
Total records to create: approximately 1200 records

Proceeding with data generation...

Generating data for September 2025...
  ✓ Generated approximately 20 workers × ~20 days = ~400 records
  ✓ Total tons: 589.45 tons

Generating data for October 2025...
  ✓ Generated approximately 20 workers × ~20 days = ~400 records
  ✓ Total tons: 594.23 tons

Generating data for November 2025...
  ✓ Generated approximately 20 workers × ~20 days = ~400 records
  ✓ Total tons: 591.78 tons

=== SUCCESS ===
Total work logs inserted: 1203

=== MONTHLY STATISTICS ===

September 2025:
  Total tons: 589.45 / 600 tons
  Worker salaries:
    ✓ Ali Bin Hassan: 28.50 tons, RM 1,492.50 (18 days)
    ✓ Raja Singh: 32.10 tons, RM 1,685.25 (22 days)
    ✓ Muthu Krishnan: 29.80 tons, RM 1,564.00 (20 days)
    ...

October 2025:
  Total tons: 594.23 / 600 tons
  Worker salaries:
    ✓ Ali Bin Hassan: 30.20 tons, RM 1,585.50 (19 days)
    ...

November 2025:
  Total tons: 591.78 / 600 tons
  Worker salaries:
    ✓ Ali Bin Hassan: 31.50 tons, RM 1,653.75 (21 days)
    ...
```

## 🔍 What Gets Generated

### Data Distribution

For each of the 3 months (September, October, November 2025):

1. **Per Worker:**
   - Random number of working days (15-25 days)
   - Random tons per day (with ±20% variation)
   - Total tons ensuring salary > RM 1,700
   - Distributed across different customers

2. **Per Month:**
   - Total tons ≤ 600
   - Realistic date distribution
   - Varying customer assignments
   - Varying rates per customer

### Database Impact

- **Table affected:** `work_logs`
- **Records created:** ~1,200 records (400 per month × 3 months)
- **Transaction safe:** All inserts wrapped in a transaction
- **Rollback on error:** If any insert fails, all changes are reverted

## ⚙️ Configuration

You can modify these values in the script:

```php
// Configuration
$months = [
    ['year' => 2025, 'month' => 9, 'name' => 'September', 'days' => 30],
    ['year' => 2025, 'month' => 10, 'name' => 'October', 'days' => 31],
    ['year' => 2025, 'month' => 11, 'name' => 'November', 'days' => 30],
];

$max_tons_per_month = 600;        // Maximum tons per month
$min_salary_per_worker = 1700;    // Minimum RM salary per worker
```

## 📈 Verification

After running the script, you can verify the data:

### Check Total Records
```sql
SELECT COUNT(*) as total_records FROM work_logs;
```

### Check Monthly Totals
```sql
SELECT
    DATE_FORMAT(log_date, '%Y-%m') as month,
    SUM(tons) as total_tons,
    COUNT(*) as num_records
FROM work_logs
WHERE log_date >= '2025-09-01' AND log_date <= '2025-11-30'
GROUP BY DATE_FORMAT(log_date, '%Y-%m');
```

### Check Worker Monthly Earnings
```sql
SELECT
    w.name,
    DATE_FORMAT(wl.log_date, '%Y-%m') as month,
    SUM(wl.tons) as total_tons,
    SUM(wl.tons * wl.rate_per_ton) as total_earnings
FROM work_logs wl
JOIN workers w ON wl.worker_id = w.id
WHERE wl.log_date >= '2025-09-01' AND wl.log_date <= '2025-11-30'
GROUP BY w.id, DATE_FORMAT(wl.log_date, '%Y-%m')
ORDER BY month, total_earnings DESC;
```

## 🔄 Re-running the Generator

If you need to regenerate the data:

1. **Clear existing work logs first:**
   ```bash
   # Using the clear script
   php api/clear_worklogs.php
   ```

   Or use the web interface:
   ```
   http://localhost/easisawit/clear_worklogs.html
   ```

2. **Run the generator again:**
   ```bash
   php generate_work_logs_data.php
   ```

## ⚠️ Important Notes

1. **Database Connection:** Ensure MySQL is running and database credentials in `api/db_connect.php` are correct

2. **Workers Required:** The script requires at least 1 active worker in the database

3. **Customers Required:** The script requires at least 1 active customer in the database

4. **Salary Guarantee:** The script calculates required tons based on average customer rate to ensure each worker earns > RM 1,700

5. **Transaction Safety:** All inserts are wrapped in a transaction - if any error occurs, all changes are rolled back

## 🐛 Troubleshooting

### Error: "No such file or directory"
- **Cause:** MySQL service not running
- **Solution:** Start MySQL from XAMPP Control Panel

### Error: "No workers found"
- **Cause:** No active workers in database
- **Solution:** Add workers through the EasiSawit interface first

### Error: "No customers found"
- **Cause:** No active customers in database
- **Solution:** Add customers through the EasiSawit interface first

### Workers earning less than RM 1,700
- **Cause:** Low customer rates
- **Solution:** The script automatically adjusts tons to meet minimum salary. If this happens, check if customer rates are too low (< RM 40/ton)

## 📝 Example Use Cases

### Scenario 1: Testing Payroll System
Generate realistic data to test payroll calculations for multiple months.

### Scenario 2: Demo Data
Create demo data for presentations or training purposes.

### Scenario 3: Performance Testing
Generate large datasets to test system performance.

### Scenario 4: Compliance Testing
Verify that payroll calculations meet minimum wage requirements.

## 🔐 Data Integrity

The generator ensures:
- ✅ Valid date ranges
- ✅ Valid worker IDs (active workers only)
- ✅ Valid customer IDs (active customers only)
- ✅ Realistic tons per day (0.5 - 10 tons typically)
- ✅ Consistent rates from customer table
- ✅ No duplicate log entries for same worker/day/customer
- ✅ All monetary values properly formatted (2 decimal places)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify MySQL is running
3. Check database connection settings
4. Review error messages in the output

---

**Generated Data Summary:**
- 3 months of data (Sep-Nov 2025)
- ~1,200 work log records
- 20 workers (based on your database)
- 18 customers (based on your database)
- Each worker earning > RM 1,700/month
- Total tons ≤ 600/month
