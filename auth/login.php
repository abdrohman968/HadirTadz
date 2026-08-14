<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

// Jika sudah login, redirect langsung ke dashboard masing-masing
if (auth_check()) {
    $user = auth_user();
    redirect_to_dashboard($user['role_code'] ?? 'admin');
}

$schools = get_all_schools();
$selected_school_id = isset($_GET['school_id']) ? (int)$_GET['school_id'] : (isset($_SESSION['selected_school_id']) ? (int)$_SESSION['selected_school_id'] : 1);
$current_school = current_school($selected_school_id);
$school_name = $current_school['name'] ?? 'SMA Terpadu Al-Mu\'min';
$base_url = get_base_url();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = trim($_POST['identifier'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $school_id = isset($_POST['school_id']) ? (int)$_POST['school_id'] : $selected_school_id;

    if (empty($identifier) || empty($password)) {
        $error = 'Silakan masukkan ID Pengguna / Email dan Kata Sandi.';
    } else {
        // Cari user berdasarkan identifier atau email
        // Di sistem multi-tenant, user dicocokkan dengan identifier/email dan school_id (jika dipilih) atau global email
        $stmt = $pdo->prepare("
            SELECT u.*, r.role_code, r.role_name, s.name AS school_name, s.logo_url AS school_logo_url
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE (u.identifier = ? OR u.email = ?) AND u.deleted_at IS NULL
            ORDER BY (u.school_id = ?) DESC
            LIMIT 1
        ");
        $stmt->execute([$identifier, $identifier, $school_id]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] !== 'active') {
                $error = 'Akun Anda sedang dinonaktifkan atau disuspend. Hubungi Administrator.';
            } else {
                // Login sukses
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role_code'];
                $_SESSION['school_id'] = $user['school_id'];
                $_SESSION['user_data'] = $user;

                // Update last login
                $update = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?");
                $update->execute([$user['id']]);

                // Audit log
                log_audit('LOGIN', 'users', $user['id'], 'User logged in successfully', $user['school_id']);

                set_flash('success', "Selamat datang kembali di HadirTadz, {$user['full_name']}!");
                redirect_to_dashboard($user['role_code']);
            }
        } else {
            $error = 'ID Pengguna / Username atau Kata Sandi salah!';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id" class="h-full bg-slate-950">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - HadirTadz (v.1.0)</title>
    <!-- PWA Manifest -->
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#065f46">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
                            950: '#022c22',
                        }
                    }
                }
            }
        }
    </script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="<?= $base_url ?>/assets/css/custom.css">
