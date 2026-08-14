<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode request tidak valid']);
    exit;
}

// Baca JSON payload atau POST data
$input = json_decode(file_get_contents('php://input'), true);
$raw_identifier = trim($input['identifier'] ?? $_POST['identifier'] ?? '');
$method = $input['method'] ?? $_POST['method'] ?? 'qr';

if (empty($raw_identifier)) {
    echo json_encode(['success' => false, 'message' => 'Identifier atau QR Code tidak boleh kosong']);
    exit;
}

try {
    // Cari user berdasarkan identifier (NISN / NIP / Username / ID Pelajar)
    $stmt = $pdo->prepare("
        SELECT u.*, r.role_code, r.role_name,
               s.id AS student_id, s.class_id, s.nisn, c.class_name,
               t.id AS teacher_id, t.nip, t.subject_specialty
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN students s ON u.id = s.user_id AND s.deleted_at IS NULL
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON u.id = t.user_id AND t.deleted_at IS NULL
        WHERE (u.identifier = ? OR s.nisn = ? OR t.nip = ?)
          AND u.status = 'active' AND u.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$raw_identifier, $raw_identifier, $raw_identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Data tidak ditemukan! Kartu / Barcode (' . htmlspecialchars($raw_identifier) . ') belum terdaftar.',
            'sound' => 'error'
        ]);
        exit;
    }

    $today = date('Y-m-d');
    $current_time = date('H:i:s');
    $user_id = $user['id'];
    $class_id = $user['class_id'] ?? null;
    $role_code = $user['role_code'];

    // Ambil aturan absensi yang berlaku untuk role ini
    $ruleStmt = $pdo->prepare("SELECT * FROM attendance_rules WHERE role_code = ? OR role_code = 'all' ORDER BY (role_code = ?) DESC LIMIT 1");
    $ruleStmt->execute([$role_code, $role_code]);
    $rule = $ruleStmt->fetch();

    // Default rule jika tidak diset
    $late_threshold = $rule['late_threshold_time'] ?? '07:15:00';
    $check_out_start = $rule['check_out_start'] ?? '14:00:00';
    $early_leave_threshold = $rule['early_leave_threshold'] ?? '13:30:00';

    // Cek apakah sudah ada record absensi hari ini
    $attStmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
    $attStmt->execute([$user_id, $today]);
    $existing = $attStmt->fetch();

    $action_type = 'CHECK_IN';
    $status = 'HADIR';
    $notes = '';
    $sound = 'success';

    if (!$existing) {
        // === PROSES CHECK IN (MASUK) ===
        if ($current_time > $late_threshold) {
            $status = 'TERLAMBAT';
            $notes = 'Masuk terlambat pukul ' . date('H:i', strtotime($current_time));
            $sound = 'warning';
        } else {
            $status = 'HADIR';
            $notes = 'Hadir tepat waktu';
            $sound = 'success';
        }

        $school_id = $user['school_id'] ?? 1;

        $ins = $pdo->prepare("
            INSERT INTO attendance (school_id, user_id, class_id, date, time_in, status, method, identifier, is_within_radius, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
        ");
        $ins->execute([$school_id, $user_id, $class_id, $today, $current_time, $status, $method, $user['identifier'], $notes]);
        $attendance_id = $pdo->lastInsertId();

        // Log
        $log = $pdo->prepare("INSERT INTO attendance_logs (school_id, attendance_id, action, raw_payload, ip_address, created_at) VALUES (?, ?, 'CHECK_IN', ?, ?, NOW())");
        $log->execute([$school_id, $attendance_id, json_encode(['method' => $method, 'identifier' => $raw_identifier]), $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);

        $message = ($status === 'TERLAMBAT') 
            ? "Presensi Masuk Berhasil (Terlambat). Selamat beraktivitas!"
            : "Presensi Masuk Berhasil. Selamat pagi!";

    } else {
        // === PROSES CHECK OUT (PULANG) ATAU SUDAH ABSEN ===
        // Cek jika baru saja check-in (kurang dari 2 menit yang lalu)
        $time_in_ts = !empty($existing['time_in']) ? strtotime($today . ' ' . $existing['time_in']) : null;
        $now_ts = strtotime($today . ' ' . $current_time);

        if ($time_in_ts && ($now_ts - $time_in_ts) < 120 && empty($existing['time_out'])) {
            echo json_encode([
                'success' => true,
                'already' => true,
                'message' => 'Anda sudah melakukan presensi masuk hari ini pada pukul ' . date('H:i', $time_in_ts),
                'sound' => 'info',
                'user' => [
                    'name' => $user['full_name'],
                    'identifier' => $user['identifier'],
                    'role' => $user['role_name'],
                    'class' => $user['class_name'] ?? $user['subject_specialty'] ?? '-',
                    'time' => date('H:i', $time_in_ts),
                    'status' => $existing['status'],
                    'action' => 'CHECK_IN'
                ]
            ]);
            exit;
        }

        if (!empty($existing['time_out'])) {
            $in_str = $time_in_ts ? date('H:i', $time_in_ts) : '-';
            echo json_encode([
                'success' => true,
                'already' => true,
                'message' => 'Anda sudah selesai presensi masuk (' . $in_str . ') & pulang (' . date('H:i', strtotime($existing['time_out'])) . ') hari ini.',
                'sound' => 'info',
                'user' => [
                    'name' => $user['full_name'],
                    'identifier' => $user['identifier'],
                    'role' => $user['role_name'],
                    'class' => $user['class_name'] ?? $user['subject_specialty'] ?? '-',
                    'time' => date('H:i', strtotime($existing['time_out'])),
                    'status' => $existing['status'],
                    'action' => 'CHECK_OUT'
                ]
            ]);
            exit;
        }

        // Catat Pulang (Check-out)
        $action_type = 'CHECK_OUT';
        $upd_status = $existing['status'];
        if ($current_time < $early_leave_threshold) {
            $notes = $existing['notes'] . " | Pulang cepat pukul " . date('H:i', $now_ts);
        }

        $upd = $pdo->prepare("UPDATE attendance SET time_out = ?, notes = ?, updated_at = NOW() WHERE id = ?");
        $upd->execute([$current_time, $notes ?: $existing['notes'], $existing['id']]);

        // Log
        $log = $pdo->prepare("INSERT INTO attendance_logs (attendance_id, action, raw_payload, ip_address, created_at) VALUES (?, 'CHECK_OUT', ?, ?, NOW())");
        $log->execute([$existing['id'], json_encode(['method' => $method, 'identifier' => $raw_identifier]), $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);

        $status = $existing['status'];
        $message = "Presensi Pulang Berhasil. Hati-hati di jalan!";
        $sound = 'success';
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'sound' => $sound,
        'user' => [
            'name' => $user['full_name'],
            'identifier' => $user['identifier'],
            'role' => $user['role_name'],
            'class' => $user['class_name'] ?? $user['subject_specialty'] ?? 'Umum',
            'time' => date('H:i', strtotime($current_time)),
            'status' => $status,
            'action' => $action_type
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage(), 'sound' => 'error']);
}
