-- Script untuk memperbaiki timezone di MySQL
-- Jalankan script ini di MySQL untuk memastikan semua timestamp menggunakan timezone Asia/Jakarta

-- 1. Set global timezone
SET GLOBAL time_zone = '+07:00';
SET SESSION time_zone = '+07:00';

-- 2. Verifikasi timezone
SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as current_time;

-- 3. Untuk memastikan data baru menggunakan timezone yang benar,
--    kita perlu mengubah default value di semua tabel

-- Catatan: Prisma akan tetap menyimpan dalam UTC, tapi MySQL akan menampilkan dalam +07:00
-- Ini berarti di phpMyAdmin akan terlihat benar

-- Jika Anda ingin mengkonversi data lama:
-- UPDATE levels SET created_at = CONVERT_TZ(created_at, '+00:00', '+07:00'), updated_at = CONVERT_TZ(updated_at, '+00:00', '+07:00');
-- UPDATE users SET created_at = CONVERT_TZ(created_at, '+00:00', '+07:00'), updated_at = CONVERT_TZ(updated_at, '+00:00', '+07:00');
-- Dan seterusnya untuk semua tabel...

-- PENTING: Jangan jalankan UPDATE di atas jika data sudah benar!
