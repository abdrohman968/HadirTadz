# Dokumen Perbaikan & Rencana Pengembangan: HadirTadz (v.1.0)

Dokumen ini mencatat daftar revisi, penyesuaian arsitektur, dan tindakan AI yang diperlukan untuk memenuhi kebutuhan terbaru aplikasi absensi digital.

## 1. Pembaruan Halaman Login
*   **Branding "HadirTadz":** 
    *   Nama aplikasi utama diubah menjadi **HadirTadz**. 
    *   Teks akan diberi *styling* dua warna (misal: kata "Hadir" berwarna hijau gelap, dan "Tadz" berwarna hijau terang) agar lebih mencolok dan memiliki identitas kuat.
*   **Logo Sekolah Dinamis:** 
    *   Menambahkan logo di bagian atas form login. 
    *   *Catatan Logika Sistem:* Karena aplikasi ini bersifat *multi-school* (banyak sekolah), logo yang muncul di awal bisa berupa logo default aplikasi HadirTadz. Logo spesifik sekolah baru akan muncul jika user mengakses lewat *subdomain* sekolah masing-masing atau setelah mereka memasukkan kode sekolah/NPSN.
*   **Integrasi Login Gmail (Google SSO):** 
    *   Menambahkan tombol "Login dengan Google" khusus untuk Admin di bawah tombol masuk utama. Ini membutuhkan pendaftaran *credential* di Google Cloud Console untuk mendapatkan OAuth 2.0 Client ID.
*   **Fitur Daftar Sekolah Baru (Multi-Tenant):** 
    *   Menambahkan tautan pendaftaran institusi baru.
    *   **Tindakan Arsitektur (Krusial):** Database harus diubah menjadi sistem *Multi-Tenant*. Kita perlu membuat tabel master `sekolah`. Selanjutnya, di setiap tabel lain (`users`, `siswa`, `guru`, `absensi`, `pengaturan_sistem`) wajib ditambahkan kolom `sekolah_id` agar data antar sekolah tidak saling tumpang tindih atau bocor.
*   **Footer:** 
    *   Menambahkan keterangan hak cipta: `HadirTadz v.1.0 - © 2026`.

## 2. Penyesuaian UI/UX (Responsivitas Penuh)
*   **Tampilan Desktop (Komputer/Laptop):** 
    *   Menggunakan *CSS Grid/Flexbox* dengan kalkulasi `height: 100vh` (seukuran layar penuh) dan pencegahan *overflow* (scroll ganda). 
    *   Menu akan berada di *sidebar* kiri, dan konten utama di kanan. Tidak akan ada elemen yang terpotong, tertindih, atau jatuh ke bawah meskipun layar di- *zoom* 100%.
*   **Tampilan Mobile (HP):** 
    *   Meninggalkan desain web konvensional dan beralih ke desain *App-like* (menyerupai aplikasi *e-wallet* atau tata letak e-commerce seperti Shopee).
    *   Menggunakan **Bottom Navigation Bar** (menu ikon yang menempel di layar bagian bawah) untuk navigasi utama (Beranda, Scan, Kartu, Profil). 
    *   Elemen tabel yang rumit di HP akan diubah menjadi *Card Layout* (kotak-kotak informasi) agar mudah di- *scroll* dan di- *tap* dengan ibu jari.

## 3. PWA & Distribusi App Store (Web to App)
*   **Pintasan Web (Progressive Web App / PWA):** 
    *   Mengkonfigurasi file `manifest.json` dan *Service Worker*. Dengan ini, saat aplikasi dibuka via browser Chrome/Safari, akan muncul opsi "Tambahkan ke Layar Utama" (*Add to Home Screen*) yang memunculkan ikon aplikasi langsung di desktop maupun layar HP.
*   **Publikasi ke Play Store & App Store:** 
    *   Untuk mengubah kode web PHP/HTML ini menjadi file *native* Android (.apk / .aab) dan iOS (.ipa), kita akan menggunakan teknologi **Capacitor JS**.
    *   Capacitor JS sangat ideal untuk membungkus proyek web menjadi aplikasi *mobile*. Selain mempermudah proses publikasi ke toko aplikasi, ia juga menjembatani akses langsung ke *hardware* HP, seperti menggunakan kamera bawaan dengan lebih mulus saat fitur *Scan QR* dijalankan.
