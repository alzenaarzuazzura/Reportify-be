/*
  Warnings:

  - You are about to drop the column `room` on the `schedules` table. All the data in the column will be lost.
  - Added the required column `id_room` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `schedules` DROP COLUMN `room`,
    ADD COLUMN `id_room` INTEGER NOT NULL,
    ADD COLUMN `notification_sent_date` DATE NULL,
    MODIFY `day` ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu') NOT NULL;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_id_room_fkey` FOREIGN KEY (`id_room`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
