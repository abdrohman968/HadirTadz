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
        $password = $_POST['password'] ?? '';

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
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role_code'];
                $_SESSION['school_id'] = $user['school_id'];
                unset($user['password_hash']);
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


// STEP 4: Registration Success Screen
if (isset($_GET['registered']) && !empty($_SESSION['registration_success'])) {
    $reg = $_SESSION['registration_success'];
    unset($_SESSION['registration_success']);
    $reg_school = htmlspecialchars($reg['school_name']);
    $reg_code = htmlspecialchars($reg['school_code']);
    $reg_admin = htmlspecialchars($reg['admin_name']);
    $reg_id = htmlspecialchars($reg['identifier']);
    $reg_level = htmlspecialchars($reg['level']);
    $reg_kiosk = $reg['kiosk_url'] ?? '';
?>
<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Pendaftaran Berhasil - HadirTadz</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: {
                fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
                colors: { brand: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16' } }
            }}
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @keyframes checkBounce { 0%{transform:scale(0)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .animate-check { animation: checkBounce 0.5s ease-out; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade { animation: fadeUp 0.4s ease-out; }
    </style>
</head>
<body class="min-h-full bg-gray-50 font-sans text-gray-800 antialiased flex items-center justify-center p-4">
    <div class="w-full max-w-md animate-fade">
        <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
            <div class="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-5 animate-check">
                <i class="fa-solid fa-check text-4xl text-brand-600"></i>
            </div>
            <h1 class="text-2xl font-extrabold text-gray-900 mb-2">Pendaftaran Berhasil!</h1>
            <p class="text-sm text-gray-500 mb-6">Sekolah Anda telah terdaftar di HadirTadz. Berikut ringkasan akun Anda:</p>
            <div class="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-6 border border-gray-100">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Sekolah</span>
                    <span class="text-sm font-bold text-gray-800 text-right"><?= $reg_school ?></span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kode Sekolah</span>
                    <span class="text-sm font-mono font-bold text-brand-600"><?= $reg_code ?></span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jenjang</span>
                    <span class="text-sm font-semibold text-gray-700"><?= $reg_level ?></span>
                </div>
                <hr class="border-gray-200">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</span>
                    <span class="text-sm font-semibold text-gray-700 text-right"><?= $reg_admin ?></span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Username</span>
                    <span class="text-sm font-mono font-bold text-brand-600"><?= $reg_id ?></span>
                </div>
            </div>
            <a href="<?= $base_url ?>/auth/login.php" class="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-brand-600/20 transition active:scale-[0.98] text-center">
                <i class="fa-solid fa-right-to-bracket mr-2"></i>Masuk ke HadirTadz
            </a>
        </div>
        <p class="text-center text-xs text-gray-400 mt-5">&copy; 2026 HadirTadz</p>
    </div>
</body>
</html>
<?php exit; } ?>


<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Login - HadirTadz</title>
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#052e16">
    <link rel="apple-touch-icon" href="<?= $base_url ?>/assets/img/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="HadirTadz">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#f0fdf4',
                            100: '#dcfce7',
                            200: '#bbf7d0',
                            300: '#86efac',
                            400: '#4ade80',
                            500: '#22c55e',
                            600: '#16a34a',
                            700: '#15803d',
                            800: '#166534',
                            900: '#14532d',
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="<?= $base_url ?>/assets/css/custom.css">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .blur-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; pointer-events: none; }
    </style>
</head>
<body class="min-h-full bg-gray-50 antialiased">

    <div class="flex min-h-screen">

        <!-- LEFT BRANDING PANEL (Desktop only) -->
        <div class="hidden lg:flex lg:w-[44%] relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 overflow-hidden flex-col items-center justify-center p-10">
            <div class="blur-blob w-72 h-72 bg-white top-16 -left-20"></div>
            <div class="blur-blob w-56 h-56 bg-white bottom-20 right-[-4rem]"></div>
            <div class="blur-blob w-40 h-40 bg-brand-300 top-1/2 left-1/3"></div>

            <div class="relative z-10 flex flex-col items-center text-center">
                <img src="<?= $base_url ?>/logo.png" alt="Logo HadirTadz" class="h-20 w-auto object-contain mb-6 drop-shadow-lg">
                <h1 class="text-3xl font-extrabold text-white tracking-tight mb-1">HadirTadz</h1>
                <p class="text-brand-100 text-sm font-medium mb-2">Aplikasi Absensi Digital</p>
                <p class="text-brand-200/80 text-xs italic mb-10">"Disiplin hari ini, sukses nanti."</p>

                <div class="flex flex-col gap-3 w-full max-w-xs">
                    <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                        <div class="w-9 h-9 rounded-lg bg-brand-500/40 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-building text-white text-sm"></i>
                        </div>
                        <div class="text-left">
                            <p class="text-white text-xs font-bold">Multi-Tenant</p>
                            <p class="text-brand-200/70 text-[10px]">Satu platform, banyak sekolah</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                        <div class="w-9 h-9 rounded-lg bg-brand-500/40 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-location-dot text-white text-sm"></i>
                        </div>
                        <div class="text-left">
                            <p class="text-white text-xs font-bold">GPS Attendance</p>
                            <p class="text-brand-200/70 text-[10px]">Presensi berbasis lokasi</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                        <div class="w-9 h-9 rounded-lg bg-brand-500/40 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-chart-line text-white text-sm"></i>
                        </div>
                        <div class="text-left">
                            <p class="text-white text-xs font-bold">Real-time Dashboard</p>
                            <p class="text-brand-200/70 text-[10px]">Monitoring kehadiran instan</p>
                        </div>
                    </div>
                </div>
            </div>

            <p class="relative z-10 text-brand-200/60 text-[10px] mt-10">&copy; 2026 HadirTadz</p>
        </div>

        <!-- RIGHT: LOGIN AREA -->
        <div class="w-full lg:w-[56%] flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-10">

            <!-- Mobile-only branding -->
            <div class="lg:hidden text-center mb-6">
                <img src="<?= $base_url ?>/logo.png" alt="Logo HadirTadz" class="h-10 w-auto object-contain mx-auto mb-2">
                <div class="flex items-center justify-center gap-1">
                    <span class="text-xl font-extrabold text-brand-700">Hadir</span>
                    <span class="text-xl font-extrabold text-brand-500">Tadz</span>
                </div>
                <p class="text-[11px] text-gray-400 font-medium">Aplikasi Absensi Digital</p>
            </div>

            <!-- Login Card -->
            <div class="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                <!-- Card Header -->
                <div class="px-6 pt-7 pb-5">
                    <h2 class="text-xl font-extrabold text-gray-900">Selamat Datang!</h2>
                    <p class="text-sm text-gray-500 mt-1">Silakan masuk untuk melanjutkan.</p>
                </div>

                <!-- Card Body -->
                <div class="px-6 pb-7">

                    <?php
                    $flash = get_flash();
                    if ($flash):
                    ?>
                        <div role="alert" class="mb-5 p-3.5 rounded-xl <?= $flash['type'] === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700' ?> text-xs flex items-center gap-2.5">
                            <i class="fa-solid <?= $flash['type'] === 'error' ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-emerald-500' ?> text-base"></i>
                            <span><?= htmlspecialchars($flash['message']) ?></span>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($error)): ?>
                        <div role="alert" class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-shake">
                            <i class="fa-solid fa-circle-exclamation text-base text-red-500"></i>
                            <span><?= htmlspecialchars($error) ?></span>
                        </div>
                    <?php endif; ?>

                    <form method="POST" action="" class="space-y-4">

                        <!-- Email / Username -->
                        <div>
                            <label for="identifier-input" class="block text-xs font-semibold text-gray-500 mb-1.5">Email / Username</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <i class="fa-regular fa-user text-sm"></i>
                                </div>
                                <input type="text" id="identifier-input" name="identifier" required autofocus
                                    placeholder="Masukkan email atau username"
                                    value="<?= htmlspecialchars($_POST['identifier'] ?? '') ?>"
                                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition">
                            </div>
                        </div>

                        <!-- Password -->
                        <div>
                            <label for="password-input" class="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <i class="fa-solid fa-lock text-sm"></i>
                                </div>
                                <input type="password" id="password-input" name="password" required
                                    placeholder="Masukkan password"
                                    class="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition">
                                <button type="button" id="toggle-password-btn" onclick="togglePasswordVisibility()" aria-label="Tampilkan kata sandi"
                                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-brand-600 cursor-pointer transition">
                                    <i id="toggle-eye-icon" class="fa-regular fa-eye text-base"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Lupa Password -->
                        <div class="flex items-center justify-end">
                            <button type="button" id="forgot-toggle" onclick="toggleForgotPanel()" aria-expanded="false" aria-controls="forgot-password-panel"
                                class="text-xs text-brand-600 hover:text-brand-700 font-semibold transition">
                                Lupa Password?
                            </button>
                        </div>

                        <!-- Forgot Password Panel -->
                        <div id="forgot-password-panel" class="hidden p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                            <div class="flex items-start gap-2.5">
                                <i class="fa-solid fa-key text-amber-500 text-lg mt-0.5 shrink-0"></i>
                                <div class="flex-1">
                                    <p class="text-sm font-semibold text-gray-900 mb-1">Lupa Kata Sandi?</p>
                                    <p class="text-xs text-gray-600 leading-relaxed">
                                        Hubungi administrator sekolah Anda untuk me-reset kata sandi akun HadirTadz.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" id="submit-btn"
                            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer mt-6">
                            <span id="submit-text">Masuk</span>
                        </button>
                    </form>

                    <!-- Register CTA -->
                    <div class="mt-5 text-center border-t border-gray-100 pt-5">
                        <p class="text-xs text-gray-500">
                            belum punya akun?
                            <a href="<?= $base_url ?>/auth/register_school.php" class="text-brand-600 hover:text-brand-700 font-bold transition">Daftar Sekarang</a>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-6 text-center text-[11px] text-gray-400 font-medium">
                <span class="font-bold text-brand-600">HadirTadz v.1.0</span> &mdash; &copy; 2026
            </div>
        </div>
    </div>

    <script>
        function togglePasswordVisibility() {
            const pwd = document.getElementById('password-input');
            const icon = document.getElementById('toggle-eye-icon');
            const btn = document.getElementById('toggle-password-btn');
            if (pwd.type === 'password') {
                pwd.type = 'text';
                icon.className = 'fa-regular fa-eye-slash text-base';
                btn.setAttribute('aria-label', 'Sembunyikan kata sandi');
            } else {
                pwd.type = 'password';
                icon.className = 'fa-regular fa-eye text-base';
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
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('<?= $base_url ?>/service-worker.js')
                    .catch(err => console.log('HadirTadz Service Worker Failed:', err));
            });
        }
    </script>
</body>
</html>
