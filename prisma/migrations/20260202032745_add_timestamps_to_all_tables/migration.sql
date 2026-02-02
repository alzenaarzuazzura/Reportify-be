/*
  Warnings:

  - Added the required column `updated_at` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `majors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rombels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `student_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `teaching_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `assignments` ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `classes` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `levels` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `majors` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `rombels` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `rooms` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `schedules` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `student_assignments` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `students` ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `teaching_assignments` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0);
