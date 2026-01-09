-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `levels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `majors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rombels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_level` INTEGER NOT NULL,
    `id_major` INTEGER NOT NULL,
    `id_rombel` INTEGER NOT NULL,

    INDEX `classes_id_level_idx`(`id_level`),
    INDEX `classes_id_major_idx`(`id_major`),
    INDEX `classes_id_rombel_idx`(`id_rombel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_class` INTEGER NOT NULL,
    `nis` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `parent_telephone` VARCHAR(20) NOT NULL,
    `student_telephone` VARCHAR(20) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `students_nis_key`(`nis`),
    INDEX `students_id_class_idx`(`id_class`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teaching_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_class` INTEGER NOT NULL,
    `id_subject` INTEGER NOT NULL,

    INDEX `teaching_assignments_id_user_idx`(`id_user`),
    INDEX `teaching_assignments_id_class_idx`(`id_class`),
    INDEX `teaching_assignments_id_subject_idx`(`id_subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_teaching_assignment` INTEGER NOT NULL,
    `day` ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat') NOT NULL,
    `start_time` VARCHAR(10) NOT NULL,
    `end_time` VARCHAR(10) NOT NULL,
    `room` VARCHAR(50) NOT NULL,

    INDEX `schedules_id_teaching_assignment_idx`(`id_teaching_assignment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_student` INTEGER NOT NULL,
    `id_teaching_assignment` INTEGER NOT NULL,
    `id_schedule` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `checked_at` DATETIME(0) NOT NULL,
    `status` ENUM('hadir', 'izin', 'alfa') NOT NULL,
    `note` VARCHAR(255) NULL,

    INDEX `attendances_id_student_idx`(`id_student`),
    INDEX `attendances_id_teaching_assignment_idx`(`id_teaching_assignment`),
    INDEX `attendances_id_schedule_idx`(`id_schedule`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_teaching_assignment` INTEGER NOT NULL,
    `assignment_title` VARCHAR(200) NOT NULL,
    `assignment_desc` TEXT NOT NULL,
    `deadline` DATE NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `assignments_id_teaching_assignment_idx`(`id_teaching_assignment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_teaching_assignment` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `desc` TEXT NOT NULL,
    `date` DATE NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `announcements_id_teaching_assignment_idx`(`id_teaching_assignment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_student` INTEGER NOT NULL,
    `id_assignment` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(0) NULL,
    `note` TEXT NULL,

    INDEX `student_assignments_id_student_idx`(`id_student`),
    INDEX `student_assignments_id_assignment_idx`(`id_assignment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_id_level_fkey` FOREIGN KEY (`id_level`) REFERENCES `levels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_id_major_fkey` FOREIGN KEY (`id_major`) REFERENCES `majors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_id_rombel_fkey` FOREIGN KEY (`id_rombel`) REFERENCES `rombels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_id_class_fkey` FOREIGN KEY (`id_class`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `teaching_assignments_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `teaching_assignments_id_class_fkey` FOREIGN KEY (`id_class`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teaching_assignments` ADD CONSTRAINT `teaching_assignments_id_subject_fkey` FOREIGN KEY (`id_subject`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_id_teaching_assignment_fkey` FOREIGN KEY (`id_teaching_assignment`) REFERENCES `teaching_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_id_student_fkey` FOREIGN KEY (`id_student`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_id_teaching_assignment_fkey` FOREIGN KEY (`id_teaching_assignment`) REFERENCES `teaching_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_id_schedule_fkey` FOREIGN KEY (`id_schedule`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_id_teaching_assignment_fkey` FOREIGN KEY (`id_teaching_assignment`) REFERENCES `teaching_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_id_teaching_assignment_fkey` FOREIGN KEY (`id_teaching_assignment`) REFERENCES `teaching_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_assignments` ADD CONSTRAINT `student_assignments_id_student_fkey` FOREIGN KEY (`id_student`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_assignments` ADD CONSTRAINT `student_assignments_id_assignment_fkey` FOREIGN KEY (`id_assignment`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
