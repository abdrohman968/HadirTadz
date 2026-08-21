-- ==========================================================
-- Database Schema for HadirTadz (v.1.0)
-- Multi-Tenant Digital School Attendance System
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- 1. Table structure for schools (Multi-Tenant Master Table)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schools` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_code` varchar(30) NOT NULL UNIQUE,
  `npsn` varchar(20) NOT NULL UNIQUE,
  `name` varchar(150) NOT NULL,
  `level` enum('SD','SMP','SMA','SMK','MA','MTS','MI','PESANTREN','LAINNYA') NOT NULL DEFAULT 'SMA',
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT '-6.92720000',
  `longitude` decimal(11,8) DEFAULT '107.72250000',
  `radius_meters` int NOT NULL DEFAULT 150,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 2. Table structure for roles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_code` varchar(30) NOT NULL UNIQUE,
  `role_name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 3. Table structure for users
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `role_id` bigint unsigned NOT NULL,
  `identifier` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `nik` varchar(30) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_identifier` (`school_id`, `identifier`),
  KEY `fk_users_school` (`school_id`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 4. Table structure for classes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `class_code` varchar(30) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `grade` enum('X','XI','XII','VII','VIII','IX','1','2','3','4','5','6','LAINNYA') NOT NULL DEFAULT 'X',
  `major` varchar(100) NOT NULL,
  `homeroom_teacher_id` bigint unsigned DEFAULT NULL,
  `academic_year` varchar(20) NOT NULL DEFAULT '2025/2026',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_class_code` (`school_id`, `class_code`),
  KEY `fk_classes_school` (`school_id`),
  CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 5. Table structure for teachers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `user_id` bigint unsigned NOT NULL UNIQUE,
  `full_name` varchar(150) NOT NULL,
  `nip` varchar(30) NOT NULL,
  `gender` enum('L','P') NOT NULL DEFAULT 'L',
  `subject_specialty` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_nip` (`school_id`, `nip`),
  KEY `fk_teachers_school` (`school_id`),
  KEY `fk_teachers_user` (`user_id`),
  CONSTRAINT `fk_teachers_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teachers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 6. Table structure for students
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `user_id` bigint unsigned NOT NULL UNIQUE,
  `class_id` bigint unsigned DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `nisn` varchar(20) NOT NULL,
  `gender` enum('L','P') NOT NULL DEFAULT 'L',
  `parent_name` varchar(150) DEFAULT NULL,
  `parent_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_nisn` (`school_id`, `nisn`),
  KEY `fk_students_school` (`school_id`),
  KEY `fk_students_user` (`user_id`),
  KEY `fk_students_class` (`class_id`),
  CONSTRAINT `fk_students_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 7. Table structure for attendance
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `user_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned DEFAULT NULL,
  `date` date NOT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `status` enum('HADIR','TERLAMBAT','IZIN','SAKIT','ALPHA','PULANG_CEPAT') NOT NULL DEFAULT 'HADIR',
  `method` enum('qr','rfid','barcode','nfc','face','manual','selfie') NOT NULL DEFAULT 'qr',
  `identifier` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `distance_meters` double DEFAULT NULL,
  `is_within_radius` tinyint(1) DEFAULT '1',
  `photo_url` varchar(255) DEFAULT NULL,
  `notes` text,
  `wa_notified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`date`),
  KEY `fk_attendance_school` (`school_id`),
  KEY `fk_attendance_user` (`user_id`),
  KEY `fk_attendance_class` (`class_id`),
  KEY `idx_attendance_date` (`date`),
  CONSTRAINT `fk_attendance_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 8. Table structure for attendance_logs
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `attendance_id` bigint unsigned NOT NULL,
  `action` enum('CHECK_IN','CHECK_OUT','MANUAL_OVERRIDE','OFFLINE_SYNC','WA_NOTIFY') NOT NULL,
  `raw_payload` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_logs_attendance` (`attendance_id`),
  CONSTRAINT `fk_logs_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 9. Table structure for attendance_rules
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `rule_code` varchar(30) NOT NULL,
  `rule_name` varchar(100) NOT NULL,
  `role_code` varchar(30) NOT NULL DEFAULT 'all',
  `check_in_start` time NOT NULL DEFAULT '06:00:00',
  `work_start_time` time NOT NULL DEFAULT '07:00:00',
  `late_threshold_time` time NOT NULL DEFAULT '07:15:00',
  `check_out_start` time NOT NULL DEFAULT '14:00:00',
  `work_end_time` time NOT NULL DEFAULT '15:30:00',
  `early_leave_threshold` time NOT NULL DEFAULT '13:30:00',
  `allow_late` tinyint(1) NOT NULL DEFAULT '1',
  `radius_limit` int NOT NULL DEFAULT '150',
  `days_of_week` varchar(30) NOT NULL DEFAULT '1,2,3,4,5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_rule_code` (`school_id`, `rule_code`),
  KEY `fk_rules_school` (`school_id`),
  CONSTRAINT `fk_rules_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 10. Table structure for permissions (Izin / Sakit)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('izin','sakit','dispensasi') NOT NULL DEFAULT 'izin',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `verified_by_user_id` bigint unsigned DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_permissions_school` (`school_id`),
  KEY `fk_permissions_user` (`user_id`),
  CONSTRAINT `fk_permissions_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 11. Table structure for journals (Jurnal Mengajar Guru)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `journals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `teacher_user_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `time` varchar(20) DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `topic` text NOT NULL,
  `present_count` int NOT NULL DEFAULT '0',
  `absent_count` int NOT NULL DEFAULT '0',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_journals_school` (`school_id`),
  KEY `fk_journals_teacher` (`teacher_user_id`),
  KEY `fk_journals_class` (`class_id`),
  CONSTRAINT `fk_journals_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_journals_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_journals_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 12. Table structure for school_settings
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL DEFAULT 1,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_school_setting` (`school_id`, `setting_key`),
  KEY `fk_settings_school` (`school_id`),
  CONSTRAINT `fk_settings_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 13. Table structure for audit_logs
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned DEFAULT 1,
  `actor_id` bigint unsigned DEFAULT NULL,
  `actor_identifier` varchar(50) DEFAULT NULL,
  `actor_role` varchar(20) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(30) DEFAULT NULL,
  `entity_id` varchar(30) DEFAULT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 14. Table structure for kiosk_tokens (Kiosk Device Identity)
-- Token disimpan sebagai SHA-256 hash; raw token HANYA terlihat saat
-- pembuatan / halaman admin (admin/kiosk.php). Setiap token terikat ke
-- satu sekolah sehingga kiosk tanpa login tetap memiliki konteks sekolah.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kiosk_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL,
  `device_name` varchar(100) NOT NULL DEFAULT 'Kiosk Gerbang',
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `expires_at` datetime DEFAULT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token_hash` (`token_hash`),
  KEY `fk_kiosk_tokens_school` (`school_id`),
  CONSTRAINT `fk_kiosk_tokens_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 15. Table structure for legal_consents (P2.2)
-- Menyimpan bukti persetujuan Terms & Privacy saat pendaftaran sekolah.
-- Satu baris per consent (terms / privacy) per user per versi.
-- Tidak menyimpan password/token — hanya jejak audit persetujuan.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `legal_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `consent_type` enum('terms','privacy') NOT NULL,
  `consent_version` varchar(20) NOT NULL DEFAULT '1.0',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(250) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consent_school` (`school_id`),
  KEY `idx_consent_user` (`user_id`),
  CONSTRAINT `fk_consent_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- Default Multi-Tenant Seed Data
