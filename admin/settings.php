<?php
$page_title = 'Pengaturan Sekolah & Sistem';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$base_url = get_base_url();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $settings = [
        'schoolName' => trim($_POST['schoolName'] ?? ''),
        'npsn' => trim($_POST['npsn'] ?? ''),
        'schoolLevel' => trim($_POST['schoolLevel'] ?? 'SMA'),
        'address' => trim($_POST['address'] ?? ''),
        'operatorName' => trim($_POST['operatorName'] ?? ''),
        'operatorPhone' => trim($_POST['operatorPhone'] ?? ''),
        'latitude' => trim($_POST['latitude'] ?? ''),
        'longitude' => trim($_POST['longitude'] ?? ''),
        'radiusMeters' => trim($_POST['radiusMeters'] ?? '150'),
        'waApiKey' => trim($_POST['waApiKey'] ?? ''),
        'waGatewayNumber' => trim($_POST['waGatewayNumber'] ?? ''),
    ];

    try {
        foreach ($settings as $key => $val) {
            set_setting($key, $val);
        }
        log_audit('UPDATE_SETTINGS', 'school_settings', 'all', 'Updated school and GPS settings');
        set_flash('success', 'Pengaturan sistem dan lokasi sekolah berhasil disimpan!');
        header("Location: settings.php");
        exit;
    } catch (Exception $e) {
        $error = 'Gagal menyimpan pengaturan: ' . $e->getMessage();
    }
}

// Current Settings
$schoolName = get_setting('schoolName', 'SMA Terpadu Al-Mu\'min');
$npsn = get_setting('npsn', '20227912');
$schoolLevel = get_setting('schoolLevel', 'SMA');
$address = get_setting('address', 'Jl. Raya Pendidikan No. 123, Bandung');
$operatorName = get_setting('operatorName', 'Abdul Rohman');
$operatorPhone = get_setting('operatorPhone', '083829089297');
$latitude = get_setting('latitude', '-6.92720000');
$longitude = get_setting('longitude', '107.72250000');
$radiusMeters = get_setting('radiusMeters', '150');
$waApiKey = get_setting('waApiKey', '');
$waGatewayNumber = get_setting('waGatewayNumber', '');

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Sekolah & Lokasi GPS</h1>
                <p class="text-xs sm:text-sm text-slate-500">Konfigurasi profil institusi, koordinat Geofencing absensi mobile, dan integrasi WhatsApp.</p>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="" class="space-y-6">
            <!-- Profil Sekolah -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <i class="fa-solid fa-school text-emerald-600"></i>
                    <span>Identitas Sekolah / Madrasah</span>
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Resmi Sekolah</label>
                        <input type="text" name="schoolName" value="<?= htmlspecialchars($schoolName) ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">NPSN</label>
                        <input type="text" name="npsn" value="<?= htmlspecialchars($npsn) ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Alamat Lengkap</label>
                    <textarea name="address" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"><?= htmlspecialchars($address) ?></textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Petugas / Operator</label>
                        <input type="text" name="operatorName" value="<?= htmlspecialchars($operatorName) ?>" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">No. Kontak Operator</label>
                        <input type="text" name="operatorPhone" value="<?= htmlspecialchars($operatorPhone) ?>" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                </div>
            </div>

            <!-- Titik Koordinat GPS & Geofencing -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i class="fa-solid fa-location-dot text-rose-500"></i>
                        <span>Titik Koordinat GPS & Geofencing</span>
                    </h3>
                    <button type="button" onclick="getCurrentLocation()" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <i class="fa-solid fa-crosshairs"></i>
                        <span>Gunakan Lokasi Saat Ini</span>
                    </button>
                </div>

                <p class="text-xs text-slate-500">
                    Titik koordinat ini digunakan sebagai acuan validasi jarak (radius) saat siswa atau guru melakukan absen mandiri dari HP masing-masing.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Latitude</label>
                        <input type="text" id="gps-lat" name="latitude" value="<?= htmlspecialchars($latitude) ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Longitude</label>
                        <input type="text" id="gps-lon" name="longitude" value="<?= htmlspecialchars($longitude) ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Batas Radius (Meter)</label>
                        <input type="number" name="radiusMeters" value="<?= htmlspecialchars($radiusMeters) ?>" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <i class="fa-solid fa-circle-info text-emerald-600"></i>
                    <span>Koordinat saat ini: <a href="https://maps.google.com/?q=<?= htmlspecialchars($latitude) ?>,<?= htmlspecialchars($longitude) ?>" target="_blank" class="font-bold text-emerald-700 underline">Buka di Google Maps &rarr;</a></span>
                </div>
            </div>

            <!-- WhatsApp Gateway Integrations -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <i class="fa-brands fa-whatsapp text-emerald-600"></i>
                    <span>Integrasi WhatsApp Gateway (Notifikasi Otomatis ke Ortu)</span>
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">API Key / Token WA Gateway</label>
                        <input type="password" name="waApiKey" value="<?= htmlspecialchars($waApiKey) ?>" placeholder="Token API penyedia WA..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nomor Pengirim (Gateway)</label>
                        <input type="text" name="waGatewayNumber" value="<?= htmlspecialchars($waGatewayNumber) ?>" placeholder="08xxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono">
                    </div>
                </div>
            </div>

            <div class="flex justify-end pt-2">
                <button type="submit" class="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Simpan Seluruh Pengaturan</span>
                </button>
            </div>
        </form>

    </div>
</main>

<script>
    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                document.getElementById('gps-lat').value = pos.coords.latitude.toFixed(8);
                document.getElementById('gps-lon').value = pos.coords.longitude.toFixed(8);
                showToast("Lokasi GPS berhasil diambil dari perangkat Anda!", "success");
            }, err => {
                showToast("Gagal mengambil lokasi: " + err.message, "error");
            });
        } else {
            showToast("Perangkat Anda tidak mendukung geolokasi.", "warning");
        }
    }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
