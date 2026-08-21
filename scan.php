<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth.php';
require_once __DIR__ . '/config/helpers.php';

if (!function_exists('get_base_url')) {
    function get_base_url() {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $parts = explode('/', trim($script, '/'));
        if (isset($parts[0]) && $parts[0] === 'absensi_digital') {
            return '/absensi_digital';
        }
        return '';
    }
}

// === KIOSK ACTIVE SCHOOL CONTEXT ===
$base_url = get_base_url();
// Kiosk wajib punya konteks sekolah dari sumber terpercaya (TOKEN terverifikasi),
// bukan dari input school_id client. Prioritas:
//   1. Token kiosk (?k=TOKEN) -> divalidasi terhadap tabel kiosk_tokens.
//   2. Legacy path (tanpa token): konteks sesi login/auth (backward compat) ->
//      kiosk School 1 yang berfungsi sebelumnya tetap bekerja.
$kiosk_token = trim($_GET['k'] ?? '');
$kiosk_error = null;
$school_id = null;

if ($kiosk_token !== '') {
    $kiosk_result = kiosk_bind_context($kiosk_token);
    if ($kiosk_result === null) {
        $kiosk_error = ['type' => 'error', 'title' => 'Token Kiosk Kosong', 'message' => 'Parameter k (%s) tidak boleh kosong. Periksa URL kiosk.'];
    } elseif (isset($kiosk_result['error'])) {
        $err_map = [
            'TOKEN_INVALID' => ['title' => 'Token Kiosk Tidak Dikenal', 'message' => 'Token kiosk tidak valid atau sudah dihapus. Minta token baru dari halaman pengelolaan kiosk.'],
            'TOKEN_REVOKED' => ['title' => 'Token Kiosk Dicabut', 'message' => 'Token kiosk sudah dicabut (revoked) oleh administrator.'],
            'TOKEN_EXPIRED' => ['title' => 'Token Kiosk Kedaluwarsa', 'message' => 'Token kiosk sudah melewati tanggal kedaluwarsa. Perbarui token di pengelolaan kiosk.'],
            'SCHOOL_INACTIVE' => ['title' => 'Sekolah Tidak Aktif', 'message' => 'Sekolah yang terhubung dengan token kiosk ini sedang tidak aktif.']
        ];
        $e = $err_map[$kiosk_result['error']] ?? ['title' => 'Token Kiosk Ditolak', 'message' => 'Token kiosk tidak dapat diverifikasi.'];
        $kiosk_error = ['type' => 'blocked', 'title' => $e['title'], 'message' => $e['message']];
    } else {
        $school_id = $kiosk_result['school_id'];
        $kiosk_device_name = $kiosk_result['device_name'];
    }
} else {
    // Legacy path (tanpa token) — backward compat: gunakan sesi/auth.
    $school_id = auth_school_id();
    $kiosk_token = '';
}

