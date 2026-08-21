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
    // P2.3: email/telepon institusi terpisah dari email/telepon admin (canonical: schools.email)
    $email_sekolah = trim($_POST['email_sekolah'] ?? '');
    $phone_sekolah = trim($_POST['phone_sekolah'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $province = trim($_POST['province'] ?? '');
    $postal_code = trim($_POST['postal_code'] ?? '');
    $admin_name = trim($_POST['admin_name'] ?? '');
    $identifier = trim($_POST['identifier'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $nik = trim($_POST['nik'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $agree_terms  = isset($_POST['agree_terms'])  ? 1 : 0;
    $agree_privacy = isset($_POST['agree_privacy']) ? 1 : 0;

    if (empty($school_name) || empty($npsn) || empty($admin_name) || empty($password)) {
        $error = 'Harap lengkapi semua kolom wajib (Nama Sekolah, NPSN, Nama Admin, dan Kata Sandi).';
    } elseif ($password !== $confirm_password) {
        $error = 'Konfirmasi kata sandi tidak cocok.';
    } elseif (strlen($password) < 6) {
        $error = 'Kata sandi minimal harus 6 karakter.';
    } elseif (!$agree_terms || !$agree_privacy) {
        $error = 'Anda harus menyetujui Syarat & Ketentuan DAN Kebijakan Privasi.';
    } elseif (mb_strlen($city) > 100) {
        $error = 'Kota/Kabupaten maksimal 100 karakter.';
    } elseif (mb_strlen($province) > 100) {
        $error = 'Provinsi maksimal 100 karakter.';
    } elseif (mb_strlen($postal_code) > 10) {
        $error = 'Kode Pos maksimal 10 karakter.';
    } elseif (mb_strlen($nik) > 30) {
        $error = 'NIK/NIP Admin maksimal 30 karakter.';
    } elseif (mb_strlen($email_sekolah) > 100) {
        $error = 'Email Sekolah maksimal 100 karakter.';
    } elseif (mb_strlen($phone_sekolah) > 30) {
        $error = 'No. Telepon Sekolah maksimal 30 karakter.';
    } else {
        try {
            $stmt = $pdo->prepare("SELECT id FROM schools WHERE npsn = ? LIMIT 1");
            $stmt->execute([$npsn]);
            if ($stmt->fetch()) {
                $error = "Sekolah dengan NPSN $npsn sudah terdaftar!";
            } else {
                $pdo->beginTransaction();

                $school_code = 'SCH-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $school_name), 0, 3)) . rand(100, 999);

                $insSchool = $pdo->prepare("
                    INSERT INTO schools (school_code, npsn, name, level, address, city, province, postal_code, phone, email, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                ");
                $insSchool->execute([$school_code, $npsn, $school_name, $level, $address, $city, $province, $postal_code, $phone_sekolah, $email_sekolah]);
                $new_school_id = $pdo->lastInsertId();

                if (empty($identifier)) {
                    $identifier = 'ADM-' . rand(100, 999);
                }

                $pass_hash = password_hash($password, PASSWORD_BCRYPT);
                $insUser = $pdo->prepare("
                    INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, email, phone, nik, status, created_at, updated_at)
                    VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
                ");
                $insUser->execute([$new_school_id, $identifier, $admin_name, $pass_hash, $email, $phone, $nik]);
                $new_user_id = (int)$pdo->lastInsertId();

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

                $pdo->prepare("
                    INSERT INTO attendance_rules (school_id, rule_code, rule_name, role_code, check_in_start, work_start_time, late_threshold_time, check_out_start, work_end_time, early_leave_threshold, allow_late, radius_limit, days_of_week)
                    VALUES 
                    (?, 'rule-std', 'Aturan Standar Siswa', 'siswa', '06:00:00', '07:00:00', '07:15:00', '14:00:00', '15:30:00', '13:30:00', 1, 150, '1,2,3,4,5'),
                    (?, 'rule-teacher', 'Aturan Standar Guru', 'guru', '06:30:00', '07:30:00', '07:45:00', '15:00:00', '16:00:00', '14:30:00', 1, 200, '1,2,3,4,5,6')
                ")->execute([$new_school_id, $new_school_id]);

                $kiosk_gen = null;
                try {
                    $kiosk_gen = kiosk_generate_token($new_school_id, 'Kiosk Gerbang', null);
                } catch (Exception $e) {
                    $kiosk_gen = null;
                }

                // P2.2+P2.4: simpan bukti persetujuan Terms & Privacy.
                // Menggunakan konstanta versi dari config/helpers.php (TERMS_VERSION, PRIVACY_VERSION).
                // Di dalam transaksi — jika gagal, seluruh registrasi di-rollback.
                $consent_ip = $_SERVER['REMOTE_ADDR'] ?? null;
                $consent_ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);
                $insConsent = $pdo->prepare("
                    INSERT INTO legal_consents (school_id, user_id, consent_type, consent_version, ip_address, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $insConsent->execute([$new_school_id, $new_user_id, 'terms',  TERMS_VERSION,  $consent_ip, $consent_ua]);
                $insConsent->execute([$new_school_id, $new_user_id, 'privacy', PRIVACY_VERSION, $consent_ip, $consent_ua]);

                $pdo->commit();

                $_SESSION['registration_success'] = [
                    'school_name' => $school_name,
                    'school_code' => $school_code,
                    'admin_name' => $admin_name,
                    'identifier' => $identifier,
                    'level' => $level,
                ];
                if ($kiosk_gen !== null) {
                    $_SESSION['registration_success']['kiosk_url'] = get_base_url() . "/scan.php?k={$kiosk_gen['token']}";
                }
                header("Location: $base_url/auth/login.php?registered=1");
                exit;
            }
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = 'Terjadi kesalahan sistem saat mendaftarkan sekolah. Silakan coba lagi.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Daftar Sekolah Baru - HadirTadz</title>
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#052e16">
    <link rel="apple-touch-icon" href="<?= $base_url ?>/assets/img/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="HadirTadz">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { 'jakarta': ['"Plus Jakarta Sans"', 'sans-serif'] },
                    colors: {
                        brand: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534', 900:'#14532d', 950:'#052e16' }
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .step-circle { transition: all 0.3s ease; }
        .step-content { display: none; }
        .step-content.active { display: block; animation: fadeSlideIn 0.35s ease; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .step-line { transition: background-color 0.3s ease; }
        input:focus, select:focus { box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
        .btn-loading { pointer-events: none; opacity: 0.7; }
    </style>
</head>
<body class="min-h-full bg-gray-50">

    <div class="min-h-full flex flex-col lg:flex-row">
        <!-- Left Branding Panel -->
        <div class="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden items-center justify-center p-12">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                <div class="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            <div class="relative z-10 max-w-md text-center text-white">
                <img src="<?= $base_url ?>/logo.png" alt="Logo HadirTadz" class="h-20 w-auto mx-auto mb-8 drop-shadow-lg">
                <h1 class="text-4xl font-extrabold tracking-tight mb-4">
                    <span class="text-white">Hadir</span><span class="text-brand-200">Tadz</span>
                </h1>
                <p class="text-brand-100 text-base leading-relaxed mb-8">Platform Presensi Digital Multi-Tenant untuk Sekolah &amp; Madrasah</p>
                <div class="space-y-4 text-left">
                    <div class="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="fa-solid fa-shield-halved text-sm text-white"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-sm">Sistem Multi-Tenant Aman</div>
                            <div class="text-brand-200 text-xs mt-0.5">Data sekolah terisolasi dan terenkripsi</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="fa-solid fa-qr-code text-sm text-white"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-sm">Absensi QR Code & Kiosk</div>
                            <div class="text-brand-200 text-xs mt-0.5">Cepat, mudah, dan akurat untuk siswa & guru</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="fa-solid fa-chart-line text-sm text-white"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-sm">Dashboard Real-Time</div>
                            <div class="text-brand-200 text-xs mt-0.5">Monitoring kehadiran kapan saja &amp; di mana saja</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Form Panel -->
        <div class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <div class="w-full max-w-xl">
                <!-- Mobile Logo -->
                <div class="lg:hidden text-center mb-6">
                    <a href="<?= $base_url ?>/auth/login.php" class="inline-flex items-center gap-2">
                        <img src="<?= $base_url ?>/logo.png" alt="Logo" class="h-10 w-auto">
                        <span class="text-2xl font-extrabold tracking-tight"><span class="text-brand-600">Hadir</span><span class="text-brand-700">Tadz</span></span>
                    </a>
                </div>

                <!-- Card -->
                <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <!-- Header -->
                    <div class="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100">
                        <h2 class="text-xl font-bold text-gray-900">Daftarkan Sekolah Baru</h2>
                        <p class="text-sm text-gray-500 mt-1">Isi data berikut untuk membuat akun sekolah</p>
                    </div>

                    <!-- Step Indicator -->
                    <div class="px-6 sm:px-8 pt-6 pb-2">
                        <div class="flex items-center justify-between max-w-sm mx-auto">
                            <div class="flex flex-col items-center" id="step-ind-1">
                                <div class="step-circle w-10 h-10 rounded-full border-2 border-brand-500 bg-brand-500 text-white flex items-center justify-center text-sm font-bold" id="step-circle-1">
                                    <span id="step-num-1">1</span>
                                    <i class="fa-solid fa-check hidden" id="step-check-1"></i>
                                </div>
                                <span class="text-xs font-semibold text-brand-600 mt-2" id="step-label-1">Sekolah</span>
                            </div>
                            <div class="step-line flex-1 h-0.5 mx-2 bg-gray-200 rounded-full" id="step-line-1"></div>
                            <div class="flex flex-col items-center" id="step-ind-2">
                                <div class="step-circle w-10 h-10 rounded-full border-2 border-gray-200 bg-white text-gray-400 flex items-center justify-center text-sm font-bold" id="step-circle-2">
                                    <span id="step-num-2">2</span>
                                    <i class="fa-solid fa-check hidden" id="step-check-2"></i>
                                </div>
                                <span class="text-xs font-semibold text-gray-400 mt-2" id="step-label-2">Admin</span>
                            </div>
                            <div class="step-line flex-1 h-0.5 mx-2 bg-gray-200 rounded-full" id="step-line-2"></div>
                            <div class="flex flex-col items-center" id="step-ind-3">
                                <div class="step-circle w-10 h-10 rounded-full border-2 border-gray-200 bg-white text-gray-400 flex items-center justify-center text-sm font-bold" id="step-circle-3">
                                    <span id="step-num-3">3</span>
                                    <i class="fa-solid fa-check hidden" id="step-check-3"></i>
                                </div>
                                <span class="text-xs font-semibold text-gray-400 mt-2" id="step-label-3">Review</span>
                            </div>
                        </div>
                    </div>

                    <!-- Error Alert -->
                    <?php if (!empty($error)): ?>
                    <div class="mx-6 sm:mx-8 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5" id="server-error">
                        <i class="fa-solid fa-circle-exclamation text-red-500 flex-shrink-0"></i>
                        <span><?= htmlspecialchars($error) ?></span>
                    </div>
                    <?php endif; ?>

                    <!-- Form -->
                    <form method="POST" action="" id="regForm" class="px-6 sm:px-8 py-6">
                        <input type="hidden" name="step" id="currentStepInput" value="1">

                        <!-- STEP 1: Informasi Sekolah -->
                        <div class="step-content active" id="step-1">
                            <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i class="fa-solid fa-landmark text-brand-500"></i>
                                Informasi Sekolah
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nama Sekolah <span class="text-red-500">*</span></label>
                                    <input type="text" name="school_name" id="school_name" placeholder="Contoh: SMA Negeri 1 Teladan"
                                        class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">NPSN <span class="text-red-500">*</span></label>
                                        <input type="text" name="npsn" id="npsn" placeholder="Contoh: 20227912"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Jenjang <span class="text-red-500">*</span></label>
                                        <select name="level" id="level"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                            <option value="SMA">SMA</option>
                                            <option value="SMK">SMK</option>
                                            <option value="MA">MA</option>
                                            <option value="SMP">SMP</option>
                                            <option value="MTS">MTs</option>
                                            <option value="SD">SD</option>
                                            <option value="MI">MI</option>
                                            <option value="PESANTREN">Pesantren</option>
                                            <option value="LAINNYA">Lainnya</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                                    <input type="text" name="address" id="address" placeholder="Jl. Raya Pendidikan No. 10..."
                                        class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Kota/Kabupaten</label>
                                        <input type="text" name="city" id="city" maxlength="100" placeholder="Contoh: Bandung"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Provinsi</label>
                                        <input type="text" name="province" id="province" maxlength="100" placeholder="Contoh: Jawa Barat"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Kode Pos</label>
                                        <input type="text" name="postal_code" id="postal_code" maxlength="10" placeholder="Contoh: 40123"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Sekolah</label>
                                        <input type="email" name="email_sekolah" id="email_sekolah" placeholder="info@sekolah.sch.id"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">No. Telepon Sekolah</label>
                                        <input type="tel" name="phone_sekolah" id="phone_sekolah" placeholder="021-xxxxxxx"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: Admin Sekolah -->
                        <div class="step-content" id="step-2">
                            <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i class="fa-solid fa-user-shield text-brand-500"></i>
                                Admin Sekolah
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap Admin <span class="text-red-500">*</span></label>
                                    <input type="text" name="admin_name" id="admin_name" placeholder="Contoh: Muhammad Syukri, S.Pd"
                                        class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">NIK / NIP Admin</label>
                                        <input type="text" name="nik" id="nik" maxlength="30" placeholder="Opsional — maks. 30 karakter"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition font-mono">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username / ID Admin</label>
                                        <input type="text" name="identifier" id="identifier" placeholder="Otomatis jika kosong"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Admin</label>
                                        <input type="email" name="email" id="email_admin" placeholder="admin@sekolah.sch.id"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">No. WhatsApp</label>
                                        <input type="tel" name="phone" id="phone_admin" placeholder="0812xxxxxxxx"
                                            class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Kata Sandi <span class="text-red-500">*</span></label>
                                    <div class="relative">
                                        <input type="password" name="password" id="password" placeholder="Minimal 6 karakter"
                                            class="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                        <button type="button" onclick="togglePw('password')" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-brand-600 transition" aria-label="Tampilkan kata sandi">
                                            <i class="fa-solid fa-eye text-sm" id="password-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Kata Sandi <span class="text-red-500">*</span></label>
                                    <div class="relative">
                                        <input type="password" name="confirm_password" id="confirm_password" placeholder="Ulangi kata sandi"
                                            class="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition">
                                        <button type="button" onclick="togglePw('confirm_password')" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-brand-600 transition" aria-label="Tampilkan kata sandi">
                                            <i class="fa-solid fa-eye text-sm" id="confirm_password-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- STEP 3: Review & Persetujuan -->
                        <div class="step-content" id="step-3">
                            <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i class="fa-solid fa-clipboard-check text-brand-500"></i>
                                Review &amp; Persetujuan
                            </h3>

                            <div class="space-y-4">
                                <!-- School Summary -->
                                <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                    <div class="flex items-center gap-2 mb-3">
                                        <i class="fa-solid fa-landmark text-brand-500 text-sm"></i>
                                        <span class="text-sm font-bold text-gray-800">Informasi Sekolah</span>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                                        <div>
                                            <span class="text-gray-500 text-xs">Nama Sekolah</span>
                                            <p class="font-medium text-gray-900" id="rev-school-name">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">NPSN</span>
                                            <p class="font-medium text-gray-900" id="rev-npsn">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Jenjang</span>
                                            <p class="font-medium text-gray-900" id="rev-level">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Alamat</span>
                                            <p class="font-medium text-gray-900" id="rev-address">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Kota/Kabupaten</span>
                                            <p class="font-medium text-gray-900" id="rev-city">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Provinsi</span>
                                            <p class="font-medium text-gray-900" id="rev-province">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Kode Pos</span>
                                            <p class="font-medium text-gray-900" id="rev-postal-code">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Email Sekolah</span>
                                            <p class="font-medium text-gray-900" id="rev-email-sekolah">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Telepon Sekolah</span>
                                            <p class="font-medium text-gray-900" id="rev-phone-sekolah">-</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Admin Summary -->
                                <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                    <div class="flex items-center gap-2 mb-3">
                                        <i class="fa-solid fa-user-shield text-brand-500 text-sm"></i>
                                        <span class="text-sm font-bold text-gray-800">Admin Sekolah</span>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                                        <div>
                                            <span class="text-gray-500 text-xs">Nama Lengkap</span>
                                            <p class="font-medium text-gray-900" id="rev-admin-name">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Username / ID</span>
                                            <p class="font-medium text-gray-900" id="rev-identifier">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">NIK / NIP</span>
                                            <p class="font-medium text-gray-900" id="rev-nik">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">Email Admin</span>
                                            <p class="font-medium text-gray-900" id="rev-email-admin">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-500 text-xs">No. WhatsApp</span>
                                            <p class="font-medium text-gray-900" id="rev-phone-admin">-</p>
                                        </div>
                                        <div class="sm:col-span-2">
                                            <span class="text-gray-500 text-xs">Kata Sandi</span>
                                            <p class="font-medium text-gray-900">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Terms & Privacy (P2.4 — separate checkboxes with links) -->
                                <div class="bg-brand-50 rounded-xl border border-brand-200 p-4 space-y-3">
                                    <label class="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" name="agree_terms" id="agree_terms" class="mt-0.5 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500">
                                        <span class="text-sm text-gray-700 leading-relaxed">
                                            Saya telah membaca dan menyetujui <a href="<?= $base_url ?>/terms.php" target="_blank" class="text-brand-600 font-semibold hover:underline">Syarat &amp; Ketentuan</a> HadirTadz.
                                        </span>
                                    </label>
                                    <label class="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" name="agree_privacy" id="agree_privacy" class="mt-0.5 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500">
                                        <span class="text-sm text-gray-700 leading-relaxed">
                                            Saya telah membaca dan menyetujui <a href="<?= $base_url ?>/privacy.php" target="_blank" class="text-brand-600 font-semibold hover:underline">Kebijakan Privasi</a> HadirTadz.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="mt-6 flex items-center gap-3">
                            <button type="button" id="btnBack" onclick="navigateStep(-1)"
                                class="hidden px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                                <i class="fa-solid fa-arrow-left mr-1.5"></i> Kembali
                            </button>
                            <button type="button" id="btnNext" onclick="navigateStep(1)"
                                class="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-200 transition flex items-center justify-center gap-2">
                                <span id="btnNextLabel">Selanjutnya</span>
                                <i class="fa-solid fa-arrow-right" id="btnNextIcon"></i>
                            </button>
                            <button type="submit" id="btnSubmit"
                                class="hidden flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-bold text-sm shadow-lg shadow-brand-200 transition flex items-center justify-center gap-2">
                                <i class="fa-solid fa-check-circle"></i>
                                <span id="btnSubmitLabel">Daftarkan Sekolah</span>
                            </button>
                        </div>

                        <!-- Login Link -->
                        <div class="mt-5 text-center text-sm text-gray-500">
                            Sudah punya akun? <a href="<?= $base_url ?>/auth/login.php" class="text-brand-600 font-semibold hover:underline">Masuk di sini</a>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div class="mt-6 text-center text-xs text-gray-400">
                    <span class="font-bold text-brand-600">HadirTadz</span> &bull; &copy; 2026 Hak Cipta Dilindungi
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        let currentStep = 1;
        const totalSteps = 3;
        const errorEl = document.getElementById('server-error');

        function showStep(step) {
            document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
            document.getElementById('step-' + step).classList.add('active');

            for (let i = 1; i <= totalSteps; i++) {
                const circle = document.getElementById('step-circle-' + i);
                const num = document.getElementById('step-num-' + i);
                const check = document.getElementById('step-check-' + i);
                const label = document.getElementById('step-label-' + i);

                circle.className = 'step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ';

                if (i < step) {
                    circle.className += 'border-brand-500 bg-brand-500 text-white';
                    num.classList.add('hidden');
                    check.classList.remove('hidden');
                    label.className = 'text-xs font-semibold text-brand-600 mt-2';
                } else if (i === step) {
                    circle.className += 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-200';
                    num.classList.remove('hidden');
                    check.classList.add('hidden');
                    label.className = 'text-xs font-semibold text-brand-600 mt-2';
                } else {
                    circle.className += 'border-gray-200 bg-white text-gray-400';
                    num.classList.remove('hidden');
                    check.classList.add('hidden');
                    label.className = 'text-xs font-semibold text-gray-400 mt-2';
                }

                if (i < totalSteps) {
                    document.getElementById('step-line-' + i).className = 'step-line flex-1 h-0.5 mx-2 rounded-full transition-all ' + (i < step ? 'bg-brand-500' : 'bg-gray-200');
                }
            }

            document.getElementById('btnBack').classList.toggle('hidden', step === 1);
            document.getElementById('btnNext').classList.toggle('hidden', step === totalSteps);
            document.getElementById('btnSubmit').classList.toggle('hidden', step !== totalSteps);
            document.getElementById('currentStepInput').value = step;

            if (errorEl) {
                document.getElementById('step-1').prepend(errorEl);
                if (step !== 1) errorEl.style.display = 'none';
                else errorEl.style.display = '';
            }
        }

        function validateStep(step) {
            if (step === 1) {
                const name = document.getElementById('school_name').value.trim();
                const npsn = document.getElementById('npsn').value.trim();
                if (!name || !npsn) {
                    alert('Nama Sekolah dan NPSN wajib diisi.');
                    return false;
                }
            } else if (step === 2) {
                const adminName = document.getElementById('admin_name').value.trim();
                const pw = document.getElementById('password').value;
                const cpw = document.getElementById('confirm_password').value;
                if (!adminName) { alert('Nama Lengkap Admin wajib diisi.'); return false; }
                if (!pw) { alert('Kata Sandi wajib diisi.'); return false; }
                if (pw.length < 6) { alert('Kata Sandi minimal 6 karakter.'); return false; }
                if (pw !== cpw) { alert('Konfirmasi Kata Sandi tidak cocok.'); return false; }
            } else if (step === 3) {
                const termsOk  = document.getElementById('agree_terms').checked;
                const privOk   = document.getElementById('agree_privacy').checked;
                if (!termsOk || !privOk) {
                    alert('Anda harus menyetujui Syarat & Ketentuan DAN Kebijakan Privasi.');
                    return false;
                }
            }
            return true;
        }

        function populateReview() {
            document.getElementById('rev-school-name').textContent = document.getElementById('school_name').value.trim() || '-';
            document.getElementById('rev-npsn').textContent = document.getElementById('npsn').value.trim() || '-';
            document.getElementById('rev-level').textContent = document.getElementById('level').selectedOptions[0].text;
            document.getElementById('rev-address').textContent = document.getElementById('address').value.trim() || '-';
            document.getElementById('rev-city').textContent = document.getElementById('city').value.trim() || '-';
            document.getElementById('rev-province').textContent = document.getElementById('province').value.trim() || '-';
            document.getElementById('rev-postal-code').textContent = document.getElementById('postal_code').value.trim() || '-';
            document.getElementById('rev-email-sekolah').textContent = document.getElementById('email_sekolah').value.trim() || '-';
            document.getElementById('rev-phone-sekolah').textContent = document.getElementById('phone_sekolah').value.trim() || '-';
            document.getElementById('rev-admin-name').textContent = document.getElementById('admin_name').value.trim() || '-';
            document.getElementById('rev-identifier').textContent = document.getElementById('identifier').value.trim() || 'Otomatis';
            document.getElementById('rev-nik').textContent = document.getElementById('nik').value.trim() || '-';
            document.getElementById('rev-email-admin').textContent = document.getElementById('email_admin').value.trim() || '-';
            document.getElementById('rev-phone-admin').textContent = document.getElementById('phone_admin').value.trim() || '-';
        }

        window.navigateStep = function(dir) {
            const target = currentStep + dir;
            if (target < 1 || target > totalSteps) return;
            if (dir > 0 && !validateStep(currentStep)) return;
            if (dir > 0 && target === 3) populateReview();
            currentStep = target;
            showStep(currentStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        document.getElementById('regForm').addEventListener('submit', function(e) {
            if (!validateStep(3)) { e.preventDefault(); return; }
            const btn = document.getElementById('btnSubmit');
            btn.classList.add('btn-loading');
            btn.disabled = true;
            document.getElementById('btnSubmitLabel').textContent = 'Mendaftarkan...';
        });

        showStep(1);
    })();

    function togglePw(id) {
        const el = document.getElementById(id);
        const icon = document.getElementById(id + '-eye');
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

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('<?= $base_url ?>/service-worker.js').catch(() => {});
        });
    }
    </script>

</body>
</html>
