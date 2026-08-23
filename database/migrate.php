<?php
/**
 * Database Migration & Multi-Tenant Seeder Script for HadirTadz (v.1.0)
 * Can be run via CLI: php database/migrate.php
 * Or via Web Browser: http://localhost/absensi_digital/database/migrate.php
 */

$is_cli = (php_sapi_name() === 'cli');

if (!$is_cli) {
    http_response_code(403);
    echo 'Forbidden: Migration script can only be run from CLI.';
    exit(1);
}

function log_msg($msg) {
    global $is_cli;
    if ($is_cli) {
        echo "$msg\n";
    } else {
        echo htmlspecialchars($msg) . "\n";
    }
}

function ensure_column($pdo, $table, $column, $def) {
    try {
        $check = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $def");
        }
    } catch (Exception $e) {
        // Silently skip if error
    }
}

$host = getenv('DB_HOST') ?: "localhost";
$user = getenv('DB_USER') ?: "root";
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$db_names = ['hadir_tadz', 'absensi_sekolah'];

try {
    log_msg("=== MEMULAI MIGRASI MULTI-TENANT DATABASE HADIRTADZ (v.1.0) ===");
    
    // Connect to MySQL server
    $pdo_server = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    log_msg("[OK] Berhasil terkoneksi ke MySQL Server ($host:3306)");

    foreach ($db_names as $db_name) {
        log_msg("\n--- Menyiapkan Database: `$db_name` ---");
        $pdo_server->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        log_msg("[OK] Database `$db_name` siap.");

        // Connect to the specific database
        $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

        // 1. SCHOOLS (Multi-Tenant Master)
        log_msg("-> Menyiapkan tabel `schools`...");
        $pdo->exec("
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
        ");
        // P2.2: kolom profil sekolah (idempotent untuk database existing)
        ensure_column($pdo, 'schools', 'city', "varchar(100) DEFAULT NULL AFTER `address`");
        ensure_column($pdo, 'schools', 'province', "varchar(100) DEFAULT NULL AFTER `city`");
        ensure_column($pdo, 'schools', 'postal_code', "varchar(10) DEFAULT NULL AFTER `province`");

        // 2. ROLES
        log_msg("-> Menyiapkan tabel `roles`...");
        $pdo->exec("
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
        ");

        // 3. USERS
        log_msg("-> Menyiapkan tabel `users`...");
        $pdo->exec("
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
              KEY `fk_users_school` (`school_id`),
              KEY `fk_users_role` (`role_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'users', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');
        // P2.2: NIK/NIP admin (admin belum tentu guru — tidak disimpan di teachers)
        ensure_column($pdo, 'users', 'nik', "varchar(30) DEFAULT NULL AFTER `phone`");

        // 4. CLASSES
        log_msg("-> Menyiapkan tabel `classes`...");
        $pdo->exec("
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
              KEY `fk_classes_school` (`school_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'classes', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 5. TEACHERS
        log_msg("-> Menyiapkan tabel `teachers`...");
        $pdo->exec("
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
              KEY `fk_teachers_school` (`school_id`),
              KEY `fk_teachers_user` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'teachers', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 6. STUDENTS
        log_msg("-> Menyiapkan tabel `students`...");
        $pdo->exec("
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
              KEY `fk_students_school` (`school_id`),
              KEY `fk_students_user` (`user_id`),
              KEY `fk_students_class` (`class_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'students', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 7. ATTENDANCE
        log_msg("-> Menyiapkan tabel `attendance`...");
        $pdo->exec("
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
              KEY `idx_attendance_date` (`date`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'attendance', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 8. ATTENDANCE LOGS
        log_msg("-> Menyiapkan tabel `attendance_logs`...");
        $pdo->exec("
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
              KEY `fk_logs_attendance` (`attendance_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'attendance_logs', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 9. ATTENDANCE RULES
        log_msg("-> Menyiapkan tabel `attendance_rules`...");
        $pdo->exec("
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
              KEY `fk_rules_school` (`school_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'attendance_rules', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 10. PERMISSIONS
        log_msg("-> Menyiapkan tabel `permissions`...");
        $pdo->exec("
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
              KEY `fk_permissions_user` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'permissions', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 11. JOURNALS
        log_msg("-> Menyiapkan tabel `journals`...");
        $pdo->exec("
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
              KEY `fk_journals_class` (`class_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'journals', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 12. SCHOOL SETTINGS
        log_msg("-> Menyiapkan tabel `school_settings`...");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `school_settings` (
              `id` bigint unsigned NOT NULL AUTO_INCREMENT,
              `school_id` bigint unsigned NOT NULL DEFAULT 1,
              `setting_key` varchar(50) NOT NULL,
              `setting_value` text,
              `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `fk_settings_school` (`school_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        ensure_column($pdo, 'school_settings', 'school_id', 'bigint unsigned NOT NULL DEFAULT 1 AFTER `id`');

        // 13. AUDIT LOGS
        log_msg("-> Menyiapkan tabel `audit_logs`...");
        $pdo->exec("
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
        ");
        ensure_column($pdo, 'audit_logs', 'school_id', 'bigint unsigned DEFAULT 1 AFTER `id`');

        // 14. KIOSK TOKENS (Kiosk Device Identity - Active School Context)
        log_msg("-> Menyiapkan tabel `kiosk_tokens`...");
        $pdo->exec("
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
              KEY `fk_kiosk_tokens_school` (`school_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 15. LEGAL CONSENTS (P2.2 — bukti persetujuan Terms & Privacy)
        log_msg("-> Menyiapkan tabel `legal_consents`...");
        $pdo->exec("
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
        ");

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        // SEEDING MULTI-TENANT DATA
        log_msg("-> Menyemai (seeding) data awal HadirTadz...");

        // 1. Schools
        $pdo->exec("
            INSERT INTO `schools` (`id`, `school_code`, `npsn`, `name`, `level`, `address`, `phone`, `email`, `latitude`, `longitude`, `radius_meters`, `is_active`) VALUES
            (1, 'SCH-001', '20227912', 'SMA Negeri Harapan Bangsa', 'SMA', 'Jl. Raya Pendidikan No. 123, Bandung', '081234567890', 'kontak@smanhb.sch.id', -6.92720000, 107.72250000, 150, 1),
            (2, 'SCH-002', '20227913', 'SMK Informatika Mandiri', 'SMK', 'Jl. Sukarno Hatta No. 45, Bandung', '081234567899', 'info@smkinformatika.sch.id', -6.93890000, 107.61890000, 200, 1)
            ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `address` = VALUES(`address`);
        ");

        // 2. Roles
        $pdo->exec("
            INSERT IGNORE INTO `roles` (`id`, `role_code`, `role_name`, `description`) VALUES
            (1, 'admin', 'Administrator', 'Pengelola sistem dan seluruh data sekolah'),
            (2, 'guru', 'Guru Pengajar', 'Tenaga pendidik dan pengajar'),
            (3, 'siswa', 'Siswa', 'Peserta didik');
        ");

        // 2b. Kiosk Tokens (Backward Compatibility)
        // Pastikan setiap sekolah aktif punya setidaknya satu token kiosk aktif
        // agar kiosk tetap punya konteks sekolah tanpa sesi login.
        $rows = $pdo->query("SELECT id, name FROM schools WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $s) {
            $has = $pdo->prepare("SELECT COUNT(*) FROM kiosk_tokens WHERE school_id = ? AND status = 'active'");
            $has->execute([$s['id']]);
            if ((int)$has->fetchColumn() === 0) {
                $raw = 'KTK-' . bin2hex(random_bytes(24));
                $insTok = $pdo->prepare("INSERT INTO kiosk_tokens (school_id, token_hash, device_name, status, expires_at) VALUES (?, ?, 'Kiosk Gerbang', 'active', NULL)");
                $insTok->execute([$s['id'], hash('sha256', $raw)]);
                log_msg("[KIOSK] Token kiosk `{$s['name']}` (school_id={$s['id']}) => scan.php?k=$raw");
            }
        }

        // Password hash default: hadir123
        $pass_hash = password_hash('hadir123', PASSWORD_BCRYPT);

        // 3. Users (School 1 & 2)
        $insUser = $pdo->prepare("
            INSERT INTO `users` (`id`, `school_id`, `role_id`, `identifier`, `full_name`, `password_hash`, `email`, `phone`, `status`) VALUES
            (1, 1, 1, 'ADM-001', 'Administrator Utama', ?, 'admin@sekolah.sch.id', '081234567890', 'active'),
            (2, 1, 2, '198503152010011002', 'Budi Santoso, S.Kom', ?, 'budi@sekolah.sch.id', '081234567891', 'active'),
            (3, 1, 2, '199005202015022005', 'Ani Maryani, M.Pd', ?, 'ani@sekolah.sch.id', '081234567892', 'active'),
            (4, 1, 3, '12009101', 'Muhammad Rizky Pratama', ?, '12009101@siswa.sch.id', '081234567101', 'active'),
            (5, 1, 3, '12009102', 'Siti Aminah', ?, '12009102@siswa.sch.id', '081234567102', 'active'),
            (6, 1, 3, '12009103', 'Ahmad Fauzi', ?, '12009103@siswa.sch.id', '081234567103', 'active'),
            (7, 1, 3, '12009104', 'Dewi Sartika', ?, '12009104@siswa.sch.id', '081234567104', 'active'),
            (8, 1, 3, '12009105', 'Bayu Saputra', ?, '12009105@siswa.sch.id', '081234567105', 'active'),
            (9, 2, 1, 'ADM-SMK', 'Admin SMK Mandiri', ?, 'admin@smkinformatika.sch.id', '081234567899', 'active')
            ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `password_hash` = VALUES(`password_hash`);
        ");
        $insUser->execute([$pass_hash, $pass_hash, $pass_hash, $pass_hash, $pass_hash, $pass_hash, $pass_hash, $pass_hash, $pass_hash]);

        // 4. Teachers
        $pdo->exec("
            INSERT INTO `teachers` (`id`, `school_id`, `user_id`, `full_name`, `nip`, `gender`, `subject_specialty`) VALUES
            (1, 1, 2, 'Budi Santoso, S.Kom', '198503152010011002', 'L', 'Informatika & Rekayasa Perangkat Lunak'),
            (2, 1, 3, 'Ani Maryani, M.Pd', '199005202015022005', 'P', 'Bahasa Indonesia & Literasi')
            ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);
        ");

        // 5. Classes
        $pdo->exec("
            INSERT INTO `classes` (`id`, `school_id`, `class_code`, `class_name`, `grade`, `major`, `homeroom_teacher_id`, `academic_year`) VALUES
            (1, 1, 'X-RPL-1', 'Kelas X - RPL 1', 'X', 'Rekayasa Perangkat Lunak', 1, '2025/2026'),
            (2, 1, 'XI-RPL-1', 'Kelas XI - RPL 1', 'XI', 'Rekayasa Perangkat Lunak', 2, '2025/2026'),
            (3, 1, 'XII-RPL-1', 'Kelas XII - RPL 1', 'XII', 'Rekayasa Perangkat Lunak', 1, '2025/2026')
            ON DUPLICATE KEY UPDATE `class_name` = VALUES(`class_name`);
        ");

        // 6. Students
        $pdo->exec("
            INSERT INTO `students` (`id`, `school_id`, `user_id`, `class_id`, `full_name`, `nisn`, `gender`, `parent_name`, `parent_phone`) VALUES
            (1, 1, 4, 3, 'Muhammad Rizky Pratama', '12009101', 'L', 'Dedi Pratama', '081234567101'),
            (2, 1, 5, 3, 'Siti Aminah', '12009102', 'P', 'H. Sulaeman', '081234567102'),
            (3, 1, 6, 2, 'Ahmad Fauzi', '12009103', 'L', 'Rahmat Hidayat', '081234567103'),
            (4, 1, 7, 2, 'Dewi Sartika', '12009104', 'P', 'Iwan Setiawan', '081234567104'),
            (5, 1, 8, 1, 'Bayu Saputra', '12009105', 'L', 'Bambang Supriyanto', '081234567105')
            ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);
        ");

        // 7. School Settings
        $settings = [
            'schoolName' => 'SMA Negeri Harapan Bangsa',
            'address' => 'Jl. Raya Pendidikan No. 123, Bandung',
            'latitude' => '-6.92720000',
            'longitude' => '107.72250000',
            'radiusMeters' => '150',
            'timeInStart' => '06:00',
            'timeInEnd' => '07:15',
            'lateThreshold' => '07:15',
            'timeOutStart' => '14:00',
            'npsn' => '20227912',
            'schoolLevel' => 'SMA',
            'operatorName' => 'Operator Sekolah',
            'operatorPhone' => '081234567890',
            'waApiKey' => 'MOCK_WA_KEY_12345',
            'waGatewayNumber' => '081234567890'
        ];

        $insSet = $pdo->prepare("
            INSERT INTO `school_settings` (`school_id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) 
            VALUES (1, ?, ?, NOW(), NOW()) 
            ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`), `updated_at` = NOW()
        ");
        foreach ($settings as $k => $v) {
            $insSet->execute([$k, $v]);
        }

        // 8. Attendance Rules
        $pdo->exec("
            INSERT INTO `attendance_rules` (`id`, `school_id`, `rule_code`, `rule_name`, `role_code`, `check_in_start`, `work_start_time`, `late_threshold_time`, `check_out_start`, `work_end_time`, `early_leave_threshold`, `allow_late`, `radius_limit`, `days_of_week`) VALUES
            (1, 1, 'rule-std', 'Aturan Standar Siswa', 'siswa', '06:00:00', '07:00:00', '07:15:00', '14:00:00', '15:30:00', '13:30:00', 1, 150, '1,2,3,4,5'),
            (2, 1, 'rule-teacher', 'Aturan Khusus Guru', 'guru', '06:30:00', '07:30:00', '07:45:00', '15:00:00', '16:00:00', '14:30:00', 1, 200, '1,2,3,4,5,6')
            ON DUPLICATE KEY UPDATE `rule_name` = VALUES(`rule_name`);
        ");

        // 9. Sample Attendance
        $today = date('Y-m-d');
        for ($i = 5; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            if (date('w', strtotime($d)) == 0) continue; // skip sunday

            $pdo->exec("
                INSERT IGNORE INTO `attendance` (`school_id`, `user_id`, `class_id`, `date`, `time_in`, `time_out`, `status`, `method`, `identifier`, `is_within_radius`, `notes`) VALUES
                (1, 4, 3, '$d', '06:55:00', '14:30:00', 'HADIR', 'qr', '12009101', 1, 'Hadir tepat waktu'),
                (1, 5, 3, '$d', '07:22:00', '14:30:00', 'TERLAMBAT', 'barcode', '12009102', 1, 'Terlambat 7 menit'),
                (1, 6, 2, '$d', '06:50:00', '14:35:00', 'HADIR', 'qr', '12009103', 1, 'Hadir tepat waktu'),
                (1, 7, 2, '$d', NULL, NULL, 'IZIN', 'manual', '12009104', 1, 'Izin ada acara keluarga'),
                (1, 8, 1, '$d', '07:02:00', '14:30:00', 'HADIR', 'qr', '12009105', 1, 'Hadir tepat waktu'),
                (1, 2, NULL, '$d', '06:45:00', '15:15:00', 'HADIR', 'selfie', '198503152010011002', 1, 'Absen mandiri GPS'),
                (1, 3, NULL, '$d', '06:50:00', '15:20:00', 'HADIR', 'selfie', '199005202015022005', 1, 'Absen mandiri GPS');
            ");
        }

        // 10. Sample Permissions
        $pdo->exec("
            INSERT IGNORE INTO `permissions` (`id`, `school_id`, `user_id`, `type`, `start_date`, `end_date`, `reason`, `status`, `created_at`) VALUES
            (1, 1, 7, 'izin', '$today', '$today', 'Menghadiri acara keluarga di luar kota', 'approved', NOW()),
            (2, 1, 8, 'sakit', '$today', '$today', 'Demam dan flu berat, istirahat di rumah', 'pending', NOW());
        ");

        // 11. Sample Journal
        $pdo->exec("
            INSERT IGNORE INTO `journals` (`id`, `school_id`, `teacher_user_id`, `class_id`, `date`, `time`, `subject`, `topic`, `present_count`, `absent_count`, `notes`) VALUES
            (1, 1, 2, 3, '$today', '07:30 - 09:00', 'Informatika', 'Pengenalan Basis Data Relasional dan Pembuatan Aplikasi Web PHP HadirTadz', 32, 1, 'Siswa memahami konsep database multi-tenant dengan antusias');
        ");

        log_msg("[OK] Selesai migrasi dan seeding untuk `$db_name`!");
    }

    log_msg("\n========================================================");
    log_msg("SEMUA DATABASE HADIRTADZ MULTI-TENANT SIAP DIGUNAKAN!");
    log_msg("========================================================");
    log_msg("Akun Demo Sekolah 1 (SMA Negeri Harapan Bangsa):");
    log_msg("1. Admin : ADM-001 | Password: hadir123");
    log_msg("2. Guru  : 198503152010011002 | Password: hadir123");
    log_msg("3. Siswa : 12009101 | Password: hadir123");
    log_msg("Akun Demo Sekolah 2 (SMK Informatika Mandiri):");
    log_msg("4. Admin : ADM-SMK | Password: hadir123");

} catch (Exception $e) {
    log_msg("\n[ERROR] Terjadi kesalahan: " . $e->getMessage());
}

// CLI-only: no HTML closing needed
