<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if (!auth_check()) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user = auth_user();
if ($user && $user['role_code'] !== 'admin') {
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
$school_id = auth_school_id();

try {
    // 7 Days Attendance Trend
    $dates = [];
    $hadir_counts = [];
    $terlambat_counts = [];
    $izin_sakit_counts = [];
    $alpha_counts = [];

    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        $dates[] = date('d M', strtotime($d));

        $stmt = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
                SUM(CASE WHEN status IN ('IZIN', 'SAKIT') THEN 1 ELSE 0 END) AS izin_sakit,
                SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
            FROM attendance 
            WHERE date = ? AND school_id = ?
        ");
        $stmt->execute([$d, $school_id]);
        $row = $stmt->fetch();

        $hadir_counts[] = (int)($row['hadir'] ?? 0);
        $terlambat_counts[] = (int)($row['terlambat'] ?? 0);
        $izin_sakit_counts[] = (int)($row['izin_sakit'] ?? 0);
        $alpha_counts[] = (int)($row['alpha'] ?? 0);
    }

    echo json_encode([
        'categories' => $dates,
        'series' => [
            ['name' => 'Tepat Waktu', 'data' => $hadir_counts],
            ['name' => 'Terlambat', 'data' => $terlambat_counts],
            ['name' => 'Izin / Sakit', 'data' => $izin_sakit_counts],
            ['name' => 'Alpha', 'data' => $alpha_counts]
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
