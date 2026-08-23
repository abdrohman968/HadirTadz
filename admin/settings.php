<?php
$page_title = 'Pengaturan Sekolah & Sistem';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/helpers.php';

require_auth(['admin']);
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // P2.3: Profil Sekolah (canonical: schools — tenant-scoped dari session)
    $name_in = trim($_POST['schoolName'] ?? '');
    $npsn_in = trim($_POST['npsn'] ?? '');
    $level_in = trim($_POST['schoolLevel'] ?? 'SMA');
    $address_in = trim($_POST['address'] ?? '');
    $city_in = trim($_POST['city'] ?? '');
    $province_in = trim($_POST['province'] ?? '');
    $postal_in = trim($_POST['postal_code'] ?? '');
    $email_in = trim($_POST['schoolEmail'] ?? '');
    $phone_in = trim($_POST['schoolPhone'] ?? '');
    $logo_in = trim($_POST['logo_url'] ?? '');

    $allowed_levels = ['SD','SMP','SMA','SMK','MA','MTS','MI','PESANTREN','LAINNYA'];
    if (!in_array($level_in, $allowed_levels, true)) $level_in = 'SMA';

    $error = '';
    if (mb_strlen($name_in) > 150) $error = 'Nama sekolah maksimal 150 karakter.';
    elseif (mb_strlen($npsn_in) > 20) $error = 'NPSN maksimal 20 karakter.';
    elseif (mb_strlen($city_in) > 100) $error = 'Kota/Kabupaten maksimal 100 karakter.';
    elseif (mb_strlen($province_in) > 100) $error = 'Provinsi maksimal 100 karakter.';
    elseif (mb_strlen($postal_in) > 10) $error = 'Kode Pos maksimal 10 karakter.';
    elseif (mb_strlen($email_in) > 100) $error = 'Email sekolah maksimal 100 karakter.';
    elseif (mb_strlen($phone_in) > 30) $error = 'No. Telepon sekolah maksimal 30 karakter.';

    if (!$error) {
        try {
            $school_id = auth_school_id();
            $pdo->prepare("UPDATE schools SET name=?, npsn=?, level=?, address=?, city=?, province=?, postal_code=?, email=?, phone=?, logo_url=?, updated_at=NOW() WHERE id=?")
                ->execute([$name_in, $npsn_in, $level_in, $address_in, $city_in, $province_in, $postal_in, $email_in, $phone_in, $logo_in, $school_id]);

            // Write-through legacy keys agar reader lama (get_setting('schoolName') dll.) tetap sinkron
            set_setting('schoolName', $name_in);
            set_setting('npsn', $npsn_in);
            set_setting('schoolLevel', $level_in);
            set_setting('address', $address_in);

            $settings = [
                'operatorName' => trim($_POST['operatorName'] ?? ''),
                'operatorPhone' => trim($_POST['operatorPhone'] ?? ''),
                'latitude' => trim($_POST['latitude'] ?? ''),
                'longitude' => trim($_POST['longitude'] ?? ''),
                'radiusMeters' => trim($_POST['radiusMeters'] ?? '150'),
                'waApiKey' => trim($_POST['waApiKey'] ?? ''),
                'waGatewayNumber' => trim($_POST['waGatewayNumber'] ?? ''),
            ];
            foreach ($settings as $key => $val) {
                set_setting($key, $val);
            }

            log_audit('UPDATE_SETTINGS', 'school_settings', 'all', 'Updated school profile + GPS settings');
            set_flash('success', 'Pengaturan sekolah berhasil disimpan!');
            header("Location: settings.php");
            exit;
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan pengaturan: ' . ($e->getCode() == 23000 ? 'NPSN sudah digunakan sekolah lain.' : $e->getMessage());
        } catch (Exception $e) {
            $error = 'Gagal menyimpan pengaturan: ' . $e->getMessage();
        }
    }
}

// P2.3: canonical profile reads dari schools table (tenant-scoped)
$school_id = auth_school_id();
$stmt = $pdo->prepare("SELECT * FROM schools WHERE id = ? AND deleted_at IS NULL LIMIT 1");
$stmt->execute([$school_id]);
$school_row = $stmt->fetch() ?: [];

$schoolName  = $school_row['name'] ?? get_setting('schoolName', 'SMA Negeri Harapan Bangsa');
$npsn        = $school_row['npsn'] ?? get_setting('npsn', '20227912');
$schoolLevel = $school_row['level'] ?? get_setting('schoolLevel', 'SMA');
$address     = $school_row['address'] ?? get_setting('address', '');
$city        = $school_row['city'] ?? '';
$province    = $school_row['province'] ?? '';
$postalCode  = $school_row['postal_code'] ?? '';
$schoolEmail = $school_row['email'] ?? '';
$schoolPhone = $school_row['phone'] ?? '';
$logoUrl     = $school_row['logo_url'] ?? '';

