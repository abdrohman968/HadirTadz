<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

// Jika sudah login, redirect langsung ke dashboard masing-masing
if (auth_check()) {
    $user = auth_user();
    redirect_to_dashboard($user['role_code'] ?? 'admin');
}

$base_url = get_base_url();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = trim($_POST['identifier'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($identifier) || empty($password)) {
        $error = 'Silakan masukkan ID Pengguna / Email dan Kata Sandi.';
    } else {
        // Cari user berdasarkan identifier atau email (login umum tanpa pilihan sekolah)
        $stmt = $pdo->prepare("
            SELECT u.*, r.role_code, r.role_name, s.name AS school_name, s.logo_url AS school_logo_url
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE (u.identifier = ? OR u.email = ?) AND u.deleted_at IS NULL
            ORDER BY u.id ASC
            LIMIT 1
        ");
        $stmt->execute([$identifier, $identifier]);
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Login - HadirTadz</title>
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
                    },
                    keyframes: {
                        shake: {
                            '0%, 100%': { transform: 'translateX(0)' },
                            '25%': { transform: 'translateX(-4px)' },
                            '75%': { transform: 'translateX(4px)' },
                        }
                    },
                    animation: {
                        shake: 'shake 0.3s ease-in-out 0s 2',
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

    <div class="w-full max-w-md my-auto">

        <!-- App Branding -->
        <div class="text-center mb-3">
            <!-- Logo (tanpa frame, sesuai tampilan modern) -->
            <div class="text-center mb-2">
                <img src="<?= $base_url ?>/logo.png" alt="Logo HadirTadz" class="h-14 w-auto object-contain mx-auto hover:scale-105 transition-transform duration-300">
            </div>

            <!-- Two-Color App Name -->
            <div class="flex items-center justify-center gap-1.5">
                <span class="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-300">Hadir</span>
                <span class="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-400">Tadz</span>
            </div>

            <p class="text-[11px] text-emerald-300/80 font-medium">Sistem Presensi & Absensi Digital Multi-Tenant</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">

            <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
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
                <div role="alert" class="mb-5 p-3.5 rounded-xl <?= $flash['type'] === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' ?> border text-xs flex items-center gap-2.5">
                    <i class="fa-solid <?= $flash['type'] === 'error' ? 'fa-circle-exclamation text-rose-400' : 'fa-circle-check text-emerald-400' ?> text-base"></i>
                    <span><?= htmlspecialchars($flash['message']) ?></span>
                </div>
            <?php endif; ?>

            <?php if (!empty($error)): ?>
                <div role="alert" class="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
                    <i class="fa-solid fa-circle-exclamation text-base text-rose-400"></i>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="space-y-3.5">

                <!-- ID Pengguna -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">ID Pengguna / NIP / NISN / Email</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-regular fa-user"></i>
                        </div>
                        <input type="text" id="identifier-input" name="identifier" required autofocus placeholder="Contoh: ADM-001 / NISN / Email" value="<?= htmlspecialchars($_POST['identifier'] ?? '') ?>"
                            class="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                    </div>
                </div>

                <!-- Password (ikon mata di dalam field, tanpa teks "Lihat") -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Kata Sandi (Password)</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                        <input type="password" id="password-input" name="password" required placeholder="Masukkan kata sandi..."
                            class="w-full pl-10 pr-11 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition">
                        <button type="button" id="toggle-password-btn" onclick="togglePasswordVisibility()" aria-label="Tampilkan kata sandi"
                            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-emerald-300 cursor-pointer">
                            <i id="toggle-eye-icon" class="fa-regular fa-eye w-5 h-5 text-base"></i>
                        </button>
                    </div>
                </div>

                <!-- Ingat Saya + Lupa Password? -->
                <div class="flex items-center justify-between mt-2">
                    <label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input type="checkbox" name="remember" value="1" class="w-4 h-4 rounded-md border-slate-600 bg-slate-900/60 text-emerald-500 focus:ring-emerald-500 focus:ring-2">
                        <span>Ingat Saya</span>
                    </label>
                    <button type="button" id="forgot-toggle" onclick="toggleForgotPanel()" aria-expanded="false" aria-controls="forgot-password-panel"
                        class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
                        Lupa Password?
                    </button>
                </div>

                <!-- Forgot Password Panel -->
                <div id="forgot-password-panel" class="hidden p-4 rounded-2xl bg-slate-900/50 border border-emerald-500/25 text-left">
                    <div class="flex items-start gap-2.5">
                        <i class="fa-solid fa-key text-emerald-400 text-xl mt-0.5 flex-shrink-0"></i>
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-white mb-1">Lupa Kata Sandi?</p>
                            <p class="text-xs text-slate-300 leading-relaxed">
                                Hubungi administrator sekolah Anda untuk me-reset kata sandi akun HadirTadz.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submit-btn"
                    class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer">
                    <span id="submit-text">Masuk</span>
                </button>
            </form>

            <!-- Daftar Sekolah Baru -->
            <div class="mt-3 text-center">
                <a href="<?= $base_url ?>/auth/register_school.php" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition">
                    <i class="fa-solid fa-plus-circle"></i>
                    <span>+ Daftarkan Sekolah Baru</span>
                </a>
            </div>
        </div>

        <!-- Footer Hak Cipta -->
        <div class="mt-4 text-center text-xs text-slate-400 font-medium">
            <span class="font-bold text-emerald-400">HadirTadz v.1.0</span> - &copy; 2026
        </div>
    </div>

    <script>
        function togglePasswordVisibility() {
            const pwd = document.getElementById('password-input');
            const icon = document.getElementById('toggle-eye-icon');
            const btn = document.getElementById('toggle-password-btn');
            if (pwd.type === 'password') {
                pwd.type = 'text';
                icon.className = 'fa-regular fa-eye-slash w-5 h-5 text-base';
                btn.setAttribute('aria-label', 'Sembunyikan kata sandi');
            } else {
                pwd.type = 'password';
                icon.className = 'fa-regular fa-eye w-5 h-5 text-base';
                btn.setAttribute('aria-label', 'Tampilkan kata sandi');
            }
        }

        function toggleForgotPanel() {
            const panel = document.getElementById('forgot-password-panel');
            const btn = document.getElementById('forgot-toggle');
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            panel.classList.toggle('hidden', expanded);
            btn.setAttribute('aria-expanded', String(!expanded));
        }

        // Tambahkan spinner loading saat submit, dan disable tombol agar tidak dobel klik.
        // Dipasang pada event 'submit' form (bukan click tombol) agar button yang di-disable
        // tidak membatalkan pengiriman form di browser.
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', function (e) {
                if (!document.getElementById('identifier-input').value.trim() || !document.getElementById('password-input').value) {
                    return;
                }
                const btn = document.getElementById('submit-btn');
                btn.disabled = true;
                btn.classList.add('opacity-60');
                document.getElementById('submit-text').innerHTML =
                    '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
            });
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