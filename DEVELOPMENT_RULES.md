# DEVELOPMENT_RULES.md

## Standar Pengembangan Aplikasi Absensi Digital

**Versi:** 2.0
**Status:** Wajib dipatuhi oleh seluruh AI Agent maupun Developer.

---

# TUJUAN

Dokumen ini menjadi **Single Source of Truth (SSOT)** dalam proses pengembangan aplikasi Absensi Digital.

Seluruh fitur baru, refactoring, maupun perbaikan bug **WAJIB** mengikuti aturan pada dokumen ini.

Prioritas utama aplikasi adalah:

* Responsive
* Cepat
* Mudah digunakan
* Modern
* Konsisten
* Siap Production
* Siap Online

---

# 1. RESPONSIVE DESIGN (WAJIB)

## Semua halaman WAJIB responsive

Support minimal:

* Desktop
* Laptop
* Tablet Landscape
* Tablet Portrait
* Mobile Landscape
* Mobile Portrait

Breakpoint mengikuti Tailwind:

* sm
* md
* lg
* xl
* 2xl

---

## Tidak boleh terjadi

❌ Horizontal Scroll

❌ Card keluar layar

❌ Tombol terpotong

❌ Sidebar menutupi konten

❌ Bottom Bar menutupi konten

❌ Text overflow

❌ Form keluar layar

❌ Grid pecah

❌ Table melebar keluar

❌ Modal lebih besar dari layar

❌ Button berpindah ke bawah karena layout buruk

❌ Komponen bertabrakan

---

## Semua halaman WAJIB muat penuh

Artinya:

Desktop:

* memanfaatkan lebar monitor secara optimal
* tidak ada ruang kosong berlebihan
* layout proporsional

Mobile:

Seluruh komponen:

* tetap terlihat
* tidak keluar layar
* tetap mudah ditekan
* mudah dibaca
* nyaman digunakan dengan satu tangan

---

# 2. NAVIGASI BERDASARKAN DEVICE

## DESKTOP

Semua role menggunakan:

Sidebar Navigation

Contoh:

Dashboard

Kelas

Absensi

Laporan

Pengguna

Approval

Pengaturan

Profil

Logout

Sidebar selalu aktif.

---

## MOBILE

Semua role WAJIB menggunakan:

Bottom Navigation

Mengikuti UX:

* DANA
* SeaBank
* Shopee
* Tokopedia
* Gojek

Bukan sidebar.

Bottom Navigation maksimal:

5 Menu

Contoh:

Beranda

Riwayat

Absen

Aktivitas

Saya

Halaman lain menggunakan:

Floating Menu

atau

More Menu

---

# 3. UI / UX

Seluruh tampilan menggunakan prinsip:

Modern

Minimalis

Clean

Flat Design

Spacing konsisten

Radius konsisten

Shadow ringan

Animasi ringan

Loading cepat

---

Gunakan:

8px spacing system

Icon konsisten

Typography konsisten

Button konsisten

Card konsisten

Color palette konsisten

---

# 4. NOTIFIKASI GLOBAL

Seluruh aksi WAJIB memiliki notifikasi mengambang (Toast).

Contoh:

Login berhasil

Logout berhasil

Data berhasil ditambahkan

Data berhasil diubah

Data berhasil dihapus

Upload berhasil

Import berhasil

Export berhasil

Absen berhasil

Approval berhasil

Password berhasil diubah

Profil berhasil diperbarui

Sinkronisasi berhasil

Backup selesai

Restore selesai

Error koneksi

Session habis

Token kadaluarsa

---

Notifikasi memiliki jenis:

Success

Error

Warning

Info

---

Lokasi:

Desktop:
pojok kanan atas

Mobile:
bagian atas

Auto close:
3-5 detik

---

# 5. LOADING EXPERIENCE

Tidak boleh ada halaman kosong.

Gunakan:

Skeleton Loading

Spinner

Progress Bar

Loading Overlay

Shimmer Effect

---

# 6. VALIDASI FORM

Semua form WAJIB memiliki:

Realtime Validation

Required Validation

Format Validation

Length Validation

Duplicate Validation

Server Validation

---

Pesan error jelas.

Contoh:

Nama wajib diisi

Email tidak valid

NIS sudah digunakan

Password minimal 8 karakter

---

# 7. PENCARIAN

Semua data CRUD WAJIB memiliki:

Search

Filter

Sort

Pagination

Jumlah data per halaman

---

# 8. DATA TABLE

Table WAJIB:

Responsive

Sticky Header

Sticky Action

Column Resize (Desktop)

Horizontal Scroll hanya untuk tabel besar

Export:

Excel

PDF

Print

CSV

---

# 9. DASHBOARD

