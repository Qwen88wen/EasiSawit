-- clear_worklogs.sql
-- SQL Script to clear all work log records
--
-- Usage:
--   mysql -u root easisawit_db < clear_worklogs.sql
-- Or:
--   mysql -u root -p easisawit_db < clear_worklogs.sql

-- Show current counts before deletion
SELECT 'Current work_logs count:' as message, COUNT(*) as count FROM work_logs;
SELECT 'Current settlement_work_logs count:' as message, COUNT(*) as count FROM settlement_work_logs;

-- Delete all work logs
-- Note: settlement_work_logs records will be automatically deleted due to ON DELETE CASCADE
DELETE FROM work_logs;

-- Show counts after deletion to verify
SELECT 'Remaining work_logs count:' as message, COUNT(*) as count FROM work_logs;
SELECT 'Remaining settlement_work_logs count:' as message, COUNT(*) as count FROM settlement_work_logs;

-- Show completion message
SELECT '✓ All work log records have been successfully cleared!' as result;
