<?php
require_once __DIR__ . '/../config/auth.php';
$current_user = auth_user();
$role = $current_user['role_code'] ?? 'guest';
$base_url = get_base_url();

$current_script = basename($_SERVER['PHP_SELF']);
$current_dir = basename(dirname($_SERVER['PHP_SELF']));

function is_bottom_active($dir, $file) {
    global $current_dir, $current_script;
    if ($dir === '' || $dir === '/') {
        return $current_script === $file;
    }
    return $current_dir === $dir && $current_script === $file;
}

function bottom_nav_item($url, $icon, $label, $isActive, $isCenter = false) {
    if ($isCenter) {
        return '
        <a href="' . $url . '" class="relative -top-5 flex flex-col items-center group">
            <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/40 border-4 border-white transform active:scale-95 transition group-hover:scale-105">
                <i class="' . $icon . '"></i>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 mt-0.5">' . $label . '</span>
        </a>';
    }

    $activeText = $isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 font-medium hover:text-emerald-600';
    $activeIcon = $isActive ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:text-emerald-600';
    $indicator = $isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5"></span>' : '<span class="w-1.5 h-1.5 opacity-0 mt-0.5"></span>';

    return '
    <a href="' . $url . '" class="flex flex-col items-center justify-center flex-1 py-1.5 group transition-colors ' . $activeText . '">
        <i class="' . $icon . ' text-lg transition-transform ' . $activeIcon . '"></i>
        <span class="text-[10px] tracking-tight mt-0.5 leading-tight">' . $label . '</span>
        ' . $indicator . '
    </a>';
}
?>

<!-- Mobile App-Like Bottom Navigation Bar (Visible on < lg screens) -->
<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-pb">
    <div class="flex items-center justify-around max-w-lg mx-auto">
        
        <?php if ($role === 'admin'): ?>
            <!-- ADMIN BOTTOM NAV: Beranda, Guru, Menu (Center -> buka drawer), Siswa, Presensi -->
            <?= bottom_nav_item("$base_url/admin/index.php", "fa-solid fa-house", "Beranda", is_bottom_active('admin', 'index.php')) ?>
            <?= bottom_nav_item("$base_url/admin/teachers.php", "fa-solid fa-chalkboard-user", "Guru", is_bottom_active('admin', 'teachers.php')) ?>
            <button id="bottom-menu-btn" type="button" aria-label="Buka menu utama" class="relative -top-5 flex flex-col items-center group">
                <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/40 border-4 border-white transform active:scale-95 transition group-hover:scale-105">
                    <i class="fa-solid fa-bars"></i>
                </div>
                <span class="text-[10px] font-bold text-emerald-700 mt-0.5">Menu</span>
            </button>
            <?= bottom_nav_item("$base_url/admin/students.php", "fa-solid fa-user-graduate", "Siswa", is_bottom_active('admin', 'students.php')) ?>
            <?= bottom_nav_item("$base_url/admin/attendance.php", "fa-solid fa-clipboard-user", "Presensi", is_bottom_active('admin', 'attendance.php')) ?>

        <?php elseif ($role === 'guru'): ?>
            <!-- GURU BOTTOM NAV: Beranda, Kelas, Absen GPS (Center), Jurnal, Profil -->
            <?= bottom_nav_item("$base_url/guru/index.php", "fa-solid fa-house", "Beranda", is_bottom_active('guru', 'index.php')) ?>
            <?= bottom_nav_item("$base_url/guru/kelas.php", "fa-solid fa-clipboard-check", "Kelas", is_bottom_active('guru', 'kelas.php')) ?>
            <?= bottom_nav_item("$base_url/guru/absen.php", "fa-solid fa-camera", "Absen", is_bottom_active('guru', 'absen.php'), true) ?>
            <?= bottom_nav_item("$base_url/guru/jurnal.php", "fa-solid fa-book-bookmark", "Jurnal", is_bottom_active('guru', 'jurnal.php')) ?>
            <?= bottom_nav_item("$base_url/auth/profile.php", "fa-solid fa-user", "Profil", is_bottom_active('auth', 'profile.php') || is_bottom_active('guru', 'riwayat.php')) ?>

        <?php elseif ($role === 'siswa'): ?>
            <!-- SISWA BOTTOM NAV: Beranda, Kartu QR, Absen Mandiri (Center), Izin, Profil -->
            <?= bottom_nav_item("$base_url/siswa/index.php", "fa-solid fa-house", "Beranda", is_bottom_active('siswa', 'index.php')) ?>
            <?= bottom_nav_item("$base_url/siswa/kartu.php", "fa-solid fa-id-card-clip", "Kartu QR", is_bottom_active('siswa', 'kartu.php')) ?>
            <?= bottom_nav_item("$base_url/siswa/absen.php", "fa-solid fa-camera-rotate", "Absen", is_bottom_active('siswa', 'absen.php'), true) ?>
            <?= bottom_nav_item("$base_url/siswa/izin.php", "fa-solid fa-file-medical", "Izin", is_bottom_active('siswa', 'izin.php')) ?>
            <?= bottom_nav_item("$base_url/auth/profile.php", "fa-solid fa-user", "Profil", is_bottom_active('auth', 'profile.php') || is_bottom_active('siswa', 'riwayat.php')) ?>

        <?php else: ?>
            <!-- GUEST -->
            <?= bottom_nav_item("$base_url/auth/login.php", "fa-solid fa-arrow-right-to-bracket", "Masuk", true) ?>
            <?= bottom_nav_item("$base_url/scan.php", "fa-solid fa-qrcode", "Kiosk Scan", false, true) ?>
            <?= bottom_nav_item("$base_url/auth/register_school.php", "fa-solid fa-school", "Daftar", false) ?>
        <?php endif; ?>

    </div>
</nav>
