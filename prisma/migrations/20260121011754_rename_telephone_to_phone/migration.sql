/*
  Warnings:

  - You are about to drop the column `telephone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `telephone`,
    ADD COLUMN `phone` VARCHAR(20) NULL;