// GPS & integrasi masih dari school_settings (legacy keys yang stabil)
$operatorName    = get_setting('operatorName', 'Operator Sekolah');
$operatorPhone   = get_setting('operatorPhone', '');
$latitude        = get_setting('latitude', '-6.92720000');
$longitude       = get_setting('longitude', '107.72250000');
$radiusMeters    = get_setting('radiusMeters', '150');
$waApiKey        = get_setting('waApiKey', '');
$waGatewayNumber = get_setting('waGatewayNumber', '');

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Page Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Sekolah</h1>
                <p class="text-xs sm:text-sm text-slate-500">Profil institusi, koordinat Geofencing absensi mobile, dan integrasi WhatsApp.</p>
            </div>
        </div>

        <?php if (!empty($error)): ?>
            <?= ds_alert($error, 'danger') ?>
        <?php endif; ?>

        <form method="POST" action="" class="space-y-6">
            <!-- Profil Sekolah -->
            <?= ds_card_start('Profil Sekolah / Madrasah', 'fa-solid fa-school') ?>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div class="sm:col-span-2">
                        <?= ds_input('schoolName', 'Nama Resmi Sekolah', 'text', $schoolName, ['required' => true]) ?>
                    </div>
                    <div>
                        <?= ds_input('npsn', 'NPSN', 'text', $npsn, ['required' => true, 'class' => 'font-mono']) ?>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <?php 
                        $levels = ['SD'=>'SD','SMP'=>'SMP','SMA'=>'SMA','SMK'=>'SMK','MA'=>'MA','MTS'=>'MTs','MI'=>'MI','PESANTREN'=>'Pesantren','LAINNYA'=>'Lainnya'];
                        echo ds_select('schoolLevel', $levels, $schoolLevel, 'Jenjang');
                        ?>
                    </div>
                    <div>
                        <?= ds_input('schoolEmail', 'Email Sekolah', 'email', $schoolEmail, ['maxlength' => 100, 'placeholder' => 'info@sekolah.sch.id']) ?>
                    </div>
                    <div>
                        <?= ds_input('schoolPhone', 'No. Telepon Sekolah', 'text', $schoolPhone, ['maxlength' => 30, 'placeholder' => '021-xxxxxxx', 'class' => 'font-mono']) ?>
                    </div>
                </div>

                <div class="mb-4">
                    <?= ds_textarea('address', 'Alamat Lengkap', $address, ['rows' => 2]) ?>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <?= ds_input('city', 'Kota / Kabupaten', 'text', $city, ['maxlength' => 100, 'placeholder' => 'Contoh: Bandung']) ?>
                    </div>
                    <div>
                        <?= ds_input('province', 'Provinsi', 'text', $province, ['maxlength' => 100, 'placeholder' => 'Contoh: Jawa Barat']) ?>
                    </div>
                    <div>
                        <?= ds_input('postal_code', 'Kode Pos', 'text', $postalCode, ['maxlength' => 10, 'placeholder' => 'Contoh: 40123']) ?>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <?= ds_input('logo_url', 'Logo (URL gambar)', 'text', $logoUrl, ['placeholder' => 'https://...']) ?>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <?= ds_input('operatorName', 'Nama Petugas / Operator', 'text', $operatorName) ?>
                    </div>
                    <div>
                        <?= ds_input('operatorPhone', 'No. Kontak Operator', 'text', $operatorPhone, ['class' => 'font-mono']) ?>
                    </div>
                </div>
            <?= ds_card_end() ?>

            <!-- Titik Koordinat GPS & Geofencing -->
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i class="fa-solid fa-location-dot text-rose-500"></i>
                        <span>Titik Koordinat GPS & Geofencing</span>
                    </h3>
                    <?= ds_button('<i class="fa-solid fa-crosshairs"></i> Gunakan Lokasi Saat Ini', 'light', 'button', ['onclick' => 'getCurrentLocation()']) ?>
                </div>

                <div class="p-6 space-y-4">
                    <p class="text-xs text-slate-500 leading-relaxed">
                        Titik koordinat ini digunakan sebagai acuan validasi jarak (radius) saat siswa atau guru melakukan absen mandiri dari HP masing-masing.
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <?= ds_input('latitude', 'Latitude', 'text', $latitude, ['id' => 'gps-lat', 'required' => true, 'class' => 'font-mono']) ?>
                        <?= ds_input('longitude', 'Longitude', 'text', $longitude, ['id' => 'gps-lon', 'required' => true, 'class' => 'font-mono']) ?>
                        <div>
                            <?= ds_input('radiusMeters', 'Batas Radius Default (Meter)', 'number', $radiusMeters, ['required' => true, 'class' => 'font-mono']) ?>
                            <p class="mt-1.5 text-[10px] text-slate-500 leading-tight">Fallback default jika tidak ada aturan khusus per-role. Atur per-role di menu <b>Aturan Absensi</b>.</p>
                        </div>
                    </div>

                    <?= ds_alert('Koordinat saat ini: <a href="https://maps.google.com/?q='.htmlspecialchars($latitude).','.htmlspecialchars($longitude).'" target="_blank" class="font-bold text-emerald-700 underline">Buka di Google Maps &rarr;</a>', 'info') ?>
                </div>
            </div>

            <!-- WhatsApp Gateway Integrations -->
            <?= ds_card_start('Integrasi WhatsApp Gateway', 'fa-brands fa-whatsapp') ?>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <?= ds_input('waApiKey', 'API Key / Token WA Gateway', 'password', $waApiKey, ['placeholder' => 'Token API penyedia WA...', 'class' => 'font-mono']) ?>
                    <?= ds_input('waGatewayNumber', 'Nomor Pengirim (Gateway)', 'text', $waGatewayNumber, ['placeholder' => '08xxxxxxxx', 'class' => 'font-mono']) ?>
                </div>
            <?= ds_card_end() ?>

            <div class="flex justify-end pt-2">
                <?= ds_button('<i class="fa-solid fa-floppy-disk"></i> Simpan Seluruh Pengaturan', 'primary', 'submit', ['class' => 'px-8 py-3.5 text-sm']) ?>
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
