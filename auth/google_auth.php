<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

$base_url = get_base_url();

// Support for Demo Google SSO / Real Google OAuth Token
$email = trim($_POST['email'] ?? $_GET['email'] ?? '');
$is_demo = isset($_GET['demo']) || isset($_POST['demo']);

if ($is_demo && empty($email)) {
    // Default demo email for Admin Google SSO
    $email = 'admin@sekolah.sch.id';
}

if (!empty($email)) {
    $stmt = $pdo->prepare("
        SELECT u.*, r.role_code, r.role_name, s.name AS school_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE u.email = ? AND u.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        if ($user['status'] !== 'active') {
            set_flash('error', 'Akun Google ini terdaftar namun statusnya dinonaktifkan.');
            header("Location: $base_url/auth/login.php");
            exit;
        }

        // Login sukses via Google SSO
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role_code'];
        $_SESSION['school_id'] = $user['school_id'];
        $_SESSION['user_data'] = $user;

        $update = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?");
        $update->execute([$user['id']]);

        log_audit('GOOGLE_SSO_LOGIN', 'users', $user['id'], 'User logged in via Google SSO');

        set_flash('success', "Login Google Berhasil! Selamat datang, {$user['full_name']}.");
        redirect_to_dashboard($user['role_code']);
    } else {
        set_flash('error', "Email Google ($email) belum terdaftar di sistem HadirTadz. Silakan hubungi Administrator.");
        header("Location: $base_url/auth/login.php");
        exit;
    }
} else {
    // Render info modal or redirect
    header("Location: $base_url/auth/login.php");
    exit;
}
