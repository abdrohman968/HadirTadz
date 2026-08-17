<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

$base_url = get_base_url();
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $school_name = trim($_POST['school_name'] ?? '');
    $npsn = trim($_POST['npsn'] ?? '');
    $level = trim($_POST['level'] ?? 'SMA');
    $address = trim($_POST['address'] ?? '');
    $admin_name = trim($_POST['admin_name'] ?? '');
    $identifier = trim($_POST['identifier'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $confirm_password = trim($_POST['confirm_password'] ?? '');

    if (empty($school_name) || empty($npsn) || empty($admin_name) || empty($password)) {
        $error = 'Harap lengkapi semua kolom wajib (Nama Sekolah, NPSN, Nama Admin, dan Kata Sandi).';
    } elseif ($password !== $confirm_password) {
        $error = 'Konfirmasi kata sandi tidak cocok.';
    } elseif (strlen($password) < 6) {
        $error = 'Kata sandi minimal harus 6 karakter.';
    } else {
        try {
            // Cek apakah NPSN sudah terdaftar
            $stmt = $pdo->prepare("SELECT id FROM schools WHERE npsn = ? LIMIT 1");
            $stmt->execute([$npsn]);
            if ($stmt->fetch()) {
                $error = "Sekolah dengan NPSN $npsn sudah terdaftar!";
            } else {
                $pdo->beginTransaction();

                // 1. Buat kode sekolah unik
                $school_code = 'SCH-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $school_name), 0, 3)) . rand(100, 999);

                // 2. Insert tabel schools
                $insSchool = $pdo->prepare("
                    INSERT INTO schools (school_code, npsn, name, level, address, phone, email, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                ");
                $insSchool->execute([$school_code, $npsn, $school_name, $level, $address, $phone, $email]);
                $new_school_id = $pdo->lastInsertId();

                // 3. Pastikan identifier admin
                if (empty($identifier)) {
                    $identifier = 'ADM-' . rand(100, 999);
                }

                // 4. Buat akun Admin Utama untuk sekolah tersebut
                $pass_hash = password_hash($password, PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, email, phone, status, created_at, updated_at)
                    VALUES (?, 1, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$new_school_id, $identifier, $admin_name, $pass_hash, $email, $phone]);

                // 5. Inisialisasi Pengaturan Dasar Sekolah
                $default_settings = [
                    'schoolName' => $school_name,
                    'npsn' => $npsn,
                    'schoolLevel' => $level,
                    'address' => $address,
                    'latitude' => '-6.92720000',
                    'longitude' => '107.72250000',
                    'radiusMeters' => '150',
                    'timeInStart' => '06:00',
                    'timeInEnd' => '07:15',
                    'lateThreshold' => '07:15',
                    'timeOutStart' => '14:00',
                    'operatorName' => $admin_name,
                    'operatorPhone' => $phone
                ];

                $insSet = $pdo->prepare("
                    INSERT INTO school_settings (school_id, setting_key, setting_value, created_at, updated_at)
                    VALUES (?, ?, ?, NOW(), NOW())
                ");
                foreach ($default_settings as $k => $v) {
                    $insSet->execute([$new_school_id, $k, $v]);
                }

                // 6. Inisialisasi Aturan Presensi Default
                $pdo->prepare("
                    INSERT INTO attendance_rules (school_id, rule_code, rule_name, role_code, check_in_start, work_start_time, late_threshold_time, check_out_start, work_end_time, early_leave_threshold, allow_late, radius_limit, days_of_week)
                    VALUES 
                    (?, 'rule-std', 'Aturan Standar Siswa', 'siswa', '06:00:00', '07:00:00', '07:15:00', '14:00:00', '15:30:00', '13:30:00', 1, 150, '1,2,3,4,5'),
                    (?, 'rule-teacher', 'Aturan Standar Guru', 'guru', '06:30:00', '07:30:00', '07:45:00', '15:00:00', '16:00:00', '14:30:00', 1, 200, '1,2,3,4,5,6')
                ")->execute([$new_school_id, $new_school_id]);

                $pdo->commit();

                set_flash('success', "Pendaftaran sekolah berhasil! Silakan login menggunakan ID Admin: $identifier atau Email.");
                header("Location: $base_url/auth/login.php?registered=1");
                exit;
            }
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = 'Terjadi kesalahan sistem saat mendaftarkan sekolah: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id" class="h-full bg-slate-900">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Daftar Sekolah Baru - HadirTadz</title>
    <!-- PWA Manifest & Service Worker -->
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#065f46">
    <link rel="apple-touch-icon" href="<?= $base_url ?>/assets/img/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="HadirTadz">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        emerald: {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            200: '#a7f3d0',
                            300: '#6ee7b7',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                            800: '#065f46',
                            900: '#064e3b',
                        }
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="<?= $base_url ?>/assets/css/custom.css">
</head>
<body class="min-h-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100">

    <div class="w-full max-w-2xl">
        <!-- Logo & Brand Header -->
        <div class="text-center mb-6">
            <a href="<?= $base_url ?>/auth/login.php" class="inline-flex items-center flex-col gap-2 group">
                <img src="<?= $base_url ?>/logo.png" alt="Logo HadirTadz" class="h-14 w-auto object-contain mx-auto hover:scale-105 transition-transform duration-300">
                <div class="text-center">
                    <div class="flex items-center justify-center gap-1.5 text-2xl font-black tracking-tight">
                        <span class="text-emerald-300">Hadir</span><span class="text-emerald-400">Tadz</span>
                    </div>
                    <div class="text-xs text-emerald-300/80 font-medium">Platform Presensi Digital Multi-Tenant</div>
                </div>
            </a>
        </div>

        <!-- Registration Card -->
        <div class="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div class="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-white">Daftarkan Institusi Sekolah Baru</h2>
                    <p class="text-xs text-slate-300 mt-0.5">Satu sistem presensi terpadu untuk sekolah & madrasah Anda</p>
                </div>
                <a href="<?= $base_url ?>/auth/login.php" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali Login</span>
                </a>
            </div>

            <?php if (!empty($error)): ?>
                <div class="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                    <i class="fa-solid fa-circle-exclamation text-base text-rose-400"></i>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="space-y-5">
                <!-- Data Sekolah Section -->
                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-landmark"></i>
                        <span>1. Informasi Sekolah / Lembaga</span>
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Sekolah / Madrasah *</label>
                            <input type="text" name="school_name" required placeholder="Contoh: SMA Negeri 1 Teladan / Pesantren Al-Hikmah"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">NPSN / Nomor Statistik *</label>
                            <input type="text" name="npsn" required placeholder="Contoh: 20227912"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Jenjang Pendidikan *</label>
                            <select name="level" class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                                <option value="MA">MA (Madrasah Aliyah)</option>
                                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                                <option value="MTS">MTs (Madrasah Tsanawiyah)</option>
                                <option value="SD">SD (Sekolah Dasar)</option>
                                <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                                <option value="PESANTREN">Pondok Pesantren</option>
                                <option value="LAINNYA">Lainnya</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekolah</label>
                            <input type="text" name="address" placeholder="Jl. Raya Pendidikan No. 10..."
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                    </div>
                </div>

                <!-- Data Admin Section -->
                <div class="pt-2 border-t border-white/10">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-user-shield"></i>
                        <span>2. Akun Administrator Utama</span>
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Admin / PIC *</label>
                            <input type="text" name="admin_name" required placeholder="Contoh: Muhammad Syukri, S.Pd"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Username / ID Admin (Opsional)</label>
                            <input type="text" name="identifier" placeholder="Contoh: ADM-TELADAN (Otomatis jika kosong)"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Email Resmi Sekolah / Admin</label>
                            <input type="email" name="email" placeholder="admin@sekolah.sch.id"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / Telepon</label>
                            <input type="text" name="phone" placeholder="0812xxxxxxxx"
                                class="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi (Password) *</label>
                            <div class="relative">
                                <input type="password" name="password" id="password" required placeholder="Minimal 6 karakter"
                                    class="w-full px-3.5 py-2.5 pr-10 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                                <button type="button" onclick="togglePw('password')" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-400 transition" aria-label="Tampilkan kata sandi">
                                    <i class="fa-solid fa-eye" id="password-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Konfirmasi Kata Sandi *</label>
                            <div class="relative">
                                <input type="password" name="confirm_password" id="confirm_password" required placeholder="Ulangi kata sandi"
                                    class="w-full px-3.5 py-2.5 pr-10 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
                                <button type="button" onclick="togglePw('confirm_password')" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-400 transition" aria-label="Tampilkan kata sandi">
                                    <i class="fa-solid fa-eye" id="confirm_password-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-3">
                    <button type="submit" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-check-circle"></i>
                        <span>Daftarkan Sekolah & Buat Sistem Absensi</span>
                    </button>
                </div>
            </form>
        </div>

        <div class="mt-6 text-center text-xs text-slate-400">
            <span class="font-bold text-emerald-400">HadirTadz</span> &bull; &copy; 2026 Hak Cipta Dilindungi Undang-Undang
</div>

    </div>

    <script>
        function togglePw(id) {
            var el = document.getElementById(id);
            var icon = document.getElementById(id + '-eye');
            if (el.type === 'password') {
                el.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                el.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    </script>

    <script>
        // Register PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('<?= $base_url ?>/service-worker.js')
                    .catch(err => console.log('HadirTadz Service Worker Failed:', err));
            });
        }
    </script>

</body>
</html>