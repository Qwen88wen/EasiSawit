-- Worker On-Demand Settlement System
-- This migration creates tables for tracking individual worker settlements

-- Table: worker_settlements
-- Stores each settlement transaction for workers
CREATE TABLE IF NOT EXISTS worker_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    settlement_date DATE NOT NULL,
    from_date DATE NOT NULL COMMENT 'Start date of work logs included in this settlement',
    to_date DATE NOT NULL COMMENT 'End date of work logs included in this settlement',
    total_tons DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total tons harvested (for piece-rate workers)',
    gross_pay DECIMAL(12,2) NOT NULL COMMENT 'Total gross payment before deductions',
    total_deductions DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total statutory deductions',
    net_pay DECIMAL(12,2) NOT NULL COMMENT 'Net payment after deductions',
    epf_employee DECIMAL(12,2) DEFAULT 0.00,
    epf_employer DECIMAL(12,2) DEFAULT 0.00,
    socso_employee DECIMAL(12,2) DEFAULT 0.00,
    socso_employer DECIMAL(12,2) DEFAULT 0.00,
    eis_employee DECIMAL(12,2) DEFAULT 0.00,
    eis_employer DECIMAL(12,2) DEFAULT 0.00,
    pcb_mtd DECIMAL(12,2) DEFAULT 0.00,
    payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) NULL COMMENT 'Cash, Bank Transfer, etc.',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    INDEX idx_worker_date (worker_id, settlement_date),
    INDEX idx_status (payment_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Individual worker settlement records';

-- Table: settlement_work_logs
-- Maps which work logs are included in each settlement
CREATE TABLE IF NOT EXISTS settlement_work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    settlement_id INT NOT NULL,
    work_log_id INT NOT NULL,
    log_date DATE NOT NULL COMMENT 'Denormalized for quick queries',
    amount DECIMAL(12,2) NOT NULL COMMENT 'Amount earned from this work log',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (settlement_id) REFERENCES worker_settlements(id) ON DELETE CASCADE,
    FOREIGN KEY (work_log_id) REFERENCES work_logs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_work_log (work_log_id) COMMENT 'Each work log can only be settled once',
    INDEX idx_settlement (settlement_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Links work logs to settlements';
