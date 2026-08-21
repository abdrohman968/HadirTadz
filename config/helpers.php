<?php
require_once __DIR__ . '/database.php';

// P2.4 — Legal consent version constants
define('TERMS_VERSION', '2026-08-21-v1');
define('PRIVACY_VERSION', '2026-08-21-v1');

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

/**
 * Mendapatkan ID Sekolah yang sedang aktif (Multi-Tenant)
 */
function auth_school_id() {
    // Prioritas 1: konteks sekolah kiosk (anonym device yang ter-binding token)
    if (isset($_SESSION['kiosk_school_id']) && !empty($_SESSION['kiosk_school_id'])) {
        return (int)$_SESSION['kiosk_school_id'];
    }
    if (isset($_SESSION['user_data']['school_id']) && !empty($_SESSION['user_data']['school_id'])) {
        return (int)$_SESSION['user_data']['school_id'];
    }
    if (isset($_SESSION['active_school_id']) && !empty($_SESSION['active_school_id'])) {
        return (int)$_SESSION['active_school_id'];
    }
    return 1; // Default ke Sekolah ID 1 (compat dev / legacy kiosk tanpa token)
}

/**
 * Validasi token kiosk terhadap tabel kiosk_tokens.
 * Token disimpan sebagai SHA-256 hash — token mentah TIDAK pernah disimpan.
 *
 * @param string $token Token kiosk mentah dari URL/request.
 * @return array|null Array ['school_id','device_name','id'] jika valid,
 *                    array ['error'=>'TOKEN_INVALID'|'TOKEN_REVOKED'|'TOKEN_EXPIRED'|'SCHOOL_INACTIVE']
 *                    jika permintaan ditolak, atau null jika token kosong.
 */
function kiosk_validate_token($token) {
    global $pdo;
    $token = trim((string)$token);
    if ($token === '') return null;

    $hash = hash('sha256', $token);
    try {
        $stmt = $pdo->prepare("SELECT * FROM kiosk_tokens WHERE token_hash = ? LIMIT 1");
        $stmt->execute([$hash]);
        $row = $stmt->fetch();
    } catch (Exception $e) {
        return ['error' => 'TOKEN_INVALID'];
    }

    if (!$row) return ['error' => 'TOKEN_INVALID'];
    if ($row['status'] !== 'active') return ['error' => 'TOKEN_REVOKED'];
    if (!empty($row['expires_at']) && $row['expires_at'] !== '0000-00-00 00:00:00' && strtotime($row['expires_at']) < time()) {
        return ['error' => 'TOKEN_EXPIRED'];
    }

    // Pastikan sekolah yang dirujuk token masih aktif
    try {
        $sch = $pdo->prepare("SELECT id, name, is_active FROM schools WHERE id = ? AND deleted_at IS NULL LIMIT 1");
        $sch->execute([(int)$row['school_id']]);
        $school = $sch->fetch();
    } catch (Exception $e) {
        $school = false;
    }
    if (!$school || (int)$school['is_active'] !== 1) {
        return ['error' => 'SCHOOL_INACTIVE'];
    }

    try {
        $pdo->prepare("UPDATE kiosk_tokens SET last_used_at = NOW() WHERE id = ?")->execute([$row['id']]);
    } catch (Exception $e) {}

    return [
        'school_id' => (int)$row['school_id'],
        'school_name' => $school['name'],
        'device_name' => $row['device_name'],
        'id' => (int)$row['id']
    ];
}

/**
 * Bind konteks kiosk ke session berdasarkan token.
 * Menyimpan $_SESSION['kiosk_school_id'] jika token valid; sebaliknya menghapusnya.
 *
 * @param string $token Token kiosk dari query string (?k=).
 * @return array Hasil dari kiosk_validate_token() (atau null).
 */
function kiosk_bind_context($token) {
    $result = kiosk_validate_token($token);
    if ($result && isset($result['school_id']) && !isset($result['error'])) {
        $_SESSION['kiosk_school_id'] = $result['school_id'];
    } else {
        unset($_SESSION['kiosk_school_id']);
    }
    return $result;
}

/**
 * Mendapatkan konteks kiosk aktif dari sesi (tanpa memvalidasi ulang token).
 */
function kiosk_context() {
    if (!empty($_SESSION['kiosk_school_id'])) {
        return [
            'school_id' => (int)$_SESSION['kiosk_school_id'],
            'source' => 'session'
        ];
    }
    return null;
}

