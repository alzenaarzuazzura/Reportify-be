-- AlterTable
ALTER TABLE `announcements` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `assignments` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `attendances` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `classes` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `levels` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `majors` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rombels` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rooms` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `schedules` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `student_assignments` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `students` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teaching_assignments` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `updated_at` DROP DEFAULT;
