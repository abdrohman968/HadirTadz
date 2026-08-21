<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';
$base_url = get_base_url();
$terms_version = defined('TERMS_VERSION') ? TERMS_VERSION : '2026-08-21-v1';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syarat & Ketentuan - HadirTadz</title>
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

    <!-- Header -->
    <div class="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-white py-12 px-4">
        <div class="max-w-3xl mx-auto">
            <a href="<?= $base_url ?>/auth/register_school.php" class="inline-flex items-center gap-2 text-brand-100 hover:text-white text-sm mb-6 transition">
                <i class="fa-solid fa-arrow-left"></i> Kembali ke Pendaftaran
            </a>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Syarat &amp; Ketentuan</h1>
            <p class="mt-2 text-brand-200 text-sm">HadirTadz — Platform Presensi Digital untuk Sekolah &amp; Madrasah</p>
            <p class="mt-1 text-brand-300 text-xs">Versi <?= htmlspecialchars($terms_version) ?> &bull; Terakhir diperbarui: 21 Agustus 2026</p>
        </div>
    </div>

    <!-- Content -->
    <main class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 space-y-8 text-sm text-gray-700 leading-relaxed">

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-bullseye text-brand-600"></i> 1. Tujuan Layanan
                </h2>
                <p>HadirTadz adalah platform presensi digital yang dirancang untuk membantu sekolah dan madrasah dalam pengelolaan kehadiran siswa, guru, dan staf secara digital. Layanan ini menyediakan fitur pencatatan kehadiran berbasis GPS, QR Code, serta dashboard monitoring secara real-time.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-user-check text-brand-600"></i> 2. Penggunaan Akun
                </h2>
                <p>Setiap sekolah yang mendaftar akan mendapatkan akun administrator yang bertanggung jawab atas:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Pengelolaan data siswa, guru, dan kelas</li>
                    <li>konfigurasi aturan kehadiran dan pengaturan sistem</li>
                    <li>Pemeliharaan keamanan kredensial akun</li>
                </ul>
                <p class="mt-2">Akun hanya boleh digunakan oleh pihak yang berwenang di sekolah bersangkutan. Penggunaan akun oleh pihak ketiga tanpa izin dilarang.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-hand-holding-heart text-brand-600"></i> 3. Tanggung Jawab Pengguna
                </h2>
                <p>Pengguna (administrator sekolah) bertanggung jawab untuk:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Menjaga kerahasiaan kredensial login</li>
                    <li>Memastikan data yang dimasukkan akurat dan terkini</li>
                    <li>Menggunakan fitur sistem sesuai dengan kebutuhan sekolah</li>
                    <li>Menjalankan pencatatan kehadiran sesuai ketentuan institusi</li>
                </ul>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-database text-brand-600"></i> 4. Data yang Dimasukkan Sekolah
                </h2>
                <p>Sekolah memasukkan berbagai jenis data ke dalam sistem, termasuk namun tidak terbatas pada:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Profil sekolah (nama, NPSN, alamat, kontak)</li>
                    <li>Data pribadi siswa dan guru (nama, identitas, kontak)</li>
                    <li>Data kehadiran dan lokasi GPS saat presensi</li>
                    <li>Foto selfie jika fitur tersebut diaktifkan</li>
                </ul>
                <p class="mt-2">Sekolah mempertahankan kepemilikan atas data yang dimasukkan. HadirTadz bertindak sebagai pengolah data sesuai perjanjian ini.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-clipboard-check text-brand-600"></i> 5. Penggunaan Sistem Absensi
                </h2>
                <p>Sistem presensi HadirTadz menggunakan metode GPS dan/atau QR Code untuk mencatat kehadiran. Penggunaan fitur GPS memerlukan izin akses lokasi dari perangkat siswa/guru. Data lokasi hanya digunakan untuk validasi radius kehadiran dan tidak dipergunakan untuk keperluan lain tanpa izin.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-ban text-brand-600"></i> 6. Larangan Penyalahgunaan
                </h2>
                <p>Pengguna dilarang untuk:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Menggunakan sistem untuk keperluan yang melanggar hukum</li>
                    <li>Mencoba mengakses data sekolah lain</li>
                    <li>Memanipulasi data kehadiran secara curang</li>
                    <li>Menyebarkan kredensial atau mengizinkan akses tidak sah</li>
                    <li>Menggunakan bot atau script otomatis tanpa izin tertulis</li>
                </ul>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-pen text-brand-600"></i> 7. Perubahan Layanan
                </h2>
                <p>Kami berhak untuk memperbarui, menambah, atau mengubah fitur layanan dari waktu ke waktu. Perubahan signifikan akan dikomunikasikan melalui email atau pengumuman di dalam sistem. Penggunaan layanan secara terus-menerus setelah perubahan merupakan persetujuan terhadap ketentuan yang diperbarui.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-power-off text-brand-600"></i> 8. Penghentian Akun
                </h2>
                <p>Akun dapat dihentikan oleh:</p>
                <ul class="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li><strong>Admin sekolah:</strong> menghubungi pengelola HadirTadz</li>
                    <li><strong>Pengelola HadirTadz:</strong> jika terjadi pelanggaran ketentuan penggunaan</li>
                </ul>
                <p class="mt-2">Setelah penghentian, data sekolah akan ditangani sesuai dengan Kebijakan Privasi.</p>
            </section>

            <section>
                <h2 class="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-envelope text-brand-600"></i> 9. Kontak
                </h2>
                <p>Untuk pertanyaan mengenai Syarat &amp; Ketentuan ini, silakan hubungi pengelola HadirTadz melalui email atau kontak yang tersedia di situs resmi.</p>
            </section>

            <div class="border-t border-gray-100 pt-6 text-center">
                <a href="<?= $base_url ?>/auth/register_school.php" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow transition">
                    <i class="fa-solid fa-arrow-left"></i> Kembali ke Pendaftaran
                </a>
            </div>
        </div>
    </main>

    <footer class="text-center py-6 text-xs text-gray-400">
        <span class="font-bold text-brand-600">HadirTadz</span> &bull; &copy; 2026
    </footer>

</body>
</html>
