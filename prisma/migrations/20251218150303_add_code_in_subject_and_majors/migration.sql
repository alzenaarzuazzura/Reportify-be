/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `majors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `majors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `majors` ADD COLUMN `code` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `code` VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `majors_code_key` ON `majors`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `subjects_code_key` ON `subjects`(`code`);