</head>
<body class="min-h-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">

    <div class="w-full max-w-md">
        
        <!-- App Branding & Dynamic School Logo Header -->
        <div class="text-center mb-6">
            <!-- Dynamic School / HadirTadz Logo -->
            <div class="inline-flex items-center justify-center p-3 rounded-3xl bg-emerald-900/40 border border-emerald-500/30 backdrop-blur-xl shadow-2xl mb-3 group hover:scale-105 transition-transform duration-300">
                <?php if (!empty($current_school['logo_url'])): ?>
                    <img id="school-logo-img" src="<?= htmlspecialchars($current_school['logo_url']) ?>" alt="Logo Sekolah" class="w-14 h-14 object-contain">
                <?php else: ?>
                    <!-- Official HadirTadz Modern Emblem -->
                    <div id="default-logo-icon" class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 text-white flex items-center justify-center text-3xl shadow-lg">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Two-Color App Name: Hadir (Dark Green / Emerald 700-800) + Tadz (Bright Green / Emerald 400) -->
            <div class="flex items-center justify-center gap-1.5">
                <span class="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm text-emerald-300">Hadir</span><span class="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm text-emerald-400">Tadz</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">v.1.0</span>
            </div>

            <!-- Dynamic School Title -->
            <h2 id="school-name-display" class="text-base font-bold text-slate-200 mt-1.5 truncate max-w-sm mx-auto">
                <?= htmlspecialchars($school_name) ?>
            </h2>
            <p class="text-xs text-emerald-300/80 font-medium">Sistem Presensi & Absensi Digital Multi-Tenant</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            
            <div class="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
                <div>
                    <h2 class="text-lg font-bold text-white">Masuk ke Portal</h2>
                    <p class="text-xs text-slate-300">Gunakan akun Admin, Guru, atau Siswa</p>
                </div>
                <a href="<?= $base_url ?>/scan.php" title="Buka Mode Kiosk Scanner Gerbang" class="px-3 py-1.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/70 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition group">
                    <i class="fa-solid fa-qrcode group-hover:rotate-12 transition-transform"></i>
                    <span>Kiosk</span>
                </a>
            </div>

            <?php 
            $flash = get_flash();
            if ($flash): 
            ?>
                <div class="mb-5 p-3.5 rounded-xl <?= $flash['type'] === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' ?> border text-xs flex items-center gap-2.5">
                    <i class="fa-solid <?= $flash['type'] === 'error' ? 'fa-circle-exclamation text-rose-400' : 'fa-circle-check text-emerald-400' ?> text-base"></i>
                    <span><?= htmlspecialchars($flash['message']) ?></span>
                </div>
            <?php endif; ?>

            <?php if (!empty($error)): ?>
                <div class="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                    <i class="fa-solid fa-circle-exclamation text-base text-rose-400"></i>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="space-y-4">
                
                <!-- Multi-School Selector (Dynamic Multi-Tenant) -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Pilihan Sekolah / Institusi</span>
                        <a href="<?= $base_url ?>/auth/register_school.php" class="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold lowercase tracking-normal">
                            + daftar baru
                        </a>
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-solid fa-school"></i>
                        </div>
                        <select name="school_id" id="school-select" onchange="onSchoolChange(this)"
                            class="w-full pl-10 pr-8 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none cursor-pointer">
                            <?php foreach ($schools as $sch): ?>
                                <option value="<?= $sch['id'] ?>" <?= $sch['id'] == $selected_school_id ? 'selected' : '' ?> data-name="<?= htmlspecialchars($sch['name']) ?>" data-logo="<?= htmlspecialchars($sch['logo_url'] ?? '') ?>">
                                    <?= htmlspecialchars($sch['name']) ?> (NPSN: <?= htmlspecialchars($sch['npsn']) ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>

                <!-- ID Pengguna / Identifier -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">ID Pengguna / NIP / NISN / Email</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-regular fa-user"></i>
                        </div>
                        <input type="text" id="identifier-input" name="identifier" required autofocus placeholder="Contoh: ADM-001 / NISN / Email"
                            class="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                    </div>
                </div>

                <!-- Password -->
                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Kata Sandi (Password)</label>
                        <button type="button" onclick="togglePasswordVisibility()" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                            <span id="toggle-text"><i class="fa-regular fa-eye mr-1"></i>Lihat</span>
                        </button>
                    </div>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                        <input type="password" id="password-input" name="password" required placeholder="Masukkan kata sandi..."
                            class="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2">
                    <span>Masuk ke HadirTadz</span>
                    <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                </button>

                <!-- Divider -->
                <div class="relative flex py-2 items-center">
                    <div class="flex-grow border-t border-slate-700"></div>
                    <span class="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Atau</span>
                    <div class="flex-grow border-t border-slate-700"></div>
                </div>

                <!-- Google SSO Button -->
                <a href="<?= $base_url ?>/auth/google_auth.php?demo=1" class="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 shadow-md transition flex items-center justify-center gap-2.5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Masuk dengan Google (SSO Admin)</span>
                </a>
            </form>

            <!-- Quick Demo Accounts Switcher -->
            <div class="mt-6 pt-5 border-t border-white/10">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">Akun Demo (Klik untuk Isi Otomatis)</p>
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" onclick="fillDemo('ADM-001', 'hadir123')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group">
                        <div class="text-[11px] font-bold text-emerald-400 group-hover:text-white">Admin</div>
                        <div class="text-[10px] text-slate-400 font-mono">ADM-001</div>
                    </button>
                    <button type="button" onclick="fillDemo('198503152010011002', 'hadir123')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group">
                        <div class="text-[11px] font-bold text-emerald-400 group-hover:text-white">Guru</div>
                        <div class="text-[10px] text-slate-400 font-mono">Pak Budi</div>
                    </button>
                    <button type="button" onclick="fillDemo('12009101', 'hadir123')" class="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group">
                        <div class="text-[11px] font-bold text-emerald-400 group-hover:text-white">Siswa</div>
                        <div class="text-[10px] text-slate-400 font-mono">Rizky</div>
                    </button>
                </div>
            </div>

            <!-- Daftar Sekolah Baru Link -->
            <div class="mt-4 text-center">
                <a href="<?= $base_url ?>/auth/register_school.php" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition">
                    <i class="fa-solid fa-plus-circle"></i>
                    <span>Daftarkan Sekolah Baru ke HadirTadz &rarr;</span>
                </a>
            </div>
        </div>

        <!-- Footer Hak Cipta Sesuai Revisi: HadirTadz v.1.0 - © 2026 -->
        <div class="mt-6 text-center text-xs text-slate-400 font-medium">
            <span class="font-bold text-emerald-400">HadirTadz v.1.0</span> - &copy; 2026
        </div>
    </div>

    <script>
        function togglePasswordVisibility() {
            const pwd = document.getElementById('password-input');
            const toggleText = document.getElementById('toggle-text');
            if (pwd.type === 'password') {
                pwd.type = 'text';
                toggleText.innerHTML = '<i class="fa-regular fa-eye-slash mr-1"></i>Sembunyi';
            } else {
                pwd.type = 'password';
                toggleText.innerHTML = '<i class="fa-regular fa-eye mr-1"></i>Lihat';
            }
        }

        function fillDemo(identifier, password) {
            document.getElementById('identifier-input').value = identifier;
            document.getElementById('password-input').value = password;
        }

        function onSchoolChange(select) {
            const selectedOpt = select.options[select.selectedIndex];
            const schoolName = selectedOpt.getAttribute('data-name');
            const schoolLogo = selectedOpt.getAttribute('data-logo');
            
            const nameDisplay = document.getElementById('school-name-display');
            if (nameDisplay && schoolName) {
                nameDisplay.textContent = schoolName;
            }
        }
    </script>
</body>
</html>