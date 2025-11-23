-- Migration file for EasiSawit - Add new features
-- Execute this file in phpMyAdmin to update the database schema

-- ============================================
-- ALTER: Add last_purchase_date to customers table
-- ============================================
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `last_purchase_date` DATE NULL DEFAULT NULL;

-- ============================================
-- CREATE: Admin users table for authentication
-- ============================================
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- INSERT: Default admin user (password: admin123)
-- Password hash: bcrypt hash for 'admin123' (60 characters)
-- ============================================
INSERT INTO `admin_users` (`username`, `password`, `email`, `full_name`, `role`, `is_active`) VALUES
('admin', '$2y$10$CxfZLp7rl8PXEKP32N5dN.oQQ2Ki/wNHtMp50Wh99byUBggDx6w2G', 'admin@easisawit.local', 'Administrator', 'admin', 1)
ON DUPLICATE KEY UPDATE password = '$2y$10$CxfZLp7rl8PXEKP32N5dN.oQQ2Ki/wNHtMp50Wh99byUBggDx6w2G';

-- ============================================
-- CREATE: Customer applications table (pending registrations)
-- ============================================
CREATE TABLE IF NOT EXISTS `customer_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contact` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `rate_requested` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- CREATE: Activity log table for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` longtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_user_id` (`admin_user_id`),
  KEY `entity_type` (`entity_type`),
  FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