// Feed kiosk hanya tampil jika konteks sekolah ter-resolve
$recent_scans = [];
$today = date('Y-m-d');
if ($school_id !== null) {
    $stmt = $pdo->prepare("
        SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE a.date = ? AND a.school_id = ?
        ORDER BY a.updated_at DESC
        LIMIT 8
    ");
    $stmt->execute([$today, $school_id]);
    $recent_scans = $stmt->fetchAll();
}

$school_name = $school_id !== null ? (current_school($school_id)['name'] ?? '') : '';
if ($school_name === '') $school_name = get_setting('schoolName', 'SMA Negeri Harapan Bangsa');
?>
<!DOCTYPE html>
<html lang="id" class="h-full bg-slate-950">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Kiosk Scanner Gerbang - <?= htmlspecialchars($school_name) ?></title>
    <!-- PWA Manifest & Service Worker -->
    <link rel="manifest" href="<?= $base_url ?>/manifest.json">
    <meta name="theme-color" content="#065f46">
    <link rel="apple-touch-icon" href="<?= $base_url ?>/assets/img/icon.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="HadirTadz">>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Html5-QRCode Scanner Library -->
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <link rel="stylesheet" href="<?= $base_url ?>/assets/css/custom.css">
</head>
<body class="h-full flex flex-col bg-slate-950 text-slate-100 antialiased overflow-x-hidden">

    <!-- Top Header -->
    <header class="bg-slate-900/90 border-b border-emerald-900/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div class="flex items-center gap-3">
            <a href="<?= $base_url ?>/index.php" class="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md transition" title="Kembali ke Dashboard">
                <i class="fa-solid fa-arrow-left"></i>
            </a>
            <div>
                <h1 class="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2">
                    <span class="font-black"><span class="text-white">Hadir</span><span class="text-emerald-400">Tadz</span></span>
                    <span class="text-slate-400 font-normal hidden sm:inline">&bull;</span>
                    <span class="text-xs sm:text-sm font-semibold text-emerald-200"><?= htmlspecialchars($school_name) ?></span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">Kiosk</span>
                </h1>
                <p class="text-xs text-emerald-400/80">Pemindai QR Code & Barcode Presensi Otomatis</p>
            </div>
        </div>

        <!-- Clock & Fullscreen -->
        <div class="flex items-center gap-3">
            <div class="bg-emerald-950/80 border border-emerald-800/60 px-4 py-1.5 rounded-xl flex items-center gap-2.5 text-emerald-300 font-mono text-sm sm:text-base font-bold shadow-inner">
                <i class="fa-regular fa-clock text-emerald-400 animate-pulse"></i>
                <span class="live-clock">--:--:--</span>
            </div>
            <button onclick="toggleFullscreen()" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm transition" title="Layar Penuh">
                <i class="fa-solid fa-expand"></i>
            </button>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <?php if ($kiosk_error !== null): ?>
            <!-- Kiosk Token Rejected / Blocked State -->
            <div class="lg:col-span-12 w-full max-w-lg mx-auto">
                <div class="bg-slate-900 border border-rose-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
                    <div class="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto mb-5 ring-4 ring-rose-500/10">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h2 class="text-xl font-bold text-white mb-2"><?= htmlspecialchars($kiosk_error['title']) ?></h2>
                    <p class="text-sm text-slate-400 leading-relaxed mb-6"><?= htmlspecialchars($kiosk_error['message']) ?></p>
                    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-mono text-slate-500 mb-6 break-all">
                        scan.php?k=<?= htmlspecialchars($kiosk_token) ?>
                    </div>
                    <div class="flex items-center justify-center gap-3">
                        <a href="<?= $base_url ?>/admin/kiosk.php" class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-arrow-rotate-right"></i> Kelola Kiosk
                        </a>
                        <a href="<?= $base_url ?>/index.php" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition">
                            Kembali ke Beranda
                        </a>
                    </div>
                </div>
            </div>
        <?php else: ?>

        <!-- Left Column: Camera Scanner & Manual Input (7 Cols) -->
        <div class="lg:col-span-7 space-y-4">
            <!-- Camera Scanner Frame -->
            <div class="bg-slate-900 border border-emerald-900/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-emerald-400" id="camera-status-label">Kamera Pemindai Siap</h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="camera-select" class="hidden sm:inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[160px] truncate">
                            <option value="">Deteksi Kamera...</option>
                        </select>
                        <button id="btn-switch-camera" type="button" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5">
                            <i class="fa-solid fa-camera-rotate"></i>
                            <span>Ganti Kamera</span>
                        </button>
                    </div>
                </div>

                <!-- Video Viewport -->
                <div class="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
                    <div id="qr-reader" class="w-full h-full object-cover"></div>
                    <div id="scanner-laser-line" class="scanner-laser pointer-events-none"></div>

                    <!-- Camera Error Notice if permission denied -->
                    <div id="camera-fallback-msg" class="hidden absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                            <i class="fa-solid fa-video-slash"></i>
                        </div>
                        <h3 class="font-bold text-sm text-white">Kamera Belum Aktif / Tidak Terdeteksi</h3>
                        <p class="text-xs text-slate-400 max-w-sm">
                            Pastikan Anda telah mengizinkan izin kamera di browser, atau gunakan <strong>Barcode Scanner USB</strong> / input NISN manual pada kolom di bawah.
                        </p>
                        <button onclick="startScanning()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition">
                            <i class="fa-solid fa-rotate-right mr-1"></i> Coba Buka Kamera Lagi
                        </button>
                    </div>
                </div>

                <!-- Manual Barcode / NISN Input (Supports USB Barcode Scanner Gun) -->
                <div class="mt-4">
                    <form id="manual-scan-form" class="relative flex items-center">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                            <i class="fa-solid fa-barcode text-lg"></i>
                        </div>
                        <input type="text" id="manual-identifier-input" autofocus autocomplete="off" placeholder="Arahkan barcode scanner / ketik NISN lalu tekan ENTER..."
                            class="w-full pl-11 pr-24 py-3 bg-slate-950 border border-emerald-800/60 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-mono">
                        <button type="submit" class="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition">
                            Proses
                        </button>
                    </form>
                    <p class="text-[11px] text-slate-500 mt-1.5 text-center">
                        <i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> Mendukung Barcode Scanner USB, Kamera HP, Webcam Laptop, & Input Manual NISN.
                    </p>
                </div>
            </div>
        </div>

        <!-- Right Column: Scan Result Popup & Recent Scans (5 Cols) -->
        <div class="lg:col-span-5 space-y-6">
            
            <!-- Result Display Card (Live Feedback) -->
            <div id="scan-result-card" class="bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-emerald-700/50 rounded-3xl p-6 shadow-2xl transition-all duration-300">
                <div class="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-4">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400">Status Pemindaian Terakhir</h3>
                    <span id="result-badge" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400">Menunggu Scan...</span>
                </div>

                <div id="result-placeholder" class="text-center py-8">
                    <div class="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500 text-2xl animate-pulse">
                        <i class="fa-solid fa-qrcode"></i>
                    </div>
                    <p class="text-sm font-semibold text-slate-300">Dekatkan QR Code atau Kartu Pelajar</p>
                    <p class="text-xs text-slate-500 mt-1">Sistem akan otomatis mengenali dan mencatat presensi</p>
                </div>

                <div id="result-content" class="hidden space-y-4">
                    <div class="flex items-center gap-4">
                        <div id="user-avatar-container" class="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30">
                            <span id="user-avatar-initial">S</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 id="user-fullname" class="text-lg font-bold text-white truncate">-</h4>
                            <p id="user-identifier" class="text-xs font-mono text-emerald-400">-</p>
                            <p id="user-role-class" class="text-xs text-slate-300 mt-0.5">-</p>
                        </div>
                    </div>

                    <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between text-xs font-mono">
                        <div>
                            <span class="text-slate-400 block">Waktu Tercatat:</span>
                            <span id="record-time" class="text-base font-bold text-white">--:-- WIB</span>
                        </div>
                        <div class="text-right">
                            <span class="text-slate-400 block">Tipe Presensi:</span>
                            <span id="record-action" class="text-sm font-bold text-emerald-400">MASUK (CHECK-IN)</span>
                        </div>
                    </div>

                    <div id="feedback-alert" class="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2">
                        <i class="fa-solid fa-circle-check text-emerald-400 text-base" id="feedback-icon"></i>
                        <span id="feedback-message">Presensi Berhasil Dicatat</span>
                    </div>
                </div>
            </div>

            <!-- Recent Scan Feed Table -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div class="flex items-center justify-between mb-3.5">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Riwayat Terkini Hari Ini</h3>
                    <span class="text-[11px] text-emerald-400 font-medium"><?= count($recent_scans) ?> Terakhir</span>
                </div>

                <div class="space-y-2 overflow-y-auto max-h-64 pr-1" id="recent-scans-list">
                    <?php if (empty($recent_scans)): ?>
                        <div class="text-center py-6 text-xs text-slate-500" id="empty-recent-msg">
                            Belum ada aktivitas presensi hari ini.
                        </div>
                    <?php else: ?>
                        <?php foreach ($recent_scans as $item): ?>
                            <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-xs">
                                        <?= strtoupper(substr($item['full_name'], 0, 1)) ?>
                                    </div>
                                    <div>
                                        <div class="font-bold text-slate-200"><?= htmlspecialchars($item['full_name']) ?></div>
                                        <div class="text-[10px] text-slate-400"><?= htmlspecialchars($item['class_name'] ?? $item['role_name']) ?></div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-mono font-bold text-emerald-400"><?= format_time($item['time_out'] ?? $item['time_in']) ?></div>
                                    <div class="text-[10px] font-semibold <?= ($item['status'] === 'TERLAMBAT') ? 'text-amber-400' : 'text-emerald-400' ?>">
                                        <?= htmlspecialchars($item['status']) ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </main>
    <?php endif; ?>

    <!-- App Scripts -->
    <script src="<?= $base_url ?>/assets/js/app.js"></script>
    <script>
        let html5QrCode = null;
        let isProcessing = false;
        let lastScannedCode = '';
        let lastScanTime = 0;
        let availableCameras = [];
        let currentCameraIndex = 0;
        const KIOSK_TOKEN = <?= json_encode($kiosk_token, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    alert(`Gagal layar penuh: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }

        // Initialize Camera Scanner with robust fallbacks
        async function startScanning(cameraIdOrConfig = null) {
            const fallbackMsg = document.getElementById('camera-fallback-msg');
            const statusLabel = document.getElementById('camera-status-label');
            const laser = document.getElementById('scanner-laser-line');

            if (html5QrCode) {
                try {
                    await html5QrCode.stop();
                } catch (e) {
                    // Ignore stop error if not running
                }
            }

            html5QrCode = new Html5Qrcode("qr-reader");
            const config = { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

            try {
                // Fetch list of cameras if not already populated
                if (availableCameras.length === 0) {
                    try {
                        const devices = await Html5Qrcode.getCameras();
                        if (devices && devices.length) {
                            availableCameras = devices;
                            populateCameraSelect(devices);
                        }
                    } catch (e) {
                        console.warn("Camera enumeration error:", e);
                    }
                }

                let cameraParam = cameraIdOrConfig;
                if (!cameraParam) {
                    if (availableCameras.length > 0) {
                        cameraParam = availableCameras[currentCameraIndex].id;
                    } else {
                        // Fallback to environment facing mode
                        cameraParam = { facingMode: "environment" };
                    }
                }

                await html5QrCode.start(cameraParam, config, onScanSuccess);

                fallbackMsg.classList.add('hidden');
                laser.classList.remove('hidden');
                statusLabel.textContent = "Kamera Pemindai Aktif";
                statusLabel.className = "text-sm font-bold uppercase tracking-wider text-emerald-400";

            } catch (err) {
                console.error("Camera start failed:", err);
                fallbackMsg.classList.remove('hidden');
                laser.classList.add('hidden');
                statusLabel.textContent = "Kamera Nonaktif (Gunakan Barcode Scanner)";
                statusLabel.className = "text-sm font-bold uppercase tracking-wider text-amber-400";
            }
        }

        function populateCameraSelect(cameras) {
            const select = document.getElementById('camera-select');
            select.innerHTML = '';
            cameras.forEach((cam, idx) => {
                const opt = document.createElement('option');
                opt.value = cam.id;
                opt.textContent = cam.label || `Kamera ${idx + 1}`;
                if (idx === currentCameraIndex) opt.selected = true;
                select.appendChild(opt);
            });
            select.classList.remove('hidden');

            select.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                currentCameraIndex = availableCameras.findIndex(c => c.id === selectedId);
                startScanning(selectedId);
            });
        }

        // Switch Camera Button Click
        const switchBtn = document.getElementById('btn-switch-camera');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                if (availableCameras.length > 1) {
                    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
                    const select = document.getElementById('camera-select');
                    if (select) select.value = availableCameras[currentCameraIndex].id;
                    startScanning(availableCameras[currentCameraIndex].id);
                    showToast(`Beralih ke ${availableCameras[currentCameraIndex].label || 'Kamera ' + (currentCameraIndex + 1)}`, 'info');
                } else {
                    // If only 1 or 0 enumerated, toggle between environment and user
                    currentCameraIndex = (currentCameraIndex === 0) ? 1 : 0;
                    const mode = (currentCameraIndex === 0) ? "environment" : "user";
                    startScanning({ facingMode: mode });
                    showToast(`Beralih ke kamera ${mode}`, 'info');
                }
            });
        }

        function onScanSuccess(decodedText, decodedResult) {
            const now = Date.now();
            // Prevent immediate duplicate scan within 3 seconds
            if (decodedText === lastScannedCode && (now - lastScanTime) < 3000) {
                return;
            }
            if (isProcessing) return;

            lastScannedCode = decodedText;
            lastScanTime = now;
            processScan(decodedText, 'qr');
        }

        // Send scan to API
        async function processScan(identifier, method = 'qr') {
            if (isProcessing) return;
            isProcessing = true;

            const inputField = document.getElementById('manual-identifier-input');

            try {
                const res = await fetch('<?= $base_url ?>/api/scan_process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: identifier, method: method, kiosk_token: KIOSK_TOKEN })
                });

                const data = await res.json();
                
                // Sound Chime Feedback
                if (data.sound === 'success') {
                    SoundEffects.playSuccess();
                } else if (data.sound === 'warning') {
                    SoundEffects.playWarning();
                } else {
                    SoundEffects.playError();
                }

                // Render result card
                renderScanResult(data);

                // Add to recent feed if success
                if (data.success && data.user) {
                    prependRecentScan(data.user);
                }

            } catch (err) {
                console.error(err);
                SoundEffects.playError();
                showToast("Gagal memproses absensi: " + err.message, "error");
            } finally {
                setTimeout(() => {
                    isProcessing = false;
                    if (inputField) inputField.focus();
                }, 1200);
            }
        }

        function renderScanResult(data) {
            const placeholder = document.getElementById('result-placeholder');
            const content = document.getElementById('result-content');
            const badge = document.getElementById('result-badge');
            const alertBox = document.getElementById('feedback-alert');
            const alertMsg = document.getElementById('feedback-message');
            const icon = document.getElementById('feedback-icon');

            placeholder.classList.add('hidden');
            content.classList.remove('hidden');

            if (data.success) {
                const u = data.user;
                document.getElementById('user-avatar-initial').textContent = u.name.charAt(0).toUpperCase();
                document.getElementById('user-fullname').textContent = u.name;
                document.getElementById('user-identifier').textContent = `ID: ${u.identifier}`;
                document.getElementById('user-role-class').textContent = `${u.role} • ${u.class}`;
                document.getElementById('record-time').textContent = `${u.time} WIB`;
                document.getElementById('record-action').textContent = (u.action === 'CHECK_IN') ? 'MASUK (CHECK-IN)' : 'PULANG (CHECK-OUT)';

                if (u.status === 'TERLAMBAT') {
                    badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
                    alertBox.className = 'p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-2';
                    icon.className = 'fa-solid fa-triangle-exclamation text-amber-400 text-base';
                } else {
                    badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                    alertBox.className = 'p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2';
                    icon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
                }

                badge.textContent = u.status;
                alertMsg.textContent = data.message;
            } else {
                badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
                badge.textContent = 'Gagal';
                alertBox.className = 'p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2';
                icon.className = 'fa-solid fa-circle-xmark text-rose-400 text-base';
                alertMsg.textContent = data.message;
            }
        }

        function prependRecentScan(u) {
            const list = document.getElementById('recent-scans-list');
            const emptyMsg = document.getElementById('empty-recent-msg');
            if (emptyMsg) emptyMsg.remove();

            const item = document.createElement('div');
            item.className = 'p-2.5 rounded-xl bg-slate-950/60 border border-emerald-900/60 flex items-center justify-between text-xs animate-pulse';
            item.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs">
                        ${u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-bold text-white">${u.name}</div>
                        <div class="text-[10px] text-slate-400">${u.class}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-mono font-bold text-emerald-400">${u.time}</div>
                    <div class="text-[10px] font-semibold ${u.status === 'TERLAMBAT' ? 'text-amber-400' : 'text-emerald-400'}">${u.status}</div>
                </div>
            `;
            list.insertBefore(item, list.firstChild);
        }

        // Handle Manual Input & USB Barcode Gun Submit
        const manualScanForm = document.getElementById('manual-scan-form');
        if (manualScanForm) {
            manualScanForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('manual-identifier-input');
                const val = input.value.trim();
                if (val) {
                    processScan(val, 'barcode');
                    input.value = '';
                    input.focus();
                }
            });
        }

        // Initialize on page load
        const kioskAllowed = !<?= $kiosk_error !== null ? 'true' : 'false' ?>;
        document.addEventListener('DOMContentLoaded', () => {
            if (!kioskAllowed) return;
            startScanning();
            const inputField = document.getElementById('manual-identifier-input');
            if (inputField) inputField.focus();
        });

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
