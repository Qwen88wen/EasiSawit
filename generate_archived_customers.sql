-- Generate Sample Data for Archived Customers
-- Date: 2025-11-22
-- Description: Insert sample customers with last_purchase_date older than 14 days (auto-archived)

-- Insert archived customers with various old purchase dates
INSERT INTO `customers` (`name`, `contact`, `rate`, `remark`, `remark2`, `created_at`, `last_purchase_date`) VALUES
-- Customers inactive for 15-30 days
('Kedah Plantation Estate', '011-1111111', 45.00, 'North Region', 'Sungai Petani', NOW(), DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
('JB Agricultural Co', '011-2222222', 48.00, 'South Region', 'Johor Bahru', NOW(), DATE_SUB(CURDATE(), INTERVAL 16 DAY)),
('Pahang Palm Industries', '011-3333333', 52.00, 'East Region', 'Kuantan', NOW(), DATE_SUB(CURDATE(), INTERVAL 18 DAY)),
('Negeri Sembilan Agro Sdn Bhd', '011-4444444', 46.00, 'Central Region', 'Seremban', NOW(), DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
('Perak Sawit Holdings', '011-5555555', 50.00, 'West Region', 'Ipoh', NOW(), DATE_SUB(CURDATE(), INTERVAL 22 DAY)),

-- Customers inactive for 1-2 months
('Sabah Palm Oil Mill', '011-6666666', 44.00, 'Sabah', 'Kota Kinabalu', NOW(), DATE_SUB(CURDATE(), INTERVAL 25 DAY)),
('Sarawak Plantation Group', '011-7777777', 47.00, 'Sarawak', 'Kuching', NOW(), DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
('Penang Agricultural Services', '011-8888888', 51.00, 'Penang', 'George Town', NOW(), DATE_SUB(CURDATE(), INTERVAL 35 DAY)),
('Melaka Agro Resources', '011-9999999', 49.00, 'Melaka', 'Melaka City', NOW(), DATE_SUB(CURDATE(), INTERVAL 40 DAY)),
('Temerloh Estate Management', '011-0000000', 53.00, 'Pahang', 'Temerloh', NOW(), DATE_SUB(CURDATE(), INTERVAL 45 DAY)),

-- Customers inactive for 2-3 months
('Kedah Oil Palm Cooperative', '011-1234567', 55.00, 'Kedah', 'Alor Setar', NOW(), DATE_SUB(CURDATE(), INTERVAL 60 DAY)),
('Kelantan Plantation Services', '011-2345678', 48.00, 'Kelantan', 'Kota Bharu', NOW(), DATE_SUB(CURDATE(), INTERVAL 75 DAY)),
('Terengganu Agro Enterprise', '011-3456789', 46.00, 'Terengganu', 'Kuala Terengganu', NOW(), DATE_SUB(CURDATE(), INTERVAL 80 DAY)),

-- Recently inactive: Exactly 15 days ago (should be archived)
('Perlis Palm Industries', '011-4567890', 50.00, 'Perlis', 'Kangar', NOW(), DATE_SUB(CURDATE(), INTERVAL 15 DAY)),

-- Customers with no last_purchase_date (newly registered, no purchases yet)
('Port Dickson Palm Estate', '011-5678901', 45.00, 'Negeri Sembilan', 'Port Dickson', NOW(), NULL),
('KL Metropolitan Agro Services', '011-6789012', 47.00, 'Kuala Lumpur', 'KLCC', NOW(), NULL),
('Putrajaya Green Holdings', '011-7890123', 50.00, 'Putrajaya', 'Precinct 1', NOW(), NULL);

-- Verification query to see all archived customers
-- SELECT
--     id,
--     name,
--     last_purchase_date,
--     DATEDIFF(CURDATE(), last_purchase_date) as days_inactive,
--     CASE
--         WHEN last_purchase_date IS NULL THEN 'No purchases'
--         WHEN last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 14 DAY) THEN 'Archived (>14 days)'
--         ELSE 'Active'
--     END as status
-- FROM customers
-- WHERE last_purchase_date IS NULL
--    OR last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 14 DAY)
-- ORDER BY last_purchase_date DESC;
