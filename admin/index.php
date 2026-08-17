<?php
$page_title = 'Dashboard Administrator';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$current_user = auth_user();
$base_url = get_base_url();
$today = date('Y-m-d');

// 1. Hitung total siswa & guru
$total_students = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE deleted_at IS NULL")->fetchColumn();
$total_teachers = (int)$pdo->query("SELECT COUNT(*) FROM teachers WHERE deleted_at IS NULL")->fetchColumn();

// 2. Hitung statistik absensi hari ini
$stmt = $pdo->prepare("
    SELECT 
        SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
        SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
        SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
        SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
        SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha,
        COUNT(*) AS total_recorded
    FROM attendance 
    WHERE date = ?
");
$stmt->execute([$today]);
$today_stats = $stmt->fetch();

$hadir_count = (int)($today_stats['hadir'] ?? 0);
$terlambat_count = (int)($today_stats['terlambat'] ?? 0);
$izin_count = (int)($today_stats['izin'] ?? 0);
$sakit_count = (int)($today_stats['sakit'] ?? 0);
$alpha_count = (int)($today_stats['alpha'] ?? 0);
$total_att = $hadir_count + $terlambat_count;

$attendance_rate = ($total_students > 0) ? round(($total_att / $total_students) * 100, 1) : 0;

// 3. Izin Pending
$pending_perm = $pdo->query("
    SELECT p.*, u.full_name, u.identifier, r.role_name
    FROM permissions p
    JOIN users u ON p.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE p.status = 'pending' AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT 5
")->fetchAll();

// 4. Log Presensi Terkini Hari Ini
$recent_attendance = $pdo->prepare("
    SELECT a.*, u.full_name, u.identifier, c.class_name, r.role_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date = ?
    ORDER BY a.updated_at DESC
    LIMIT 6
");
$recent_attendance->execute([$today]);
$recent_list = $recent_attendance->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Welcome Banner -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
                        <i class="fa-solid fa-calendar-day"></i>
                        <?= format_date_indo(date('Y-m-d'), true) ?>
                    </span>
                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Selamat Datang, <?= htmlspecialchars(explode(' ', $current_user['full_name'])[0]) ?>! 👋</h1>
                    <p class="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                        Pantau seluruh aktivitas absensi siswa dan guru secara realtime dengan mudah dan akurat.
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <a href="<?= $base_url ?>/scan.php" target="_blank" class="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-lg transition flex items-center gap-2">
                        <i class="fa-solid fa-qrcode text-emerald-600 text-sm"></i>
                        <span>Buka Kiosk Scanner</span>
                    </a>
                    <a href="<?= $base_url ?>/admin/attendance.php" class="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 text-white font-semibold text-xs transition flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i>
                        <span>Input Manual</span>
                    </a>
                </div>
            </div>
            <!-- Decorative circle -->
            <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        </div>

        <!-- KPI Statistic Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <!-- Hadir Tepat Waktu -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Hadir Tepat Waktu</span>
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-800"><?= $hadir_count ?></span>
                    <span class="text-xs text-slate-500">Siswa / Guru</span>
                </div>
                <div class="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-check-double"></i> Sebelum batas toleransi
                </div>
            </div>

            <!-- Terlambat -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Terlambat</span>
                    <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                        <i class="fa-solid fa-user-clock"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-amber-600"><?= $terlambat_count ?></span>
                    <span class="text-xs text-slate-500">Siswa</span>
                </div>
                <div class="mt-2 text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-clock"></i> Melewati batas jam masuk
                </div>
            </div>

            <!-- Izin & Sakit -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Izin & Sakit</span>
                    <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                        <i class="fa-solid fa-envelope-open-text"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-blue-600"><?= $izin_count + $sakit_count ?></span>
                    <span class="text-xs text-slate-500"><?= $izin_count ?> Izin, <?= $sakit_count ?> Sakit</span>
                </div>
                <div class="mt-2 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-file-medical"></i> Terverifikasi / Surat
                </div>
            </div>

            <!-- Total Terdaftar & Rate -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Terdaftar</span>
                    <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                        <i class="fa-solid fa-users"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-baseline gap-2">
                    <span class="text-2xl sm:text-3xl font-extrabold text-slate-800"><?= $total_students ?></span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"><?= $attendance_rate ?>% Hadir</span>
                </div>
                <div class="mt-2 text-[11px] text-slate-500 font-medium">
                    +<?= $total_teachers ?> Guru Pengajar Aktif
                </div>
            </div>
        </div>

        <!-- Charts & Live Feed Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Chart (8 Cols) -->
            <div class="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-base font-bold text-slate-800">Tren Kehadiran 7 Hari Terakhir</h2>
                        <p class="text-xs text-slate-500">Perbandingan siswa tepat waktu, terlambat, izin, dan alpha.</p>
                    </div>
                </div>
                <div id="chart-attendance-trend" class="min-h-[300px]"></div>
            </div>

            <!-- Right Donut (4 Cols) -->
            <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <h2 class="text-base font-bold text-slate-800">Komposisi Kehadiran Hari Ini</h2>
                    <p class="text-xs text-slate-500">Distribusi status siswa</p>
                    <div id="chart-attendance-donut" class="my-4"></div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100">
                    <div class="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-semibold">
                        <span class="block text-[10px] text-emerald-600">Tepat Waktu</span>
                        <?= $hadir_count ?> Siswa
                    </div>
                    <div class="p-2 rounded-xl bg-amber-50 text-amber-800 font-semibold">
                        <span class="block text-[10px] text-amber-600">Terlambat</span>
                        <?= $terlambat_count ?> Siswa
                    </div>
                </div>
            </div>
        </div>

        <!-- Lower Section: Recent Logs & Pending Approvals -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Recent Attendance Feed (7 Cols) -->
            <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-base font-bold text-slate-800">Aktivitas Presensi Terkini Hari Ini</h2>
                        <p class="text-xs text-slate-500">Log kehadiran langsung dari scanner & mobile</p>
                    </div>
                    <a href="<?= $base_url ?>/admin/attendance.php" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                        <span>Lihat Semua</span>
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                </div>

                <div class="divide-y divide-slate-100">
                    <?php if (empty($recent_list)): ?>
                        <div class="text-center py-8 text-xs text-slate-400">
                            Belum ada rekaman presensi yang masuk hari ini.
                        </div>
                    <?php else: ?>
                        <?php foreach ($recent_list as $row): ?>
                            <div class="py-3 flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                        <?= strtoupper(substr($row['full_name'], 0, 1)) ?>
                                    </div>
                                    <div>
                                        <h4 class="text-xs font-bold text-slate-800"><?= htmlspecialchars($row['full_name']) ?></h4>
                                        <p class="text-[11px] text-slate-400"><?= htmlspecialchars($row['class_name'] ?? $row['role_name']) ?> &bull; <span class="font-mono"><?= htmlspecialchars($row['identifier']) ?></span></p>
                                    </div>
                                </div>
                                <div class="text-right flex items-center gap-2.5">
                                    <div class="text-xs font-mono font-bold text-slate-700">
                                        <?= format_time($row['time_out'] ?? $row['time_in']) ?>
                                    </div>
                                    <?= status_badge($row['status']) ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Pending Permissions Approval (5 Cols) -->
            <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-base font-bold text-slate-800">Menunggu Persetujuan Izin</h2>
                        <p class="text-xs text-slate-500">Pengajuan izin / surat sakit terbaru</p>
                    </div>
                    <a href="<?= $base_url ?>/admin/permissions.php" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                        <span>Kelola</span>
                    </a>
                </div>

                <div class="space-y-3">
                    <?php if (empty($pending_perm)): ?>
                        <div class="text-center py-8 text-xs text-slate-400">
                            <i class="fa-solid fa-circle-check text-emerald-500 text-2xl mb-2 block"></i>
                            Tidak ada pengajuan izin yang tertunda.
                        </div>
                    <?php else: ?>
                        <?php foreach ($pending_perm as $p): ?>
                            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-slate-800"><?= htmlspecialchars($p['full_name']) ?></span>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800"><?= htmlspecialchars($p['type']) ?></span>
                                    </div>
                                    <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-1"><?= htmlspecialchars($p['reason']) ?></p>
                                    <p class="text-[10px] text-slate-400 mt-1"><?= format_date_indo($p['start_date'], false) ?> s/d <?= format_date_indo($p['end_date'], false) ?></p>
                                </div>
                                <a href="<?= $base_url ?>/admin/permissions.php" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition">
                                    Review
                                </a>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

    </div>
</main>

<script>
    // Load Dynamic ApexCharts
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const res = await fetch('<?= $base_url ?>/api/stats.php');
            const data = await res.json();

            // 1. Trend Line Chart
            const trendOptions = {
                series: data.series || [],
                chart: {
                    type: 'area',
                    height: 290,
                    toolbar: { show: false },
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                },
                colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                xaxis: { categories: data.categories || [] },
                fill: {
                    type: 'gradient',
                    gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] }
                }
            };
            const trendChart = new ApexCharts(document.querySelector("#chart-attendance-trend"), trendOptions);
            trendChart.render();

            // 2. Donut Composition Chart
            const donutOptions = {
                series: [<?= $hadir_count ?>, <?= $terlambat_count ?>, <?= $izin_count + $sakit_count ?>, <?= $alpha_count ?>],
                labels: ['Tepat Waktu', 'Terlambat', 'Izin / Sakit', 'Alpha'],
                chart: {
                    type: 'donut',
                    height: 220,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                },
                colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                legend: { position: 'bottom' },
                dataLabels: { enabled: false }
            };
            const donutChart = new ApexCharts(document.querySelector("#chart-attendance-donut"), donutOptions);
            donutChart.render();

        } catch (e) {
            console.error(e);
        }
    });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
