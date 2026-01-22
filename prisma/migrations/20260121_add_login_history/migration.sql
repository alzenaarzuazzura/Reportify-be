-- CreateTable
CREATE TABLE IF NOT EXISTS `login_history` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_user` INTEGER NOT NULL,
  `login_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `login_history_id_user_idx`(`id_user`),
  INDEX `login_history_login_at_idx`(`login_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