/**
 * Membuat token kiosk baru untuk sebuah sekolah.
 * Menyimpan SHA-256 hash; mengembalikan token mentah HANYA sekali (untuk URL kiosk).
 *
 * @param int $school_id
 * @param string $device_name
 * @param string|null $expires_at Format 'Y-m-d H:i:s' atau null (tidak kedaluwarsa).
 * @return array ['token'=>raw, 'id'=>row_id]
 */
function kiosk_generate_token($school_id, $device_name = 'Kiosk Gerbang', $expires_at = null) {
    global $pdo;
    $token = 'KTK-' . bin2hex(random_bytes(24));
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare("
        INSERT INTO kiosk_tokens (school_id, token_hash, device_name, status, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, NOW(), NOW())
    ");
    $stmt->execute([(int)$school_id, $hash, empty($device_name) ? 'Kiosk Gerbang' : $device_name, $expires_at]);
    return [
        'token' => $token,
        'id' => (int)$pdo->lastInsertId()
    ];
}

/**
 * Mencabut (revoke) sebuah token kiosk milik sekolah tertentu.
 */
function kiosk_revoke_token($token_id, $school_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE kiosk_tokens SET status = 'revoked', updated_at = NOW() WHERE id = ? AND school_id = ?");
    return $stmt->execute([(int)$token_id, (int)$school_id]);
}

/**
 * Mengambil data sekolah yang sedang aktif
 */
function current_school($school_id = null) {
    global $pdo;
    static $school_cache = [];

    $sid = $school_id ?: auth_school_id();
    if (isset($school_cache[$sid])) {
        return $school_cache[$sid];
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM schools WHERE id = ? AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([$sid]);
        $school = $stmt->fetch();
        if ($school) {
            $school_cache[$sid] = $school;
            return $school;
        }
    } catch (Exception $e) {}

    // Fallback default
    $default = [
        'id' => 1,
        'school_code' => 'SCH-001',
        'npsn' => '20227912',
        'name' => 'SMA Negeri Harapan Bangsa',
        'level' => 'SMA',
        'address' => 'Jl. Raya Pendidikan No. 123, Bandung',
        'phone' => '081234567890',
        'email' => 'kontak@smanhb.sch.id',
        'logo_url' => '',
        'latitude' => -6.92720000,
        'longitude' => 107.72250000,
        'radius_meters' => 150
    ];
    $school_cache[$sid] = $default;
    return $default;
}

/**
 * Mengambil daftar semua sekolah yang aktif
 */
function get_all_schools() {
    global $pdo;
    try {
        $stmt = $pdo->query("SELECT id, school_code, npsn, name, level, logo_url, address FROM schools WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC");
        return $stmt->fetchAll();
    } catch (Exception $e) {
        return [];
    }
}

/**
 * Format tanggal Indonesia (Contoh: Senin, 14 Agustus 2026)
 */
function format_date_indo($date_str, $with_day = true, $with_time = false) {
    if (!$date_str || $date_str === '0000-00-00' || $date_str === '0000-00-00 00:00:00') {
        return '-';
    }

    $timestamp = strtotime($date_str);
    if (!$timestamp) return $date_str;

    $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    $months = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    $day_name = $days[date('w', $timestamp)];
    $d = date('j', $timestamp);
    $m = $months[(int)date('n', $timestamp)];
    $y = date('Y', $timestamp);

    $result = "";
    if ($with_day) {
        $result .= "$day_name, ";
    }
    $result .= "$d $m $y";

    if ($with_time) {
        $result .= " " . date('H:i', $timestamp) . " WIB";
    }

    return $result;
}

/**
 * Format jam (HH:mm)
 */
function format_time($time_str) {
    if (!$time_str) return '-';
    $t = strtotime($time_str);
    return $t ? date('H:i', $t) : $time_str;
}

/**
 * Render badge status kehadiran dengan styling Tailwind yang rapi
 */
function status_badge($status) {
    $status = strtoupper(trim((string)$status));
    switch ($status) {
        case 'HADIR':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Hadir</span>';
        case 'TERLAMBAT':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>Terlambat</span>';
        case 'IZIN':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Izin</span>';
        case 'SAKIT':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span>Sakit</span>';
        case 'ALPHA':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>Alpha</span>';
        case 'PULANG_CEPAT':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-orange-600"></span>Pulang Cepat</span>';
        case 'PENDING':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-yellow-600 animate-pulse"></span>Menunggu</span>';
        case 'APPROVED':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Disetujui</span>';
        case 'REJECTED':
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>Ditolak</span>';
        default:
            return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">' . htmlspecialchars($status ?: 'Belum Ada') . '</span>';
    }
}

/**
 * Mengambil nilai pengaturan sekolah dari database per sekolah
 */
function get_setting($key, $default = '', $school_id = null) {
    global $pdo;
    static $settings_cache = [];

    $sid = $school_id ?: auth_school_id();

    if (!isset($settings_cache[$sid])) {
        try {
            $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM school_settings WHERE school_id = ?");
            $stmt->execute([$sid]);
            $settings_cache[$sid] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        } catch (Exception $e) {
            $settings_cache[$sid] = [];
        }
    }

    if (isset($settings_cache[$sid][$key])) {
        return $settings_cache[$sid][$key];
    }

    // Fallback ke data tabel schools jika relevan
    $sch = current_school($sid);
    if ($key === 'schoolName' && !empty($sch['name'])) return $sch['name'];
    if ($key === 'address' && !empty($sch['address'])) return $sch['address'];
    if ($key === 'npsn' && !empty($sch['npsn'])) return $sch['npsn'];
    if ($key === 'schoolLevel' && !empty($sch['level'])) return $sch['level'];
    if ($key === 'latitude' && !empty($sch['latitude'])) return (string)$sch['latitude'];
    if ($key === 'longitude' && !empty($sch['longitude'])) return (string)$sch['longitude'];
    if ($key === 'radiusMeters' && !empty($sch['radius_meters'])) return (string)$sch['radius_meters'];

    return $default;
}

/**
 * Update atau simpan pengaturan sekolah
 */
function set_setting($key, $value, $school_id = null) {
    global $pdo;
    $sid = $school_id ?: auth_school_id();
    $stmt = $pdo->prepare("
        INSERT INTO school_settings (school_id, setting_key, setting_value, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW()) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
    ");
    return $stmt->execute([$sid, $key, $value]);
}

/**
 * Canonical resolver: ambil aturan absensi yang berlaku untuk role tertentu (tenant-scoped).
 * Prioritas: rule spesifik role_code, lalu fallback rule 'all'. Mengembalikan array row atau null.
 */
function get_attendance_rule($role_code = null, $school_id = null) {
    global $pdo;
    $sid = $school_id ?: auth_school_id();
    if ($role_code === null && function_exists('auth_user')) {
        $u = auth_user();
        $role_code = $u['role_code'] ?? 'all';
    }
    $role_code = $role_code ?: 'all';
    try {
        $stmt = $pdo->prepare("SELECT * FROM attendance_rules WHERE school_id = ? AND (role_code = ? OR role_code = 'all') ORDER BY (role_code = ?) DESC, id ASC LIMIT 1");
        $stmt->execute([$sid, $role_code, $role_code]);
        $rule = $stmt->fetch();
        return $rule ?: null;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Canonical SUMBER radius GPS absensi (satu sumber kebenaran):
 * 1. attendance_rules.radius_limit  -> rule spesifik role (writer: admin/rules.php)
 * 2. school_settings.radiusMeters   -> fallback default sekolah (writer: admin/settings.php)
 * 3. schools.radius_meters          -> fallback terakhir via get_setting()
 */
function get_attendance_radius($role_code = null, $default = 150, $school_id = null) {
    $rule = get_attendance_rule($role_code, $school_id);
    if ($rule && !empty($rule['radius_limit'])) {
        return (int)$rule['radius_limit'];
    }
    return (int)get_setting('radiusMeters', $default, $school_id);
}

/**
 * Flash message helper
 */
function set_flash($type, $message) {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['flash'] = [
        'type' => $type, // 'success', 'error', 'warning', 'info'
        'message' => $message
    ];
}

function get_flash() {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

/**
 * Hitung jarak antara dua koordinat GPS dalam meter menggunakan Haversine Formula
 */
function calculate_distance($lat1, $lon1, $lat2, $lon2) {
    $earth_radius = 6371000; // Radius bumi dalam meter

    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    $distance = $earth_radius * $c;

    return round($distance, 2); // dalam meter
}

/**
 * Audit Log recorder
 */
function log_audit($action, $entity_type, $entity_id, $details = '', $school_id = null) {
    global $pdo;
    $user = function_exists('auth_user') ? auth_user() : null;
    $actor_id = $user['id'] ?? null;
    $actor_identifier = $user['identifier'] ?? 'SYSTEM';
    $actor_role = $user['role_code'] ?? 'system';
    $sid = $school_id ?: ($user['school_id'] ?? auth_school_id());
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (school_id, actor_id, actor_identifier, actor_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$sid, $actor_id, $actor_identifier, $actor_role, $action, $entity_type, $entity_id, $details, $ip, $ua]);
    } catch (Exception $e) {
        // Silently skip if error
    }
}
