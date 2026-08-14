<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';

if (!auth_check()) {
    header("Location: " . get_base_url() . "/auth/login.php");
    exit;
}

$user = auth_user();
if ($user) {
    redirect_to_dashboard($user['role_code']);
} else {
    header("Location: " . get_base_url() . "/auth/login.php");
}
exit;