<?php
$page_title = 'Absen Mandiri (GPS)';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['siswa']);
$base_url = get_base_url();
$user = auth_user();
$today = date('Y-m-d');

// Koordinat Sekolah
$school_lat = (float)get_setting('latitude', -6.9272);
$school_lon = (float)get_setting('longitude', 107.7225);
$radius_limit = (int)get_attendance_radius($user['role_code'], 150);

// Status hari ini
$stmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?");
$stmt->execute([$user['id'], $today]);
$today_att = $stmt->fetch();

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-3xl mx-auto space-y-6">

        <!-- Page Header -->
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Presensi Mandiri Siswa (GPS & Kamera)</h1>
            <p class="text-xs sm:text-sm text-slate-500">Lakukan absensi mandiri dari smartphone Anda saat berada di lingkungan sekolah.</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            
            <!-- GPS Radius Status Card -->
            <div id="gps-status-card" class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div id="gps-icon" class="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-lg">
                        <i class="fa-solid fa-location-crosshairs animate-spin"></i>
                    </div>
                    <div>
                        <h4 id="gps-title" class="text-xs font-bold text-slate-700">Mendeteksi Titik Lokasi Anda...</h4>
                        <p id="gps-desc" class="text-[11px] text-slate-500">Izinkan browser mengakses lokasi (GPS).</p>
                    </div>
                </div>
                <div class="text-right font-mono text-xs">
                    <span id="gps-distance" class="font-bold text-slate-700">-</span>
                    <span class="block text-[10px] text-slate-400">Radius: <?= $radius_limit ?>m</span>
                </div>
            </div>

            <!-- Camera / GPS Fallback Warning -->
            <div id="camera-fallback-msg" class="hidden p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed">
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-triangle-exclamation text-amber-600 text-lg mt-0.5"></i>
                    <div class="flex-1">
                        <p class="font-bold mb-1">Kamera tidak tersedia</p>
                        <p id="camera-fallback-text">Mohon izinkan akses kamera di browser/WebView untuk verifikasi wajah (selfie).</p>
                        <button type="button" onclick="initCamera()" class="mt-2.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-sm transition">
                            <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            </div>

            <!-- Selfie Camera Preview -->
            <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Foto Selfie Kehadiran</label>
                <div class="relative w-full aspect-video sm:aspect-[4/3] max-w-md mx-auto rounded-3xl overflow-hidden bg-black border-2 border-slate-200 shadow-inner flex items-center justify-center">
                    <video id="selfie-video" autoplay playsinline class="w-full h-full object-cover transform -scale-x-100"></video>
                    <canvas id="selfie-canvas" class="hidden"></canvas>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
                <?php if (!$today_att): ?>
                    <button id="btn-checkin" onclick="submitAttendance('CHECK_IN')" disabled class="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-camera"></i>
                        <span>Presensi Masuk Sekarang</span>
                    </button>
                <?php elseif (empty($today_att['time_out'])): ?>
                    <button id="btn-checkout" onclick="submitAttendance('CHECK_OUT')" disabled class="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-900/20 transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-person-walking-arrow-right"></i>
                        <span>Presensi Pulang (Check-Out)</span>
                    </button>
                <?php else: ?>
                    <div class="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold w-full">
                        <i class="fa-solid fa-circle-check text-base text-emerald-600 mr-1"></i>
                        Presensi masuk dan pulang Anda hari ini sudah lengkap.
                    </div>
                <?php endif; ?>
            </div>

        </div>

    </div>
</main>

