<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/design_system.php';

$current_user = auth_user();
$school = current_school($current_user['school_id'] ?? null);
$school_name = $school['name'] ?? get_setting('schoolName', 'SMA Negeri Harapan Bangsa');
$base_url = get_base_url();
$page_title = $page_title ?? 'Absensi Digital';
?>
<!DOCTYPE html>
<html lang="id" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">
    <title><?= htmlspecialchars($page_title) ?> - HadirTadz (<?= htmlspecialchars($school_name) ?>)</title>
    
    <!-- PWA Manifest & App Icons -->
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#065f46">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="HadirTadz">
    <link rel="apple-touch-icon" href="<?= $base_url ?>/assets/img/icon.svg">

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
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?= $base_url ?>/assets/css/custom.css">
    <!-- ApexCharts CDN -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</head>
<body class="h-dvh flex flex-col overflow-hidden bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">

    <!-- Top Navigation Bar -->
    <header class="no-print flex-shrink-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900">
        <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Left: Desktop Burger, Brand -->
                <div class="flex items-center gap-3">
                    <!-- Desktop Burger: hide/show sidebar -->
                    <button id="desktop-sidebar-btn" type="button" title="Tampilkan / Sembunyikan menu samping" class="hidden lg:flex items-center justify-center p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <i class="fa-solid fa-bars text-xl"></i>
                    </button>
                    <a href="<?= $base_url ?>/index.php" class="flex items-center gap-2.5 group">
                        <div class="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-extrabold text-xl shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                            <?php if (!empty($school['logo_url'])): ?>
                                <img src="<?= htmlspecialchars($school['logo_url']) ?>" alt="Logo" class="w-full h-full object-contain p-1">
                            <?php else: ?>
                                <i class="fa-solid fa-graduation-cap"></i>
                            <?php endif; ?>
                        </div>
                        <div>
                            <div class="font-extrabold text-base tracking-tight leading-tight flex items-center gap-1">
                                <span class="text-white">Hadir</span><span class="text-emerald-300">Tadz</span>
                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 hidden sm:inline-block font-mono">v.1.0</span>
                            </div>
                            <div class="text-[11px] text-emerald-200 font-medium truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                                <?= htmlspecialchars($school_name) ?>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Right: Clock, Kiosk Button, User Menu -->
                <div class="flex items-center gap-2 sm:gap-4">
                    <!-- Live Digital Clock -->
                    <div class="hidden sm:flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/50 px-3 py-1.5 rounded-lg text-emerald-100 font-mono text-xs font-semibold">
                        <i class="fa-regular fa-clock text-emerald-400"></i>
                        <span class="live-clock">--:--:--</span>
                    </div>

                    <!-- Kiosk Shortcut -->
                    <a href="<?= $base_url ?>/scan.php" target="_blank" class="hidden md:inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition">
                        <i class="fa-solid fa-qrcode text-emerald-300"></i>
                        <span>Kiosk Gerbang</span>
                    </a>

                    <!-- User Profile Dropdown -->
                    <?php if ($current_user): ?>
                    <div class="relative group">
                        <button type="button" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-emerald-700/60 transition focus:outline-none">
                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600 border-2 border-emerald-300 flex items-center justify-center font-bold text-white shadow-sm overflow-hidden text-xs">
                                <?php if (!empty($current_user['avatar_url'])): ?>
                                    <img src="<?= htmlspecialchars($current_user['avatar_url']) ?>" alt="Avatar" class="w-full h-full object-cover">
                                <?php else: ?>
                                    <?= strtoupper(substr($current_user['full_name'], 0, 1)) ?>
                                <?php endif; ?>
                            </div>
                            <div class="hidden lg:block text-left">
                                <div class="text-xs font-semibold leading-tight text-white"><?= htmlspecialchars(explode(' ', $current_user['full_name'])[0]) ?></div>
                                <div class="text-[10px] text-emerald-200 capitalize font-medium"><?= htmlspecialchars($current_user['role_name'] ?? $current_user['role_code']) ?></div>
                            </div>
                            <i class="fa-solid fa-chevron-down text-[10px] text-emerald-200 hidden lg:block"></i>
                        </button>

                        <!-- Dropdown Menu -->
                        <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block transition-all z-50 text-slate-700">
                            <div class="px-4 py-2 border-b border-slate-100">
                                <p class="text-xs text-slate-500 font-medium">Masuk sebagai:</p>
                                <p class="text-sm font-bold text-slate-800 truncate"><?= htmlspecialchars($current_user['full_name']) ?></p>
                                <p class="text-xs text-emerald-600 font-mono"><?= htmlspecialchars($current_user['identifier']) ?></p>
                                <p class="text-[10px] text-slate-400 truncate mt-0.5"><?= htmlspecialchars($school_name) ?></p>
                            </div>
                            <a href="<?= $base_url ?>/auth/profile.php" class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition">
                                <i class="fa-solid fa-user-gear text-slate-400 w-4"></i>
                                <span>Profil & Password</span>
                            </a>
                            <div class="my-1 border-t border-slate-100"></div>
                            <a href="<?= $base_url ?>/auth/logout.php" class="flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition">
                                <i class="fa-solid fa-arrow-right-from-bracket text-rose-500 w-4"></i>
                                <span>Keluar (Logout)</span>
                            </a>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </header>

    <!-- App Body: Height 100vh Flex Container with no double-scroll on desktop -->
    <div class="flex-1 flex overflow-hidden relative">
