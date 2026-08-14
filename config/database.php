<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Konfigurasi Database
// Mengutamakan environment variables (berguna untuk deploy Vercel/Cloud Hosting)
$host = getenv('DB_HOST') ?: "localhost";
$user = getenv('DB_USER') ?: "root";
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$db   = getenv('DB_NAME') ?: "hadir_tadz"; // Default ke hadir_tadz (atau fallback ke absensi_sekolah)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Fallback jika database hadir_tadz belum ada, coba sambung ke absensi_sekolah
    if ($db === 'hadir_tadz') {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=absensi_sekolah;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e2) {
            die("Koneksi Database Gagal: " . $e2->getMessage());
        }
    } else {
        die("Koneksi Database Gagal: " . $e->getMessage());
    }
}

/**
 * Dapatkan base URL aplikasi
 * Didefinisikan di sini agar tersedia sejak include pertama
 */
if (!function_exists('get_base_url')) {
    function get_base_url() {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $parts = explode('/', trim($script, '/'));
        if (isset($parts[0]) && $parts[0] === 'absensi_digital') {
            return '/absensi_digital';
        }
        return '';
    }
}