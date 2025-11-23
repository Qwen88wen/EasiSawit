#!/usr/bin/env python3
"""
EasiSawit Test Data Generator
Generates 3 months of realistic work log data

Features:
- Excludes weekends (Saturday & Sunday)
- Excludes Malaysian public holidays
- Includes archived and active customers
- Realistic worker productivity patterns
- Various scenarios for testing
"""

import mysql.connector
from datetime import datetime, timedelta
import random
from typing import List, Dict, Tuple

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'easisawit_db'
}

# Malaysian Public Holidays for testing period (2025)
MALAYSIAN_HOLIDAYS_2025 = [
    # September 2025
    datetime(2025, 9, 16),  # Malaysia Day

    # October 2025
    datetime(2025, 10, 24), # Deepavali

    # November 2025
    datetime(2025, 11, 1),  # (Example holiday)
]

def is_working_day(date: datetime) -> bool:
    """
    Check if a date is a working day (not weekend or public holiday)

    Args:
        date: The date to check

    Returns:
        True if working day, False otherwise
    """
    # Check if weekend (5 = Saturday, 6 = Sunday)
    if date.weekday() in [5, 6]:
        return False

    # Check if public holiday
    if date in MALAYSIAN_HOLIDAYS_2025:
        return False

    return True


def get_working_days(start_date: datetime, end_date: datetime) -> List[datetime]:
    """
    Get all working days between start and end date

    Args:
        start_date: Start date
        end_date: End date

    Returns:
        List of working days
    """
    working_days = []
    current_date = start_date

    while current_date <= end_date:
        if is_working_day(current_date):
            working_days.append(current_date)
        current_date += timedelta(days=1)

    return working_days


