# HadirTadz (v.1.0) - Presensi Digital Terpadu & Multi-Tenant

**HadirTadz** adalah platform aplikasi presensi dan absensi digital terpadu berbasis web, PWA (Progressive Web App), dan mobile app wrapper (Capacitor JS) yang dirancang untuk sekolah, madrasah, pesantren, dan institusi pendidikan.

---

## 🌟 Fitur Utama

- **Multi-Tenant System (Multi-Sekolah):** Satu instalasi aplikasi dapat melayani banyak sekolah/madrasah secara mandiri dengan isolasi data terpisah.
- **Berbagai Metode Presensi:**
  - **Kiosk Scanner Gerbang:** Pemindai QR Code & Barcode otomatis kartu pelajar / ID guru.
  - **Absen Mandiri GPS + Kamera:** Fitur validasi radius koordinat GPS dan foto selfie untuk siswa dan guru.
  - **Input Presensi Manual & Massal:** Untuk admin dan guru pengajar.
- **Portals Multi-Role:**
  - **Admin Portal:** Dashboard analitik kehadiran, master data siswa/guru/kelas, jurnal, izin & sakit, cetak kartu pelajar QR, rekap laporan Excel/PDF, aturan jam masuk/toleransi, dan pengaturan sekolah.
  - **Guru Portal:** Dashboard jadwal mengajar, presensi kelas harian, pengisian jurnal pembelajaran, dan riwayat absensi.
  - **Siswa Portal:** Kartu pelajar digital dengan QR dinamis, pengajuan izin/sakit online beserta lampiran, riwayat kehadiran, dan absen mandiri.
- **Login Fleksibel:**
  - Autentikasi NISN / NIP / Username / Email + Password.
  - Dukungan Google SSO (Google Sign-In).
  - Pendaftaran institusi/sekolah baru langsung dari halaman login.
- **Antarmuka Modern & Responsif:**
  - **Desktop 100vh:** Antarmuka layar penuh bebas scroll ganda.
  - **Mobile App-Like:** Bottom Navigation Bar dan Card Layout untuk tabel di perangkat ponsel.
- **PWA (Progressive Web App) & Mobile App Ready:**
  - Siap di-install langsung dari browser ke home screen HP/desktop.
  - Konfigurasi Capacitor JS (`capacitor.config.json`) untuk dikonversi menjadi APK/AAB (Android) dan IPA (iOS).

---
Last updated: 2026-08-16 (format utama dikembalikan ke PHP Native; Next.js disimpan sebagai cadangan di `src/`)

---

## 🗂️ Struktur Direktori

```text
absensi_digital/
├── admin/                 # Modul & Dashboard Administrator
├── api/                   # Endpoint API PHP (Scan processing, Geolocation checkin, Stats)
├── assets/                # Aset Statis (CSS Tailwind/Custom, JS, SVG Icons & Logos)
├── auth/                  # Modul Autentikasi (Login, Register School, Logout)
├── config/                # Konfigurasi Database, Auth, dan Helper Multi-Tenant
├── database/              # Schema SQL & Skrip Migrasi Multi-Tenant (migrate.php)
├── guru/                  # Modul & Dashboard Guru Pengajar
├── includes/              # Komponen Layout (Header, Sidebar, Bottom Nav, Footer)
├── siswa/                 # Modul & Dashboard Siswa
├── index.php              # Router & Entry Point Aplikasi (PHP Native)
├── scan.php               # Halaman Kiosk Scanner QR Gerbang
├── capacitor.config.json  # Konfigurasi Capacitor JS untuk Mobile App
├── manifest.json          # Web App Manifest PWA
├── service-worker.js      # Service Worker PWA Offline Caching
├── docs/                  # Dokumentasi proyek (panduan, changelog, dll.)
└── src/                   # (Cadangan) Aplikasi Next.js — tidak dipakai aktif
```

---

## 🚀 Panduan Instalasi Lokal (Laragon / XAMPP)

1. Letakkan proyek di folder `www` (Laragon) atau `htdocs` (XAMPP).
2. **Setup Database:**

   ```bash
   php database/migrate.php
   ```

   *Atau akses melalui browser:* `http://localhost/absensi_digital/database/migrate.php`

3. **Akses aplikasi:** `http://localhost/absensi_digital/`

**Akun Demo Bawaan:**

- **Admin Sekolah:** `ADM-001` | Password: `hadir123`
- **Guru Pengajar:** `198503152010011002` | Password: `hadir123`
- **Siswa:** `12009101` | Password: `hadir123`

---

## ☁️ Meng-Onlinekan Aplikasi (Go-Live)

Format utama adalah **PHP Native** (Hostinger/Rumahweb/VPS paling cocok). Lihat [DEPLOYMENT.md](DEPLOYMENT.md):

1. **Hosting custom PHP (Hostinger, Rumahweb, dsb.)** — upload folder proyek + MySQL hosting, siap.
2. **Vercel** — menjalankan versi **Next.js cadangan** (`src/`) sebagai preview/praktek (bukan PHP).

> Catatan: kode **Next.js** (`src/`, Next.js config, dll.) tetap disimpan di repo sebagai cadangan,
> bukan format aktif. Mengaktifkannya kembali memerlukan migrasi database & konfigurasi ulang.

---

## 📱 Build ke Aplikasi Mobile (Android & iOS)

Lihat panduan lengkap pada [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md) untuk langkah-langkah kompilasi menggunakan Capacitor JS ke Android Studio (.apk / .aab) dan Xcode (.ipa).

---

## 📄 Lisensi & Hak Cipta

**HadirTadz v.1.0** - &copy; 2026 Hak Cipta Dilindungi Undang-Undang.
