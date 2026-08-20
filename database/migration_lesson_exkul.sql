-- ==========================================================
-- Migration: Lesson Attendance & Extracurricular Attendance
-- HadirTadz v1.1
-- ==========================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------
-- 14. Lesson Sessions (Sesi Jam Pelajaran dibuka oleh Guru)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lesson_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `teacher_user_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `subject` varchar(100) NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ls_school` (`school_id`),
  KEY `fk_ls_teacher` (`teacher_user_id`),
  KEY `fk_ls_class` (`class_id`),
  KEY `fk_ls_date` (`session_date`),
  CONSTRAINT `fk_ls_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ls_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ls_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 15. Lesson Attendance (Presensi per Sesi Pelajaran)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lesson_attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `session_id` bigint unsigned NOT NULL,
  `student_user_id` bigint unsigned NOT NULL,
  `status` enum('HADIR','TERLAMBAT','IZIN','SAKIT','ALPHA') NOT NULL DEFAULT 'HADIR',
  `method` enum('qr','barcode','manual','scan','selfie') NOT NULL DEFAULT 'qr',
  `time_recorded` time DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lesson_att` (`session_id`, `student_user_id`),
  KEY `fk_la_school` (`school_id`),
  KEY `fk_la_session` (`session_id`),
  KEY `fk_la_student` (`student_user_id`),
  CONSTRAINT `fk_la_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_la_session` FOREIGN KEY (`session_id`) REFERENCES `lesson_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_la_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 16. Extracurriculars (Kegiatan Ekstrakurikuler)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `extracurriculars` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `name` varchar(150) NOT NULL,
  `description` text,
  `coach_user_id` bigint unsigned DEFAULT NULL,
  `day_of_week` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ec_school` (`school_id`),
  KEY `fk_ec_coach` (`coach_user_id`),
  CONSTRAINT `fk_ec_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ec_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 17. Extracurricular Sessions (Sesi PerJumpaan Ekskul)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exkul_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `exkul_id` bigint unsigned NOT NULL,
  `coach_user_id` bigint unsigned DEFAULT NULL,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_es_school` (`school_id`),
  KEY `fk_es_exkul` (`exkul_id`),
  KEY `fk_es_coach` (`coach_user_id`),
  CONSTRAINT `fk_es_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_es_exkul` FOREIGN KEY (`exkul_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_es_coach` FOREIGN KEY (`coach_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 18. Extracurricular Attendance (Presensi Ekskul)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exkul_attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `session_id` bigint unsigned NOT NULL,
  `student_user_id` bigint unsigned NOT NULL,
  `status` enum('HADIR','TERLAMBAT','IZIN','SAKIT','ALPHA') NOT NULL DEFAULT 'HADIR',
  `method` enum('qr','barcode','manual','scan') NOT NULL DEFAULT 'qr',
  `time_recorded` time DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exkul_att` (`session_id`, `student_user_id`),
  KEY `fk_ea_school` (`school_id`),
  KEY `fk_ea_session` (`session_id`),
  KEY `fk_ea_student` (`student_user_id`),
  CONSTRAINT `fk_ea_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ea_session` FOREIGN KEY (`session_id`) REFERENCES `exkul_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ea_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