def generate_test_data():
    """
    Main function to generate test data
    """
    print("=" * 80)
    print("EasiSawit Test Data Generator")
    print("=" * 80)

    # Connect to database
    print("\n[1/6] Connecting to database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    print("[OK] Connected to database")

    # Delete existing work logs
    print("\n[2/6] Deleting existing work logs...")
    cursor.execute("SELECT COUNT(*) as count FROM work_logs")
    old_count = cursor.fetchone()['count']
    print(f"   Found {old_count} existing work logs")

    cursor.execute("DELETE FROM work_logs")
    conn.commit()
    print(f"[OK] Deleted {old_count} work logs")

    # Get active workers
    print("\n[3/6] Fetching workers...")
    cursor.execute("""
        SELECT id, name, type
        FROM workers
        WHERE status = 'Active'
        ORDER BY id
    """)
    workers = cursor.fetchall()
    print(f"[OK] Found {len(workers)} active workers")
    for w in workers[:5]:  # Show first 5
        print(f"   - {w['name']} ({w['type']})")
    if len(workers) > 5:
        print(f"   ... and {len(workers) - 5} more")

    # Get customers (both active and archived)
    print("\n[4/6] Fetching customers...")
    cursor.execute("""
        SELECT id, name, rate, created_at
        FROM customers
        ORDER BY created_at DESC
    """)
    all_customers = cursor.fetchall()

    # Select some customers as active and some as archived
    # We'll use the most recent 70% as active, older 30% as potentially archived
    num_active = int(len(all_customers) * 0.7)
    active_customers = all_customers[:num_active]

    # Randomly archive some older customers (about 20% of remaining)
    archived_customers = []
    potentially_archived = all_customers[num_active:]
    for customer in potentially_archived:
        if random.random() < 0.5:  # 50% chance to archive
            archived_customers.append(customer)

    print(f"[OK] Found {len(all_customers)} total customers")
    print(f"   - Active customers: {len(active_customers)}")
    print(f"   - Archived customers: {len(archived_customers)}")

    # Define test period: Last 3 months
    end_date = datetime.now().date()
    start_date = (end_date - timedelta(days=90))

    # Convert to datetime for consistency
    start_date = datetime.combine(start_date, datetime.min.time())
    end_date = datetime.combine(end_date, datetime.min.time())

    print(f"\n[5/6] Generating work logs...")
    print(f"   Period: {start_date.date()} to {end_date.date()}")

    # Get all working days
    working_days = get_working_days(start_date, end_date)
    print(f"   Working days: {len(working_days)}")
    print(f"   Excluded: Weekends and {len(MALAYSIAN_HOLIDAYS_2025)} public holidays")

    # Generate work logs
    work_logs = []
    log_id = 1

    for work_date in working_days:
        # Each day, random number of workers work (15-25% of total workers)
        num_workers_today = random.randint(
            int(len(workers) * 0.15),
            int(len(workers) * 0.25)
        )

        # Randomly select workers for today
        workers_today = random.sample(workers, num_workers_today)

        for worker in workers_today:
            # Each worker works for 1 customer per day
            num_jobs = 1

            for _ in range(num_jobs):
                # Select customer (higher chance for active customers)
                if active_customers and random.random() < 0.85:  # 85% active
                    customer = random.choice(active_customers)
                elif archived_customers:  # 15% archived (old records)
                    customer = random.choice(archived_customers)
                else:
                    customer = random.choice(all_customers)

                # Generate realistic tons (between 2 and 8 tons per job)
                tons = round(random.uniform(2.0, 8.0), 2)

                # Use customer's rate with some variation (±5%)
                base_rate = float(customer['rate'])
                rate_variation = random.uniform(0.95, 1.05)
                rate = round(base_rate * rate_variation, 2)

                work_logs.append({
                    'id': log_id,
                    'worker_id': worker['id'],
                    'customer_id': customer['id'],
                    'log_date': work_date.date(),
                    'tons': tons,
                    'rate': rate
                })
                log_id += 1

    print(f"[OK] Generated {len(work_logs)} work log entries")

    # Insert work logs into database
    print(f"\n[6/6] Inserting work logs into database...")

    insert_query = """
        INSERT INTO work_logs
        (worker_id, customer_id, log_date, tons, rate_per_ton)
        VALUES (%s, %s, %s, %s, %s)
    """

    batch_size = 100
    inserted = 0

    for i in range(0, len(work_logs), batch_size):
        batch = work_logs[i:i + batch_size]
        values = [
            (log['worker_id'], log['customer_id'], log['log_date'],
             log['tons'], log['rate'])
            for log in batch
        ]
        cursor.executemany(insert_query, values)
        conn.commit()
        inserted += len(batch)
        print(f"   Inserted {inserted}/{len(work_logs)} records...", end='\r')

    print(f"\n[OK] Successfully inserted {len(work_logs)} work logs")

    # Generate statistics
    print("\n" + "=" * 80)
    print("STATISTICS")
    print("=" * 80)

    # Count by month
    cursor.execute("""
        SELECT
            DATE_FORMAT(log_date, '%Y-%m') as month,
            COUNT(*) as count,
            SUM(tons) as total_tons,
            SUM(tons * rate_per_ton) as total_revenue
        FROM work_logs
        GROUP BY DATE_FORMAT(log_date, '%Y-%m')
        ORDER BY month
    """)
    monthly_stats = cursor.fetchall()

    print("\nMonthly Breakdown:")
    print(f"{'Month':<12} {'Logs':<10} {'Total Tons':<15} {'Total Revenue'}")
    print("-" * 60)
    for stat in monthly_stats:
        month_name = datetime.strptime(stat['month'], '%Y-%m').strftime('%B %Y')
        print(f"{month_name:<12} {stat['count']:<10} {stat['total_tons']:<15.2f} RM {stat['total_revenue']:,.2f}")

    # Worker stats
    cursor.execute("""
        SELECT
            w.name,
            w.type,
            COUNT(wl.id) as log_count,
            SUM(wl.tons) as total_tons
        FROM workers w
        LEFT JOIN work_logs wl ON w.id = wl.worker_id
        WHERE w.status = 'Active'
        GROUP BY w.id, w.name, w.type
        ORDER BY total_tons DESC
        LIMIT 5
    """)
    top_workers = cursor.fetchall()

    print("\nTop 5 Workers by Production:")
    print(f"{'Worker Name':<20} {'Type':<10} {'Logs':<10} {'Total Tons'}")
    print("-" * 60)
    for worker in top_workers:
        print(f"{worker['name']:<20} {worker['type']:<10} {worker['log_count'] or 0:<10} {worker['total_tons'] or 0:.2f}")

    # Customer stats
    cursor.execute("""
        SELECT
            c.name,
            COUNT(wl.id) as log_count,
            SUM(wl.tons) as total_tons,
            SUM(wl.tons * wl.rate_per_ton) as total_value
        FROM customers c
        LEFT JOIN work_logs wl ON c.id = wl.customer_id
        GROUP BY c.id, c.name
        ORDER BY total_value DESC
        LIMIT 5
    """)
    top_customers = cursor.fetchall()

    print("\nTop 5 Customers by Value:")
    print(f"{'Customer Name':<20} {'Logs':<10} {'Total Tons':<15} {'Total Value'}")
    print("-" * 70)
    for customer in top_customers:
        print(f"{customer['name']:<20} {customer['log_count'] or 0:<10} {customer['total_tons'] or 0:<15.2f} RM {customer['total_value'] or 0:,.2f}")

    # Weekend/Holiday verification
    print("\nData Validation:")
    cursor.execute("""
        SELECT COUNT(*) as weekend_count
        FROM work_logs
        WHERE DAYOFWEEK(log_date) IN (1, 7)  -- Sunday = 1, Saturday = 7
    """)
    weekend_count = cursor.fetchone()['weekend_count']
    print(f"[OK] Work logs on weekends: {weekend_count} (should be 0)")

    # Check for public holidays
    holiday_dates = [h.strftime('%Y-%m-%d') for h in MALAYSIAN_HOLIDAYS_2025]
    if holiday_dates:
        placeholders = ','.join(['%s'] * len(holiday_dates))
        cursor.execute(f"""
            SELECT COUNT(*) as holiday_count
            FROM work_logs
            WHERE log_date IN ({placeholders})
        """, holiday_dates)
        holiday_count = cursor.fetchone()['holiday_count']
        print(f"[OK] Work logs on public holidays: {holiday_count} (should be 0)")

    # Close connection
    cursor.close()
    conn.close()

    print("\n" + "=" * 80)
    print("[SUCCESS] Test data generation completed successfully!")
    print("=" * 80)
    print(f"\nSummary:")
    print(f"  - Total work logs generated: {len(work_logs)}")
    print(f"  - Period covered: {start_date.date()} to {end_date.date()}")
    print(f"  - Working days: {len(working_days)}")
    print(f"  - Active workers: {len(workers)}")
    print(f"  - Active customers: {len(active_customers)}")
    print(f"  - Archived customers: {len(archived_customers)}")
    print(f"\nYou can now test the EasiSawit application with this data!")


if __name__ == "__main__":
    try:
        generate_test_data()
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