Dashboard harus informatif.

Minimal terdapat:

Jumlah siswa

Jumlah guru

Jumlah hadir

Jumlah izin

Jumlah sakit

Jumlah alfa

Grafik harian

Grafik mingguan

Grafik bulanan

Grafik tahunan

Aktivitas terbaru

Quick Action

---

# 10. AUDIT LOG

Seluruh aktivitas disimpan.

Contoh:

Login

Logout

Tambah data

Edit data

Delete data

Import

Export

Approval

Backup

Restore

Pengaturan

---

Audit menampilkan:

User

Tanggal

Jam

IP

Browser

Device

Role

Aksi

Status

---

# 11. FITUR ONLINE

Aplikasi harus siap online.

Wajib mendukung:

HTTPS

Domain

SSL

Cloud Database

Auto Backup

CDN

Caching

Compression

Image Optimization

Lazy Loading

Queue

Log Monitoring

---

# 12. KEAMANAN

Wajib:

CSRF

XSS Protection

Rate Limit

JWT

Role Permission

RBAC

Encrypted Password

Secure Cookie

Session Timeout

Remember Login

2FA (opsional)

---

# 13. FITUR ABSENSI

Tambahkan:

GPS Validation

Radius Sekolah

QR Dinamis

QR Expired

Selfie Verification

Face Detection (opsional)

Anti Fake GPS

Anti Screenshot QR

Riwayat Lokasi

Jam Server

---

# 14. FITUR ADMINISTRASI

Import Excel

Export Excel

Export PDF

Backup Database

Restore Database

Template Import

Bulk Delete

Bulk Edit

Bulk Approval

---

# 15. PWA (Progressive Web App)

Aplikasi wajib dapat:

Install ke HP

Install ke Desktop

Offline Mode (cache)

Push Notification

Splash Screen

Background Sync

---

# 16. PENGATURAN SEKOLAH

Logo

Nama Sekolah

Alamat

Tahun Ajaran

Semester

Jam Masuk

Jam Pulang

Hari Aktif

Hari Libur

Lokasi GPS

Radius

Tema

---

# 17. AKSESIBILITAS

Support:

Keyboard Navigation

Screen Reader

High Contrast

Dark Mode

Large Font

Focus Indicator

---

# 18. DARK MODE

Seluruh halaman support:

Light Mode

Dark Mode

System Mode

---

# 19. PERFORMA

Target:

Lighthouse > 90

FCP < 2 detik

LCP < 2.5 detik

CLS < 0.1

TTFB cepat

Bundle sekecil mungkin

Lazy Import

Code Splitting

Tree Shaking

---

# 20. QA CHECKLIST

Sebelum merge:

✓ Responsive Desktop

✓ Responsive Tablet

✓ Responsive Mobile

✓ Tidak overflow

✓ Tidak ada error console

✓ Tidak ada warning penting

✓ Semua CRUD berjalan

✓ Semua toast tampil

✓ Semua role berjalan

✓ Semua menu aktif

✓ Semua export berhasil

✓ Semua import berhasil

✓ Validasi berjalan

✓ Session aman

✓ Dark Mode normal

✓ PWA normal

✓ Lighthouse minimal 90

---

# 21. FUTURE IMPROVEMENT (REKOMENDASI)

## A. Monitoring

* Monitoring server realtime
* Monitoring penggunaan storage
* Monitoring database
* Monitoring performa

## B. Notifikasi

* Push Notification
* Email Notification
* WhatsApp Gateway
* Telegram Bot

## C. Integrasi

* Dapodik
* Google Calendar
* Google Drive Backup
* Microsoft 365
* LDAP / SSO

## D. Laporan

* Dashboard Kepala Sekolah
* Dashboard Guru
* Dashboard Orang Tua
* Dashboard Yayasan

## E. AI Assistant

* Analisis keterlambatan siswa
* Prediksi kehadiran
* Rekomendasi tindakan
* Ringkasan absensi otomatis
* Insight statistik otomatis

## F. Multi Sekolah

* Multi Tenant
* Multi Cabang
* Multi Tahun Ajaran

## G. DevOps

* Docker
* CI/CD
* Auto Deployment
* Staging & Production Environment
* Automated Testing
* Monitoring Error (Sentry/Log Management)

---

# PENUTUP

Seluruh pengembangan berikutnya harus mengacu pada dokumen ini. Setiap fitur baru tidak boleh menurunkan kualitas UI/UX, performa, keamanan, maupun responsivitas aplikasi. Prioritas utama adalah pengalaman pengguna yang konsisten di desktop dan mobile, arsitektur yang mudah dikembangkan, serta kesiapan aplikasi untuk digunakan secara online dalam skala produksi.