-- ----------------------------------------------------------

-- 1. Default Schools
INSERT IGNORE INTO `schools` (`id`, `school_code`, `npsn`, `name`, `level`, `address`, `phone`, `email`, `latitude`, `longitude`, `radius_meters`) VALUES
(1, 'SCH-001', '20227912', 'SMA Negeri Harapan Bangsa', 'SMA', 'Jl. Raya Pendidikan No. 123, Bandung', '081234567890', 'kontak@smanhb.sch.id', -6.92720000, 107.72250000, 150),
(2, 'SCH-002', '20227913', 'SMK Informatika Mandiri', 'SMK', 'Jl. Sukarno Hatta No. 45, Bandung', '081234567899', 'info@smkinformatika.sch.id', -6.93890000, 107.61890000, 200);

-- 2. Roles
INSERT IGNORE INTO `roles` (`id`, `role_code`, `role_name`, `description`) VALUES
(1, 'admin', 'Administrator', 'Administrator sistem & pengelola data sekolah'),
(2, 'guru', 'Guru Pengajar', 'Tenaga pendidik & pengajar'),
(3, 'siswa', 'Siswa', 'Peserta didik');

-- 3. Users (Password: hadir123)
-- Hash generated via password_hash('hadir123', PASSWORD_BCRYPT)
INSERT IGNORE INTO `users` (`id`, `school_id`, `role_id`, `identifier`, `full_name`, `password_hash`, `email`, `phone`, `status`) VALUES
(1, 1, 1, 'ADM-001', 'Administrator Utama', '$2y$10$tZ3v3kLg2tE0Nms8o6P.U.YcW6jXwL.O4Kk4L3wWlW0o2X1Q5sYhe', 'admin@sekolah.sch.id', '081234567890', 'active'),
(2, 1, 2, '198503152010011002', 'Budi Santoso, S.Kom', '$2y$10$tZ3v3kLg2tE0Nms8o6P.U.YcW6jXwL.O4Kk4L3wWlW0o2X1Q5sYhe', 'budi@sekolah.sch.id', '081234567891', 'active'),
(3, 1, 2, '199005202015022005', 'Ani Maryani, M.Pd', '$2y$10$tZ3v3kLg2tE0Nms8o6P.U.YcW6jXwL.O4Kk4L3wWlW0o2X1Q5sYhe', 'ani@sekolah.sch.id', '081234567892', 'active'),
(4, 1, 3, '12009101', 'Muhammad Rizky Pratama', '$2y$10$tZ3v3kLg2tE0Nms8o6P.U.YcW6jXwL.O4Kk4L3wWlW0o2X1Q5sYhe', '12009101@siswa.sch.id', '081234567101', 'active'),
(5, 1, 3, '12009102', 'Siti Aminah', '$2y$10$tZ3v3kLg2tE0Nms8o6P.U.YcW6jXwL.O4Kk4L3wWlW0o2X1Q5sYhe', '12009102@siswa.sch.id', '081234567102', 'active');
