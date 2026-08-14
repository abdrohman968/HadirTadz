<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

if (!auth_check()) {
    echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu']);
    exit;
}

$user = auth_user();
$input = json_decode(file_get_contents('php://input'), true);

$latitude = isset($input['latitude']) ? (float)$input['latitude'] : null;
$longitude = isset($input['longitude']) ? (float)$input['longitude'] : null;
$photo_data = $input['photo_base64'] ?? '';
$action_type = $input['action'] ?? 'CHECK_IN'; // 'CHECK_IN' or 'CHECK_OUT'

if ($latitude === null || $longitude === null) {
    echo json_encode(['success' => false, 'message' => 'Koordinat lokasi GPS tidak terdeteksi']);
    exit;
}

try {
    // Ambil titik koordinat sekolah dan batas radius
    $school_lat = (float)get_setting('latitude', -6.9272);
    $school_lon = (float)get_setting('longitude', 107.7225);
    $radius_limit = (int)get_setting('radiusMeters', 150);

    // Ambil aturan absensi
    $ruleStmt = $pdo->prepare("SELECT * FROM attendance_rules WHERE role_code = ? OR role_code = 'all' ORDER BY (role_code = ?) DESC LIMIT 1");
    $ruleStmt->execute([$user['role_code'], $user['role_code']]);
    $rule = $ruleStmt->fetch();

    if ($rule && !empty($rule['radius_limit'])) {
        $radius_limit = (int)$rule['radius_limit'];
    }

    // Hitung jarak pengguna ke sekolah
    $distance = calculate_distance($latitude, $longitude, $school_lat, $school_lon);
    $is_within_radius = ($distance <= $radius_limit) ? 1 : 0;

    if (!$is_within_radius) {
        echo json_encode([
            'success' => false,
            'message' => "Anda berada di luar radius sekolah! Jarak Anda: {$distance} meter (Maksimal: {$radius_limit} meter).",
            'distance' => $distance,
            'allowed_radius' => $radius_limit
        ]);
        exit;
    }

    // Simpan foto selfie jika ada
    $photo_url = null;
    if (!empty($photo_data) && strpos($photo_data, 'data:image') === 0) {
        $upload_dir = __DIR__ . '/../assets/uploads/selfie/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $parts = explode(',', $photo_data);
        $data = base64_decode($parts[1] ?? '');
        if ($data) {
            $filename = 'selfie_' . $user['id'] . '_' . date('Ymd_His') . '.jpg';
            file_put_contents($upload_dir . $filename, $data);
            $photo_url = get_base_url() . '/assets/uploads/selfie/' . $filename;
        }
    }

    $today = date('Y-m-d');
    $current_time = date('H:i:s');
    $late_threshold = $rule['late_threshold_time'] ?? '07:15:00';

    // Cek record hari ini
    $stmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
    $stmt->execute([$user['id'], $today]);
    $existing = $stmt->fetch();

    // Dapatkan class_id jika user adalah siswa
    $class_id = null;
    if ($user['role_code'] === 'siswa') {
        $stdStmt = $pdo->prepare("SELECT class_id FROM students WHERE user_id = ?");
        $stdStmt->execute([$user['id']]);
        $class_id = $stdStmt->fetchColumn() ?: null;
    }

    if ($action_type === 'CHECK_IN') {
        if ($existing) {
            echo json_encode([
                'success' => false, 
                'message' => 'Anda sudah melakukan presensi masuk hari ini pada pukul ' . format_time($existing['time_in'])
            ]);
            exit;
        }

        $status = ($current_time > $late_threshold) ? 'TERLAMBAT' : 'HADIR';
        $notes = ($status === 'TERLAMBAT') ? 'Absen mandiri GPS (Terlambat)' : 'Absen mandiri GPS (Tepat waktu)';

        $ins = $pdo->prepare("
            INSERT INTO attendance (user_id, class_id, date, time_in, status, method, identifier, latitude, longitude, distance_meters, is_within_radius, photo_url, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'selfie', ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
        ");
        $ins->execute([$user['id'], $class_id, $today, $current_time, $status, $user['identifier'], $latitude, $longitude, $distance, $photo_url, $notes]);

        echo json_encode([
            'success' => true,
            'message' => "Presensi masuk berhasil ({$status})! Jarak: {$distance}m dari sekolah.",
            'time' => date('H:i', strtotime($current_time)),
            'status' => $status,
            'distance' => $distance
        ]);
    } else {
        // CHECK_OUT
        if (!$existing) {
            echo json_encode(['success' => false, 'message' => 'Anda belum melakukan presensi masuk hari ini']);
            exit;
        }

        if (!empty($existing['time_out'])) {
            echo json_encode(['success' => false, 'message' => 'Anda sudah melakukan presensi pulang hari ini pada pukul ' . format_time($existing['time_out'])]);
            exit;
        }

        $upd = $pdo->prepare("UPDATE attendance SET time_out = ?, updated_at = NOW() WHERE id = ?");
        $upd->execute([$current_time, $existing['id']]);

        echo json_encode([
            'success' => true,
            'message' => "Presensi pulang berhasil pada pukul " . date('H:i', strtotime($current_time)),
            'time' => date('H:i', strtotime($current_time)),
            'status' => $existing['status'],
            'distance' => $distance
        ]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()]);
}
