-- Set MySQL timezone to Asia/Jakarta
SET GLOBAL time_zone = '+07:00';
SET time_zone = '+07:00';

-- Verify timezone
SELECT @@global.time_zone, @@session.time_zone;
