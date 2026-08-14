<?php
require_once __DIR__ . '/database.php';

/**
 * Cek apakah user sedang login
 */
function auth_check() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Mengambil data user saat ini dari database/session
 */
function auth_user() {
    global $pdo;
    if (!auth_check()) {
        return null;
    }

    if (!isset($_SESSION['user_data']) || empty($_SESSION['user_data'])) {
        $stmt = $pdo->prepare("
            SELECT u.*, r.role_code, r.role_name, 
                   s.name AS school_name, s.npsn AS school_npsn, s.level AS school_level, s.logo_url AS school_logo_url
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            $_SESSION['user_data'] = $user;
            $_SESSION['role'] = $user['role_code'];
            $_SESSION['school_id'] = $user['school_id'];
        } else {
            auth_logout();
            return null;
        }
    }

    return $_SESSION['user_data'];
}

/**
 * Validasi hak akses role, redirect jika tidak berhak
 */
function require_auth($allowed_roles = []) {
    if (!auth_check()) {
        header("Location: " . get_base_url() . "/auth/login.php");
        exit;
    }

    $user = auth_user();
    if (!$user) {
        header("Location: " . get_base_url() . "/auth/login.php");
        exit;
    }

    if (!empty($allowed_roles)) {
        if (!in_array($user['role_code'], (array)$allowed_roles)) {
            // Redirect sesuai role masing-masing
            redirect_to_dashboard($user['role_code']);
            exit;
        }
    }
}

/**
 * Cek role tertentu
 */
function is_role($role) {
    $user = auth_user();
    return $user && $user['role_code'] === $role;
}

/**
 * Redirect ke dashboard sesuai role
 */
function redirect_to_dashboard($role) {
    $base = get_base_url();
    if ($role === 'admin') {
        header("Location: $base/admin/index.php");
    } elseif ($role === 'guru') {
        header("Location: $base/guru/index.php");
    } elseif ($role === 'siswa') {
        header("Location: $base/siswa/index.php");
    } else {
        header("Location: $base/index.php");
    }
    exit;
}

/**
 * Logout pengguna
 */
function auth_logout() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

/**
 * Dapatkan base URL aplikasi
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
