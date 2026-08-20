<?php
$page_title = 'Dashboard Siswa';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['siswa']);
$base_url = get_base_url();
$user = auth_user();
$today = date('Y-m-d');

// Dapatkan data siswa & kelas
$stmt = $pdo->prepare("
    SELECT s.*, c.class_name, c.major, t.full_name AS homeroom_name
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
    WHERE s.user_id = ?
");
$stmt->execute([$user['id']]);
$student = $stmt->fetch();

// Cek presensi hari ini
$attStmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
$attStmt->execute([$user['id'], $today]);
$today_att = $attStmt->fetch();

// Hitung total kehadiran semester/bulan ini
$curMonth = date('Y-m');
$summaryStmt = $pdo->prepare("
    SELECT 
        SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
        SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha,
        COUNT(*) AS total
    FROM attendance 
    WHERE user_id = ? AND date LIKE ?
");
$summaryStmt->execute([$user['id'], "$curMonth%"]);
$stats = $summaryStmt->fetch();

$hadir_count = (int)($stats['hadir'] ?? 0);
$terlambat_count = (int)($stats['terlambat'] ?? 0);
$total_days = (int)($stats['total'] ?? 0);
$persentase = ($total_days > 0) ? round((($hadir_count + $terlambat_count) / $total_days) * 100) : 100;

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<!-- QR Code Generator Library -->
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Student Banner -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <?= htmlspecialchars($student['class_name'] ?? 'Siswa Aktif') ?>
                    </span>
                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Hai, <?= htmlspecialchars($user['full_name']) ?>! 👋</h1>
                    <p class="text-emerald-100 text-xs sm:text-sm mt-1">
                        NISN: <span class="font-mono font-bold"><?= htmlspecialchars($student['nisn'] ?? $user['identifier']) ?></span> &bull; Wali Kelas: <?= htmlspecialchars($student['homeroom_name'] ?? '-') ?>
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <a href="<?= $base_url ?>/siswa/kartu.php" class="px-5 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-lg transition flex items-center gap-2">
                        <i class="fa-solid fa-id-card-clip text-emerald-600 text-sm"></i>
                        <span>Buka Kartu Pelajar QR</span>
                    </a>
                    <a href="<?= $base_url ?>/siswa/absen.php" class="px-4 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 text-white font-semibold text-xs transition flex items-center gap-2">
                        <i class="fa-solid fa-camera"></i>
                        <span>Absen Mandiri</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Metrics & Today Status Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <!-- Today's Status (5 Cols) -->
            <div class="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran Hari Ini</span>
                        <span class="text-xs font-mono text-slate-400"><?= format_date_indo($today, false) ?></span>
                    </div>

                    <?php if ($today_att): ?>
                        <div class="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-emerald-700 font-medium">Status:</span>
                                <?= status_badge($today_att['status']) ?>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-emerald-700 font-medium">Jam Masuk:</span>
                                <span class="font-mono font-bold text-emerald-800 text-sm"><?= format_time($today_att['time_in']) ?> WIB</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-emerald-700 font-medium">Jam Pulang:</span>
                                <span class="font-mono font-bold text-slate-700 text-sm"><?= format_time($today_att['time_out']) ?></span>
                            </div>
                            <div class="pt-2 border-t border-emerald-200 text-[11px] text-emerald-700">
                                Metode: <strong class="uppercase"><?= htmlspecialchars($today_att['method']) ?></strong>
                            </div>
                        </div>
                    <?php else: ?>
                        <div class="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
                            <i class="fa-solid fa-clock-rotate-left text-amber-500 text-3xl block"></i>
                            <p class="text-xs font-bold text-amber-800">Anda belum tercatat presensi hari ini.</p>
                            <p class="text-[11px] text-amber-600">Scan kartu Anda di scanner gerbang sekolah atau gunakan menu Absen Mandiri.</p>
                            <div class="pt-2 flex justify-center gap-2">
                                <a href="<?= $base_url ?>/siswa/kartu.php" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition">
                                    Tampilkan QR
                                </a>
                                <a href="<?= $base_url ?>/siswa/izin.php" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                                    Ajukan Izin / Sakit
                                </a>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>Persentase Kehadiran: <strong class="text-emerald-700"><?= $persentase ?>%</strong></span>
                    <a href="<?= $base_url ?>/siswa/riwayat.php" class="text-emerald-700 font-bold hover:underline">Riwayat &rarr;</a>
                </div>
            </div>

            <!-- Digital ID Card Snapshot (7 Cols) -->
            <div class="md:col-span-7 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-6 shadow-lg border border-emerald-700 text-white flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div class="space-y-3 z-10 flex-1">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider text-emerald-200">
                        Kartu Pelajar Digital
                    </span>
                    <h3 class="text-xl font-extrabold tracking-tight"><?= htmlspecialchars($user['full_name']) ?></h3>
                    <p class="text-xs text-emerald-200 font-mono">NISN: <?= htmlspecialchars($student['nisn'] ?? $user['identifier']) ?></p>
                    <p class="text-xs text-emerald-100"><?= htmlspecialchars($student['class_name'] ?? 'SMA Negeri Harapan Bangsa') ?></p>
                    
                    <div class="pt-3">
                        <a href="<?= $base_url ?>/siswa/kartu.php" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow hover:bg-emerald-50 transition">
                            <i class="fa-solid fa-expand text-xs"></i>
                            <span>Buka Layar Penuh</span>
                        </a>
                    </div>
                </div>

                <!-- QR Code Box -->
                <div class="z-10 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0">
                    <div id="student-qrcode"></div>
                </div>

                <div class="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
            </div>
        </div>

        <!-- Monthly Counters -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-emerald-600">Hadir Tepat Waktu</span>
                <p class="text-2xl font-extrabold text-emerald-800 mt-1"><?= $hadir_count ?> Hari</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-amber-600">Terlambat</span>
                <p class="text-2xl font-extrabold text-amber-800 mt-1"><?= $terlambat_count ?> Hari</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-blue-600">Izin / Sakit</span>
                <p class="text-2xl font-extrabold text-blue-800 mt-1"><?= (int)($stats['izin'] ?? 0) + (int)($stats['sakit'] ?? 0) ?> Hari</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span class="text-[10px] font-bold uppercase text-rose-600">Alpha</span>
                <p class="text-2xl font-extrabold text-rose-800 mt-1"><?= (int)($stats['alpha'] ?? 0) ?> Hari</p>
            </div>
        </div>

    </div>
</main>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        new QRCode(document.getElementById("student-qrcode"), {
            text: "<?= $user['identifier'] ?>",
            width: 100,
            height: 100,
            colorDark: "#064e3b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
