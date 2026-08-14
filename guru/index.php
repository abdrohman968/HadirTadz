<?php
$page_title = 'Dashboard Guru';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['guru']);
$base_url = get_base_url();
$user = auth_user();
$today = date('Y-m-d');

// Dapatkan data profil guru
$stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
$stmt->execute([$user['id']]);
$teacher = $stmt->fetch();

// Cek presensi guru hari ini
$attStmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
$attStmt->execute([$user['id'], $today]);
$today_att = $attStmt->fetch();

// Total jurnal yang diisi guru ini bulan ini
$month_start = date('Y-m-01');
$jrnCount = $pdo->prepare("SELECT COUNT(*) FROM journals WHERE teacher_user_id = ? AND date >= ?");
$jrnCount->execute([$user['id'], $month_start]);
$total_journals = (int)$jrnCount->fetchColumn();

// Kelas yang diampu (Wali Kelas)
$homeroom = $pdo->prepare("SELECT * FROM classes WHERE homeroom_teacher_id = ?");
$homeroom->execute([$teacher['id'] ?? 0]);
$my_class = $homeroom->fetch();

// 5 Riwayat Presensi Guru Terakhir
$histStmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 5");
$histStmt->execute([$user['id']]);
$recent_history = $histStmt->fetchAll();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Welcome Banner -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 p-6 sm:p-8 text-white shadow-xl">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
                        <i class="fa-solid fa-calendar-day"></i>
                        <?= format_date_indo(date('Y-m-d'), true) ?>
                    </span>
                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Selamat Datang, <?= htmlspecialchars($user['full_name']) ?>! 👨‍🏫</h1>
                    <p class="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                        NIP: <span class="font-mono font-bold"><?= htmlspecialchars($teacher['nip'] ?? $user['identifier']) ?></span> &bull; Pengampu <?= htmlspecialchars($teacher['subject_specialty'] ?? 'Mata Pelajaran') ?>
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <a href="<?= $base_url ?>/guru/absen.php" class="px-5 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-lg transition flex items-center gap-2">
                        <i class="fa-solid fa-camera text-emerald-600 text-sm"></i>
                        <span>Absen Saya (GPS)</span>
                    </a>
                    <a href="<?= $base_url ?>/guru/kelas.php" class="px-4 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 text-white font-semibold text-xs transition flex items-center gap-2">
                        <i class="fa-solid fa-clipboard-check"></i>
                        <span>Presensi Siswa di Kelas</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Today Status & Shortcuts -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Status Kehadiran Hari Ini -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran Hari Ini</span>
                        <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-fingerprint"></i>
                        </div>
                    </div>

                    <?php if ($today_att): ?>
                        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs text-emerald-700 font-medium">Jam Masuk:</span>
                                <span class="font-mono font-bold text-emerald-800 text-sm"><?= format_time($today_att['time_in']) ?> WIB</span>
                            </div>
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs text-emerald-700 font-medium">Jam Pulang:</span>
                                <span class="font-mono font-bold text-slate-700 text-sm"><?= format_time($today_att['time_out']) ?></span>
                            </div>
                            <div class="pt-2 border-t border-emerald-200 flex justify-between items-center">
                                <span class="text-xs text-emerald-700 font-medium">Status:</span>
                                <?= status_badge($today_att['status']) ?>
                            </div>
                        </div>
                    <?php else: ?>
                        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center py-5">
                            <i class="fa-solid fa-clock text-amber-500 text-2xl mb-1 block"></i>
                            <p class="text-xs font-bold text-amber-800">Anda belum presensi masuk hari ini.</p>
                            <a href="<?= $base_url ?>/guru/absen.php" class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition">
                                <i class="fa-solid fa-camera"></i> Absen Sekarang
                            </a>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>Metode: <?= htmlspecialchars($today_att['method'] ?? '-') ?></span>
                    <a href="<?= $base_url ?>/guru/riwayat.php" class="text-emerald-700 font-bold hover:underline">Riwayat &rarr;</a>
                </div>
            </div>

            <!-- Jurnal Pembelajaran -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurnal Pembelajaran</span>
                        <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-book-bookmark"></i>
                        </div>
                    </div>

                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-slate-800"><?= $total_journals ?></span>
                        <span class="text-xs text-slate-500">Jurnal terisi bulan ini</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-2">
                        Catat materi ajar harian dan absensi siswa di kelas untuk rekaman administrasi guru.
                    </p>
                </div>

                <a href="<?= $base_url ?>/guru/jurnal.php" class="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs text-center transition block">
                    <i class="fa-solid fa-pen mr-1"></i> Isi Jurnal Baru
                </a>
            </div>

            <!-- Wali Kelas Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Peran Wali Kelas</span>
                        <div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-chalkboard-user"></i>
                        </div>
                    </div>

                    <?php if ($my_class): ?>
                        <div class="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                            <h4 class="text-sm font-bold text-purple-900"><?= htmlspecialchars($my_class['class_name']) ?></h4>
                            <p class="text-xs text-purple-700 mt-0.5"><?= htmlspecialchars($my_class['major']) ?></p>
                            <p class="text-[11px] font-mono text-purple-600 mt-2">Tahun Ajaran: <?= htmlspecialchars($my_class['academic_year']) ?></p>
                        </div>
                    <?php else: ?>
                        <p class="text-xs text-slate-500">Anda saat ini tidak bertugas sebagai wali kelas khusus.</p>
                    <?php endif; ?>
                </div>

                <a href="<?= $base_url ?>/guru/kelas.php" class="mt-5 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs text-center transition block">
                    <i class="fa-solid fa-list-check mr-1"></i> Presensi Kelas
                </a>
            </div>
        </div>

        <!-- Recent Personal Attendance History -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Riwayat Kehadiran Pribadi Terkini</h3>
                    <p class="text-xs text-slate-500">5 hari aktivitas terakhir Anda</p>
                </div>
                <a href="<?= $base_url ?>/guru/riwayat.php" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                    Lihat Semua
                </a>
            </div>

            <div class="divide-y divide-slate-100">
                <?php if (empty($recent_history)): ?>
                    <div class="text-center py-6 text-xs text-slate-400">Belum ada riwayat absensi.</div>
                <?php else: ?>
                    <?php foreach ($recent_history as $h): ?>
                        <div class="py-3 flex items-center justify-between text-xs">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-xs">
                                    <?= date('d', strtotime($h['date'])) ?>
                                </div>
                                <div>
                                    <div class="font-bold text-slate-800"><?= format_date_indo($h['date'], true) ?></div>
                                    <div class="text-[11px] text-slate-400">Masuk: <?= format_time($h['time_in']) ?> &bull; Pulang: <?= format_time($h['time_out']) ?></div>
                                </div>
                            </div>
                            <div>
                                <?= status_badge($h['status']) ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
