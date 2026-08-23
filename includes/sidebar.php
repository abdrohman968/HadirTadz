<?php
// Auth context resolved once by header.php — reuse $current_user, $base_url
$role = $current_user['role_code'] ?? 'guest';

$current_script = basename($_SERVER['PHP_SELF']);
$current_dir = basename(dirname($_SERVER['PHP_SELF']));

function is_nav_active($dir, $file) {
    global $current_dir, $current_script;
    if ($dir === '' || $dir === '/') {
        return $current_script === $file;
    }
    return $current_dir === $dir && $current_script === $file;
}

function nav_item($url, $icon, $label, $isActive, $badge = '') {
    $activeClass = $isActive 
        ? 'bg-emerald-700 text-white shadow-sm font-semibold' 
        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 font-medium';
    $iconColor = $isActive ? 'text-emerald-200' : 'text-slate-500 group-hover:text-emerald-600';

    return '
    <a href="' . $url . '" class="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ' . $activeClass . '">
        <div class="flex items-center gap-3">
            <i class="' . $icon . ' text-base w-5 text-center transition-colors ' . $iconColor . '"></i>
            <span>' . $label . '</span>
        </div>
        ' . ($badge ? '<span class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">' . $badge . '</span>' : '') . '
    </a>';
}
?>

<!-- Mobile Sidebar Backdrop -->
<div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden lg:hidden transition-opacity"></div>

<!-- Sidebar Component -->
<aside id="app-sidebar" class="no-print fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
    <!-- Navigation List -->
    <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        
        <?php if ($role === 'admin'): ?>
            <!-- ADMIN MENU -->
            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Utama</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/admin/index.php", "fa-solid fa-gauge-high", "Dashboard", is_nav_active('admin', 'index.php')) ?>
                    <?= nav_item("$base_url/admin/attendance.php", "fa-solid fa-clipboard-user", "Presensi Harian", is_nav_active('admin', 'attendance.php')) ?>
                    <?= nav_item("$base_url/scan.php", "fa-solid fa-qrcode", "Kiosk Scanner", false) ?>
                </div>
            </div>

            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Master Data</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/admin/students.php", "fa-solid fa-user-graduate", "Data Siswa", is_nav_active('admin', 'students.php')) ?>
                    <?= nav_item("$base_url/admin/teachers.php", "fa-solid fa-chalkboard-user", "Data Guru", is_nav_active('admin', 'teachers.php')) ?>
                    <?= nav_item("$base_url/admin/classes.php", "fa-solid fa-school", "Data Kelas", is_nav_active('admin', 'classes.php')) ?>
                    <?= nav_item("$base_url/admin/users.php", "fa-solid fa-users-gear", "Kelola Akun", is_nav_active('admin', 'users.php')) ?>
                </div>
            </div>

            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Aktivitas & Izin</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/admin/permissions.php", "fa-solid fa-envelope-open-text", "Izin & Sakit", is_nav_active('admin', 'permissions.php')) ?>
                    <?= nav_item("$base_url/admin/journals.php", "fa-solid fa-book-journal-whills", "Jurnal Mengajar", is_nav_active('admin', 'journals.php')) ?>
                    <?= nav_item("$base_url/admin/cards.php", "fa-solid fa-id-card", "Cetak Kartu Pelajar", is_nav_active('admin', 'cards.php')) ?>
                </div>
            </div>

            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Laporan & Sistem</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/admin/reports.php", "fa-solid fa-file-invoice", "Rekap Laporan", is_nav_active('admin', 'reports.php')) ?>
                    <?= nav_item("$base_url/admin/rules.php", "fa-solid fa-clock-rotate-left", "Aturan Absensi", is_nav_active('admin', 'rules.php')) ?>
                    <?= nav_item("$base_url/admin/kiosk.php", "fa-solid fa-qrcode", "Kiosk Scanner", is_nav_active('admin', 'kiosk.php')) ?>
                    <?= nav_item("$base_url/admin/settings.php", "fa-solid fa-sliders", "Pengaturan Sekolah", is_nav_active('admin', 'settings.php')) ?>
                    <?= nav_item("$base_url/admin/consents.php", "fa-solid fa-file-shield", "Legal & Persetujuan", is_nav_active('admin', 'consents.php')) ?>
                </div>
            </div>

        <?php elseif ($role === 'guru'): ?>
            <!-- GURU MENU -->
            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menu Guru</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/guru/index.php", "fa-solid fa-gauge-high", "Dashboard", is_nav_active('guru', 'index.php')) ?>
                    <?= nav_item("$base_url/guru/absen.php", "fa-solid fa-camera", "Absen Saya (GPS)", is_nav_active('guru', 'absen.php')) ?>
                    <?= nav_item("$base_url/guru/kelas.php", "fa-solid fa-clipboard-check", "Presensi Siswa Kelas", is_nav_active('guru', 'kelas.php')) ?>
                    <?= nav_item("$base_url/guru/jurnal.php", "fa-solid fa-book-bookmark", "Jurnal Pembelajaran", is_nav_active('guru', 'jurnal.php')) ?>
                    <?= nav_item("$base_url/guru/riwayat.php", "fa-solid fa-calendar-days", "Riwayat Kehadiran", is_nav_active('guru', 'riwayat.php')) ?>
                </div>
            </div>

        <?php elseif ($role === 'siswa'): ?>
            <!-- SISWA MENU -->
            <div>
                <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Portal Siswa</p>
                <div class="space-y-1">
                    <?= nav_item("$base_url/siswa/index.php", "fa-solid fa-gauge-high", "Dashboard", is_nav_active('siswa', 'index.php')) ?>
                    <?= nav_item("$base_url/siswa/kartu.php", "fa-solid fa-id-card-clip", "Kartu Pelajar Digital", is_nav_active('siswa', 'kartu.php')) ?>
                    <?= nav_item("$base_url/siswa/absen.php", "fa-solid fa-camera-rotate", "Absen Mandiri (GPS)", is_nav_active('siswa', 'absen.php')) ?>
                    <?= nav_item("$base_url/siswa/izin.php", "fa-solid fa-file-medical", "Pengajuan Izin / Sakit", is_nav_active('siswa', 'izin.php')) ?>
                    <?= nav_item("$base_url/siswa/riwayat.php", "fa-solid fa-history", "Riwayat Kehadiran", is_nav_active('siswa', 'riwayat.php')) ?>
                </div>
            </div>
        <?php endif; ?>

    </div>

    <!-- Sidebar Footer Profile Summary -->
    <div class="p-4 border-t border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                <?= strtoupper(substr($current_user['full_name'] ?? 'U', 0, 1)) ?>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate"><?= htmlspecialchars($current_user['full_name'] ?? '') ?></p>
                <p class="text-[11px] text-emerald-600 font-medium"><?= htmlspecialchars($current_user['identifier'] ?? '') ?></p>
            </div>
        </div>
    </div>
</aside>