<script>
    let currentLat = null;
    let currentLon = null;
    let videoStream = null;
    const schoolLat = <?= $school_lat ?>;
    const schoolLon = <?= $school_lon ?>;
    const radiusLimit = <?= $radius_limit ?>;

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
    }

    async function initCamera() {
        const fallback = document.getElementById('camera-fallback-msg');
        if (fallback) fallback.classList.add('hidden');
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia tidak didukung di browser/WebView ini. Gunakan HTTPS atau browser modern.");
            }
            videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            document.getElementById('selfie-video').srcObject = videoStream;
        } catch (e) {
            console.error("Camera access failed:", e);
            const msg = document.getElementById('camera-fallback-text');
            if (msg) msg.textContent = "Gagal mengakses kamera: " + e.message;
            if (fallback) fallback.classList.remove('hidden');
            showToast("Kamera tidak dapat diakses. Periksa izin kamera di browser.", "error");
        }
    }

    function initGPS() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(pos => {
                currentLat = pos.coords.latitude;
                currentLon = pos.coords.longitude;

                const dist = getDistance(currentLat, currentLon, schoolLat, schoolLon);
                const isWithin = dist <= radiusLimit;

                const card = document.getElementById('gps-status-card');
                const icon = document.getElementById('gps-icon');
                const title = document.getElementById('gps-title');
                const desc = document.getElementById('gps-desc');
                const distEl = document.getElementById('gps-distance');

                distEl.textContent = `${dist} Meter`;

                if (isWithin) {
                    card.className = "p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-4";
                    icon.className = "w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg";
                    icon.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
                    title.className = "text-xs font-bold text-emerald-900";
                    title.textContent = "Lokasi Valid (Di Lingkungan Sekolah)";
                    desc.textContent = `Jarak Anda ${dist}m (Di bawah batas ${radiusLimit}m)`;

                    const btnIn = document.getElementById('btn-checkin');
                    const btnOut = document.getElementById('btn-checkout');
                    if (btnIn) btnIn.disabled = false;
                    if (btnOut) btnOut.disabled = false;
                } else {
                    card.className = "p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-center justify-between gap-4";
                    icon.className = "w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg";
                    icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
                    title.className = "text-xs font-bold text-rose-900";
                    title.textContent = "Di Luar Radius Sekolah";
                    desc.textContent = `Jarak Anda ${dist}m melebihi batas toleransi ${radiusLimit}m`;

                    const btnIn = document.getElementById('btn-checkin');
                    const btnOut = document.getElementById('btn-checkout');
                    if (btnIn) btnIn.disabled = true;
                    if (btnOut) btnOut.disabled = true;
                }
            }, err => {
                const card = document.getElementById('gps-status-card');
                const icon = document.getElementById('gps-icon');
                const title = document.getElementById('gps-title');
                const desc = document.getElementById('gps-desc');
                if (card) card.className = "p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-center justify-between gap-4";
                if (icon) {
                    icon.className = "w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg";
                    icon.innerHTML = '<i class="fa-solid fa-location-crosshairs-slash"></i>';
                }
                if (title) title.textContent = "Lokasi GPS tidak dapat diakses";
                if (desc) desc.textContent = "" + err.message + ". Izinkan akses lokasi pada browser, lalu muat ulang halaman.";
                const btnIn = document.getElementById('btn-checkin');
                const btnOut = document.getElementById('btn-checkout');
                if (btnIn) btnIn.disabled = true;
                if (btnOut) btnOut.disabled = true;
            }, { enableHighAccuracy: true });
        }
    }

    async function submitAttendance(action) {
        if (currentLat === null || currentLon === null) {
            showToast("Lokasi GPS belum terdeteksi.", "warning");
            return;
        }

        const video = document.getElementById('selfie-video');
        const canvas = document.getElementById('selfie-canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.7);

        try {
            const res = await fetch('<?= $base_url ?>/api/checkin_self.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: currentLat,
                    longitude: currentLon,
                    photo_base64: photoBase64,
                    action: action
                })
            });

            const data = await res.json();
            if (data.success) {
                SoundEffects.playSuccess();
                showToast(data.message, "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                SoundEffects.playError();
                showToast(data.message, "error");
            }
        } catch (e) {
            showToast("Kesalahan: " + e.message, "error");
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initCamera();
        initGPS();
    });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
