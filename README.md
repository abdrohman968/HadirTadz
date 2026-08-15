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
Last updated: 2026-08-16 (migrasi penuh ke Next.js — struktur PHP lama digantikan aplikasi Node.js di `src/`)

---

## 🗂️ Struktur Direktori (Next.js)

```text
absensi_digital/
├── src/                    # Kode aplikasi Next.js (App Router)
│   ├── app/                # Pages + API Routes (login, admin, guru, siswa, scan, api/*)
│   ├── components/         # Komponen React (dashboard, admin, guru, siswa, ui, scan)
│   ├── lib/                # Utilitas (db, auth, session, api, qr, export, format, dsb)
│   └── middleware.ts       # Proteksi route + whitelist aset publik
├── public/                 # Aset statis (logo.png, manifest.json, sw.js)
├── database/               # Schema SQL + Skrip Migrasi (schema.sql, migrate.php)
├── capacitor.config.json   # Konfigurasi Capacitor JS untuk Mobile App
├── DEPLOYMENT.md           # Panduan go-live: Vercel (gratis) + hosting custom
├── MOBILE_APP_GUIDE.md     # Panduan Build Android APK & iOS IPA
└── next.config.js          # Konfigurasi Next.js (output standalone untuk hosting custom)
```

---

## 🚀 Menjalankan Lokal (Next.js / dev)

```bash
npm install
npm run dev        # buka http://localhost:3000
```

Setup database tetap memakai `database/migrate.php` (jalankan lewat php CLI di Laragon/XAMPP).
Credential env ada di `.env.local` (contoh: `.env.example`).

**Akun Demo Bawaan:**

- **Admin Sekolah:** `ADM-001` | Password: `hadir123`
- **Guru Pengajar:** `198503152010011002` | Password: `hadir123`
- **Siswa:** `12009101` | Password: `hadir123`

---

## ☁️ Meng-Onlinekan Aplikasi (Go-Live)

HadirTadz dapat di-online-kan lewat **2 opsi** (lihat [DEPLOYMENT.md](DEPLOYMENT.md)):

1. **Vercel (hosting gratis)** — deploy otomatis dari GitHub, pasangkan MySQL cloud gratis (TiDB Cloud).
2. **Hosting custom (Hostinger, Rumahweb, VPS)** — build `standalone` lalu jalankan `node server.js`.

---

## 📱 Build ke Aplikasi Mobile (Android & iOS)

Lihat panduan lengkap pada [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md) untuk langkah-langkah kompilasi menggunakan Capacitor JS ke Android Studio (.apk / .aab) dan Xcode (.ipa).

---

## 📄 Lisensi & Hak Cipta

**HadirTadz v.1.0** - &copy; 2026 Hak Cipta Dilindungi Undang-Undang.
