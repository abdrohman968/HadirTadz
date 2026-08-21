<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';
$base_url = get_base_url();
$privacy_version = defined('PRIVACY_VERSION') ? PRIVACY_VERSION : '2026-08-21-v1';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kebijakan Privasi - HadirTadz</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: { colors: { brand: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16' } } } }
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>body{font-family:'Plus Jakarta Sans',sans-serif}</style>
</head>
<body class="min-h-screen bg-gray-50">
    <div class="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-white py-12 px-4">
        <div class="max-w-3xl mx-auto">
            <a href="<?= $base_url ?>/auth/register_school.php" class="inline-flex items-center gap-2 text-brand-100 hover:text-white text-sm mb-6 transition"><i class="fa-solid fa-arrow-left"></i> Kembali ke Pendaftaran</a>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Kebijakan Privasi</h1>
            <p class="mt-2 text-brand-200 text-sm">HadirTadz &mdash; Platform Presensi Digital untuk Sekolah &amp; Madrasah</p>
            <p class="mt-1 text-brand-300 text-xs">Versi <?= htmlspecialchars($privacy_version) ?> &bull; Terakhir diperbarui: 21 Agustus 2026</p>
        </div>
    </div>
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-circle-info text-brand-600"></i> 1. Pendahuluan</h2>
                <p>Kebijakan Privasi ini menjelaskan bagaimana HadirTadz mengumpulkan, menggunakan, dan melindungi informasi yang diperoleh dari penggunaan layanan kami. Dengan menggunakan HadirTadz, pengguna setuju terhadap praktik yang dijelaskan dalam kebijakan ini.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-database text-brand-600"></i> 2. Data yang Dikumpulkan</h2>
                <p>Sistem mengumpulkan jenis data berikut:</p>
                <h3 class="font-semibold text-gray-800 mt-4 mb-2">2.1 Data Profil Sekolah</h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                    <li>Nama sekolah, NPSN, jenjang, alamat, kota, provinsi, kode pos</li>
                    <li>Email dan nomor telepon sekolah</li>
                    <li>Koordinat GPS lokasi sekolah</li>
                </ul>
                <h3 class="font-semibold text-gray-800 mt-4 mb-2">2.2 Data Pengguna (Admin, Guru, Siswa)</h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                    <li>Nama lengkap, identifier/username, email, nomor telepon</li>
                    <li>NIK/NIP jika diinput oleh administrator</li>
                    <li>Data kelas, jurusan, dan mata pelajaran</li>
                </ul>
                <h3 class="font-semibold text-gray-800 mt-4 mb-2">2.3 Data Kehadiran</h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                    <li>Tanggal dan waktu kehadiran (check-in / check-out)</li>
                    <li>Status kehadiran (Hadir, Terlambat, Izin, Sakit, Alpha)</li>
                    <li>Metode presensi (QR Code, GPS Mandiri, Barcode, Manual)</li>
                </ul>
                <h3 class="font-semibold text-gray-800 mt-4 mb-2">2.4 Data Lokasi (GPS)</h3>
                <p>Ketika fitur presensi GPS aktif, sistem mencatat koordinat lokasi perangkat saat presensi dilakukan. Data lokasi hanya digunakan untuk validasi radius kehadiran terhadap titik koordinat sekolah.</p>
                <h3 class="font-semibold text-gray-800 mt-4 mb-2">2.5 Foto Selfie</h3>
                <p>Jika fitur selfie diaktifkan oleh administrator, foto yang diambil saat presensi akan disimpan sebagai bukti kehadiran.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-bullseye text-brand-600"></i> 3. Tujuan Penggunaan Data</h2>
                <p>Data dikumpulkan dan digunakan untuk:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Pencatatan dan pengelolaan kehadiran siswa dan guru</li>
                    <li>Monitoring real-time kehadiran oleh administrator</li>
                    <li>Validasi lokasi kehadiran berbasis GPS</li>
                    <li>Penyusunan laporan kehadiran</li>
                    <li>Pengiriman notifikasi WhatsApp ke orang tua/wali</li>
                </ul>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-hard-drive text-brand-600"></i> 4. Penyimpanan Data</h2>
                <p>Data disimpan pada server database MySQL yang dikelola oleh pengelola HadirTadz. Data tidak dipindahkan ke layanan pihak ketiga tanpa pemberitahuan terlebih dahulu.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-lock text-brand-600"></i> 5. Keamanan Data</h2>
                <p>Kami menerapkan langkah-langkah keamanan untuk melindungi data, termasuk:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Isolasi data per sekolah (multi-tenant isolation)</li>
                    <li>Kata sandi disimpan dalam bentuk hash (bcrypt)</li>
                    <li>Sesi autentikasi dengan cookie flags yang aman</li>
                    <li>Akses dibatasi berdasarkan peran (role-based access)</li>
                </ul>
                <p class="mt-2 text-gray-500 text-xs">Meskipun demikian, tidak ada metode transmisi atau penyimpanan data yang 100% aman. Kami terus berupaya meningkatkan keamanan sistem.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-eye text-brand-600"></i> 6. Akses Berdasarkan Peran</h2>
                <ul class="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Admin sekolah:</strong> dapat melihat semua data di sekolahnya sendiri</li>
                    <li><strong>Guru:</strong> dapat melihat data kehadiran kelas yang diampu</li>
                    <li><strong>Siswa:</strong> hanya dapat melihat data kehadiran pribadi</li>
                </ul>
                <p class="mt-2">Satu sekolah tidak dapat mengakses data sekolah lain.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-trash-can text-brand-600"></i> 7. Penghapusan dan Perubahan Data</h2>
                <p>Administrator sekolah dapat mengubah atau menghapus data siswa dan guru melalui panel admin. Untuk permintaan penghapusan akun secara menyeluruh, silakan hubungi pengelola HadirTadz.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-share-nodes text-brand-600"></i> 8. Pihak Ketiga</h2>
                <p>Data tidak dijual atau dibagikan kepada pihak ketiga untuk tujuan komersial. Integrasi dengan layanan WhatsApp hanya digunakan untuk pengiriman notifikasi kehadiran.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-pen text-brand-600"></i> 9. Perubahan Kebijakan</h2>
                <p>Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan akan dikomunikasikan melalui sistem atau email. Penggunaan layanan secara terus-menerus setelah perubahan merupakan persetujuan terhadap kebijakan yang diperbarui.</p>
            </section>
            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><i class="fa-solid fa-envelope text-brand-600"></i> 10. Kontak</h2>
                <p>Untuk pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi pengelola HadirTadz.</p>
            </section>
            <div class="border-t border-gray-100 pt-6 text-center">
                <a href="<?= $base_url ?>/auth/register_school.php" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow transition"><i class="fa-solid fa-arrow-left"></i> Kembali ke Pendaftaran</a>
            </div>
        </div>
    </main>
    <footer class="text-center py-6 text-xs text-gray-400"><span class="font-bold text-brand-600">HadirTadz</span> &bull; &copy; 2026</footer>
</body>
</html>
