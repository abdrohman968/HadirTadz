<?php
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

$user = auth_user();
if ($user) {
    log_audit('LOGOUT', 'users', $user['id'], 'User logged out');
}

auth_logout();
header("Location: " . get_base_url() . "/auth/login.php");
exit;