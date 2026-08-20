# Changelog Perbaikan — HadirTadz

Dokumen ini mencatat setiap perbaikan/fitur yang selesai dikerjakan.
Baru ditambahkan di paling atas. Tanggal mengikuti kalender WIB.

---

## [2026-08-18] Optimasi Tampilan & Fungsi Mobile (Web + PWA)

- **Layout HP**: FAB tengah bottom nav diperbaiki (`w-13 h-13` invalid → `w-14 h-14`); viewport `viewport-fit=cover` + zoom aktif + `h-dvh` (layout valid di browser mobile); toast dipindah ke atas bottom nav di layar kecil; flash `showToast` + haptic `navigator.vibrate` (√ getar sukses/error).
- **Tabel → kartu di HP** (`table-responsive-card` + `data-label`): `guru/kelas.php` (plus radio pill status wrap — tidak overflow), `admin/attendance.php`, `admin/students.php`, `admin/teachers.php`, `admin/users.php`, `admin/permissions.php`, `admin/reports.php` (tetap tabel asli saat print via `.print-table`). Riwayat guru/siswa dibersihkan.
- **Absen GPS/kamera**: fallback alert "Kamera tidak tersedia" + tombol Coba Lagi, dan error GPS menampilkan kartu merah + panduan (guru/absen.php & siswa/absen.php).
- **Lainnya**: `siswa/kartu.php` centering aman (konten tak terpotong di layar pendek); `admin/rules.php` form waktu 3→2→3 kolom; KPI dashboard angka `text-2xl sm:text-3xl`; summary laporan & blok tanda tangan responsif.
- **PWA**: `service-worker.js` v1.1 — cache Tailwind CDN/fonts.gstatic/apexcharts/unpkg + runtime-cache halaman (offline deeper), SW terdaftar di `auth/login.php`, `auth/register_school.php`, `scan.php`; icon PNG 192/512 dihasilkan + `manifest.json` (scope/id, PNG maskable, start_url relatif).

---

## [2026-08-18] Tampilan Auth Dimodernkan (Login & Daftar Sekolah)

- **`auth/login.php` ditulis ulang dengan desain modern** mengikuti tampilan Next.js cadangan: tema dark emerald + blur glass (Tailwind CDN + Plus Jakarta Sans + Font Awesome), logo polos tanpa frame, judul "HadirTadz" dua warna, tanpa badge version di judul, tanpa tombol Google SSO/demo autofill.
- Fitur login: dropdown pilihan sekolah, checkbox **Ingat Saya** (remember), ikon mata **toggle password**, panel **"Lupa Password?"** yang bisa di-toggle (aria-expanded) berisi opsi **Hubungi Admin** → `https://wa.me/<62...>` (normalisasi nomor 0→62 dari `schools.phone`) + Hubungi Email, tombol **Kiosk** → `/scan.php`, tautan **"+ Daftarkan Sekolah Baru"**, spinner pada tombol Masuk saat submit, flash/error alert `animate-shake`.
- **`auth/register_school.php` discrapkan**: branding header diganti logo.png + judul dua warna (sesuai login, tanpa icon frame/badge v.1.0), footer tanpa v.1.0, dan **toggle mata untuk Kata Sandi & Konfirmasi Kata Sandi** (`togglePw()`).
- `logo.png` disalin ke root repo agar dipakai PHP (fallback `schools.logo_url`).
- Verifikasi: `php -l` clean; smoke login `ADM-001`/`hadir123` → `/admin/index.php` 200; kedua halaman render 200.

---

## [2026-08-16] Vercel: Jalankan Next.js Cadangan (bukan PHP)

- **Vercel diputuskan menjalankan versi Next.js cadangan** (`src/`), bukan PHP Native. Runtime PHP komunitas (`vercel-php`) hanya memetakan `api/*.php` → serverless function dan **tidak bisa** menjalankan aplikasi PHP Native multi-file + session (`config/`, `helpers/`, `includes/`); build gagal dengan "pattern doesn't match any Serverless Functions".
- `vercel.json` dikembalikan minimal `{ "version": 2 }` — deploy Vercel sukses, `hadirtadz.vercel.app` live `/login` 200 + `/logo.png` 200 (image/png).
- `DEPLOYMENT.md` & `README.md`: Panduan go-live diperjelas — PHP Native di Hostinger/Rumahweb (produksi), Vercel untuk preview Next.js cadangan.

---

## [2026-08-16] Kembali ke PHP Native (format utama)

- Keputusan: aplikasi **PHP Native kembali menjadi format utama**; kode **Next.js disimpan** di repo sebagai cadangan (`src/`, Next.js config) namun tidak aktif.
- `vercel.json` dikembalikan ke konfigurasi runtime **PHP** (`vercel-php@0.6.0`) yang asli.
- `config/database.php` ditambahkan support env `DB_PORT` (sebelumnya hanya host/user/pass/name) — default `3306`.
- `README.md` & `DEPLOYMENT.md` diperbarui: dokumentasi kembali ke PHP Native (struktur, instalasi Laragon/XAMPP, go-live Hostinger/Rumahweb/VPS + opsi Vercel PHP).
- Verifikasi: `php -l` clean; smoke login PHP Native `ADM-001`/`hadir123` → redirect → `/admin/index.php` 200 "Dashboard Administrator - HadirTadz"; DB MySQL lokal tersambung.

---

## [2026-08-16] Opsi Go-Live: Vercel & Hosting Custom

- **2 opsi onlinekan** didokumentasikan di `DEPLOYMENT.md`: (1) **Vercel** gratis — deploy dari GitHub + MySQL cloud TiDB/Aiven/Clever (TLS wajib, env `DB_SSL=true`, `DB_CONN_LIMIT` kecil); (2) **hosting custom** Hostinger/Rumahweb/VPS — `next.config.js` kini `output: 'standalone'`, jalankan `node server.js` (panduan copy `.next/static` + `.env` disertakan).
- `src/lib/db.ts` kini mendukung `DB_SSL`/`DB_SSL_VERIFY` (TLS untuk DB cloud) dan `DB_CONN_LIMIT` (default 5 di Vercel, 10 di hosting lain berdasar `process.env.VERCEL`).
- `vercel.json` diubah dari runtime PHP legacy menjadi konfigurasi Vercel minimal; `.env.example` diperbarui dengan variabel baru.
- `README.md` struktur/instalasi disesuaikan ke Next.js + tautan DEPLOYMENT.
- Verifikasi: `npx tsc --noEmit` 0 error; `next build` sukses menghasilkan `.next/standalone/server.js` + `public/`.

---

## [2026-08-16] Audit Menyeluruh Error, Bug & File Tak Terpakai

- Meninjau seluruh `src/` (112 file) untuk error code, bug, dan file legacy/unused; tidak ada bug baru yang membutuhkan perbaikan — temuan `e?.message` pada `login/page.tsx`, `api/checkin`, `api/siswa/permissions` adalah pesan server intentional (`UploadValidationError`) atau client-side, dan `error.tsx` hanya menampilkan detail di development.
- Semua `lib/` terverifikasi terpakai: `session`, `validation`, `qr`, `qr-auth`, `api-auth`, `api-error`, `export`, `password`, `format`.
- Teridentifikasi kandidat file tak terpakai/legacy (untuk dihapus saat keputusan selesai): `src/components/dashboard/LogoutButton.tsx` (tanpa import), `manifest.json` + `service-worker.js` di root (aplikasi memakai `public/`), direktori PHP lama `admin/ api/ auth/ guru/ siswa/ includes/ config/ assets/` + `index.php scan.php clear_cache.php`, `HadirTadz.v1.0.jpeg`, `vercel.json` (config PHP runtium), `scripts/gen-icons.cjs`. `database/` dipertahankan untuk migrasi.
- Verifikasi: `npx tsc --noEmit` 0 error; smoke login admin/guru/siswa + halaman `/admin* /guru* /siswa* /scan /login /register-school /logo.png` → 200.

---

## [2026-08-15] Fitur Lupa Password & Hubungi Admin — Halaman Login

- **"Lupa Password?"**: tautan baru di baris "Ingat Saya" membuka panel bantuan (toggle, `aria-expanded`); panel menampilkan nama sekolah aktif dan tombol **Hubungi Admin**.
- **Hubungi Admin via WhatsApp**: `api/schools` kini mengembalikan kolom `phone` (nomor admin/PIC dari saat pendaftaran sekolah baru); login page menormalkan nomor (0→62, buang non-digit) lalu membuka `https://wa.me/<nomor>?text=...` dengan pesan siap-kirim ke admin sekolah.
- **Toast di tengah**: provider toast dipindah dari pojok kanan-atas ke **tengah atas layar** (`inset-x-0 items-center`, `max-w-md`); animasi slide-in diganti fade+scale turun agar natural untuk posisi tengah.
- Bonus: hapus `error: error?.message` di `api/schools` (konsisten dgn pola anti-leak).
- Verifikasi: `tsc` 0 error; smoke `/login` 200; SSR memuat toggle "Lupa Password?"; `/api/schools` mengembalikan `phone` per sekolah.

---

## [2026-08-15] Perbaikan Keamanan & Bug (Batch Hasil Audit)

Batch perbaikan keamanan & bug menyeluruh dari hasil audit frontend + backend (44 temuan → 32 task).

**Keamanan & kebocoran lintas sekolah (High):**

- **IDOR lintas sekolah**: `api/admin/classes`, `api/admin/students`, `api/admin/teachers` — semua SELECT/UPDATE/DELETE kini di-scope `school_id` (user.id milik sekolah), dengan error "…tidak ditemukan pada sekolah ini."
- **Kebocoran data lintas sekolah di dashboard**: `lib/dashboard-data.tsx` `getAttendanceStats`/`getRecentAttendance`/`getPendingPermissions` mendapat parameter `schoolId` & filter `school_id`; `admin/page.tsx` melewati schoolId.
- **Kiosk publik `/scan`**: tidak lagi hardcode sekolah 1 — menerima `?school=` di page, POST kirim `school_id`, lookup user di-scope, audit log memakai `schoolId: kioskSchoolId || undefined`.
- **Brute-force & spoof IP login**: `lib/rate-limit.ts` `clientIp` hanya mempercayai `x-real-ip` dulu, lalu `x-forwarded-for` bila `TRUST_PROXY=true` (fallback socket); `api/auth/login` menambah rate-limit per-IP (30/15mnt) dan per-identifier (5/15mnt), pesan "Akun dinonaktifkan" dihapus (anti-enumerasi akun), dummy bcrypt hanya bila hash ada.
- **Validasi `class-attendance` & `journals`**: hasil SELECT kelas kini benar-benar dicek (sebelumnya dibuang), milik sekolah, tanggal divalidasi regex, status di-whitelist (HADIR/TERLAMBAT/IZIN/SAKIT/ALPHA).

**Bug/perilaku (High):**

- **Pagination ganda AuditLogManager**: hapus `usePagination` client (server-pagination), totalPages dari server, `pageData = logs`, SafePage clamp → tombol Next/Aktifkan kembali berfungsi.
- **SessionWatcher idle-logout**: `poke` tidak lagi menutup overlay prompt; GRACE_MS setelah prompt → logout otomatis via ref; tombol Keluar = doLogout, "Saya Masih di Sini" reset idle.

**Medium:**

- **Formula injection CSV/XLS**: netralkan sel diawali `= + - @` (OWASP) di `api/admin/reports` (`esc`) dan `lib/export.ts` (`safeCell`).
- **CheckIn race**: tangani `ER_DUP_ENTRY` (1062) → 409 pesan ramah (duplikat antar-tab/perangkat).
- **Stale CRUD state**: tambah `useEffect` sync dari props di Attendance/Student/Teacher/User/Permission/Rule/ClassManager setelah `router.refresh()`.
- **Password default statis 'hadir123'**: diganti `generateTempPassword()` acak `xxx-nnn` per pengguna (`lib/password.ts`); respons API mengembalikan `temp_password` sekali untuk ditampilkan; notif "Password: hadir123" di UI dihapus.
- **GlobalSearch**: spinner tidak macet saat API gagal + guard race (reqId) agar respons lama tidak menimpa hasil baru.
- **SelfCheckinForm**: `geolocation.clearWatch` pada cleanup (cegah leak watcher).
- **Hydration `<option selected>`**: 7 file filter form → `defaultValue` pada `<select>` (hapus atribut selected).
- **waApiKey write-only**: GET settings tidak lagi mengembalikan waApiKey; POST menyimpannya hanya bila diisi.
- **XSS attachment_url**: helper `safeUrl` (hanya http/https atau `/`) dipakai di PermissionManager & PermissionSubmit sebelum render `<a href>`.
- **register-school**: rate-limit per-IP (3/jam), identifier `ADM-`/`SCH-` unik (loop cek tabrakan), pesan error generik tanpa `e.message`.
- **Selfie URL prediktibel**: filename selfie kini memuat `randomBytes(8)` acak.
- **Validasi input admin**: settings (lat -90..90, lng -180..180, radius 1..5000), attendance (date `YYYY-MM-DD`, time `HH:MM`, status whitelist), users (`active|inactive`), rules (format waktu `HH:MM`, radius, role).
- **Error leak SQL**: `e.message` diganti pesan generik di ~20 route (log detail via `console.error`/`handleApiError`); pesan deskriptif UploadValidationError tetap dipertahankan.

**Low:**

- **DynamicQr**: QR terakhir tetap tampil saat refresh gagal (error jadi catatan), countdown format `mm:ss`.
- **ThemeProvider**: matchMedia listener lama diremove saat ganti tema (`cleanupRef`).
- **ScanKiosk**: guard `inFlightRef` anti double-submit + `mountedRef` cegah setState setelah unmount.
- **Permission approve**: guard `busy` + disable tombol saat memproses.
- **Timezone WIB**: `AuditLogManager`/`JournalFeed` memformat datetime UTF-ke-WIB tanpa kesalahan `Z`; `LiveClock` memakai `nowClockWIB`; `ReportView` tanggal cetak lewat prop `printDate` (server WIB) → tidak ada hydration mismatch; trend bucket pakai `nowInWIB`.

---

## [2026-08-15] Revisi Posisi Judul Aplikasi & Toggle Hidebar (Layout)

- **Keputusan user (revisi)**: judul aplikasi "HadirTadz" dan tombol toggle hidebar menu utama **tidak dipindah ke sidebar**; keduanya **dipasang sejajar horizontal di header atas** (dekat logo HT + nama sekolah).
- Perubahan `src/components/dashboard/DashboardShell.tsx`: header berisi (kiri→) burger mobile (`lg:hidden`), **toggle hidebar desktop** (ikon panah ganda, `hidden lg:inline-flex`), lalu **brand "HadirTadz" + nama sekolah**; sidebar kini **murni daftar menu** (header brand/toggle di dalamnya dihapus).
- Perilaku tetap: toggle menyusutkan sidebar `lg:w-64 → lg:w-20` (icon-only); mobile memakai drawer via burger + bottom nav.
- Verifikasi: `tsc` 0 error; smoke `/admin` 200; HTML SSR — hanya ada 1 tombol toggle yang terletak sebelum `<aside>` (di header), brand muncul di header, dan bagian sidebar tidak lagi memuat tulisan "Hadir".

---

## [2026-08-15] Penyesuaian Layout Sidebar, Header & Dashboard (Instruksi Lanjutan)

- **Sidebar**: tombol hidebar dipindah dari header atas ke **pojok kanan-atas di dalam header sidebar**, sejajar dengan brand "HadirTadz" + nama sekolah (kiri); tombol ikon panah ganda tetap `hidden lg:inline-flex`; drawer mobile kini punya tombol tutup (X) di header sidebar.
- **Active state menu**: logika `active` diperbaiki agar memprioritaskan kecocokan eksak (`pathname === item.href`) sebelum awalan, sehingga menu yang benar (mis. Presensi, Siswa, Izin) ikut ter-highlight hijau `bg-emerald-700 text-white` — bukan selalu Dashboard.
- **Sidebar bawah**: blok profil + tombol logout diganti dengan versi aplikasi **"HadirTadz v.1.0"**; akun pengguna & logout kini **hanya** di pojok kanan-atas via `HeaderProfile`.
- **Header atas**: `LiveClock` (waktu server) dipindah ke **kiri-atas**; bekas posisinya di kanan diganti tombol **lonceng notifikasi + badge merah** (komponen baru `NotificationBell.tsx`, jumlah "absen masuk hari ini" dari `/api/stats`, polling tiap 60 dtk, dropdown cepat ke halaman presensi).
- **Dashboard admin** (`admin/page.tsx`) disusun ulang 5 blok berurutan: (1) Welcome Banner, (2) kartu statistik Hadir/Terlambat/IzinSakit, (3) 2 kolom = Grafik Tren (8) + Log Presensi Terkini (4), (4) 2 kolom = Menunggu Izin (7) + Aksi Cepat (5), (5) Aktivitas Sistem (Audit Log) penuh di bawah.
- Verifikasi: `tsc` 0 error; smoke `/admin` 200; HTML SSR memuat brand sidebar + Server Time + bilangan versi serta tombol lonceng.

---

## [2026-08-15] Tata Letak Header Utama (Navbar Atas) — Pola Horizontal

- **Latar belakang**: header atas kini hijau solid `bg-emerald-700` dengan border `border-emerald-800` (setara `bg-green-700`).
- **Bagian kiri (identitas & toggle)**: logo HT + judul "HadirTadz" + nama sekolah, lalu tepat di kanannya **tombol toggle/hamburger** (`Buka atau tutup menu samping`) — pada desktop menciutkan/membuka sidebar (`lg:w-64 ↔ lg:w-20`), pada mobile membuka drawer.
- **Bagian tengah (pencarian & waktu)**: **Search Bar global** (`GlobalSearch.tsx` + endpoint baru `/api/search`) di tengah untuk mencari siswa/guru (nama, NISN/NIP, kelas/mapel) dengan hasil dropdown realtime (debounce 250ms, Enter → halaman siswa, Escape/tap luar menutup); di kirinya **Server Time** (`LiveClock`) jam realtime.
- **Bagian kanan (aksi & profil)**: lonceng **notifikasi + badge** (`NotificationBell`), pintasan **Kiosk Gerbang**, **toggle tema** (terang/gelap), lalu **foto profil + dropdown nama Administrator** di ujung paling kanan.
- **Sidebar**: header brand + toggle hidebar dilepas dari sidebar (kini di navbar); sidebar jadi murni menu; drawer mobile memakai header ringkas (brand + tombol tutup).
- **Responsivitas**: seluruh barisan header memakai `flex items-center justify-between` tanpa menumpuk; bagian tengah hanya tampil dari breakpoint `md` ke atas, pintasan Kiosk dari `xl`.
- Verifikasi: `tsc` 0 error; smoke `/admin` 200; SSR memuat brand→toggle→jam→search→lonceng→profil berurutan; `/api/search?q=budi` mengembalikan guru Budi Santoso.

---

## [2026-08-15] Rebuild Komponen Layout/Sidebar (DashboardShell)

- **Masalah**: posisi/ikon sidebar tidak sesuai — memunculkan ikon toggle full layar di kiri atas; toggle & brand tidak sejajar; collapse tidak rapi.
- **Perbaikan penuh** pada `src/components/dashboard/DashboardShell.tsx` sesuai ketentuan UI/UX:
  1. **Sidebar di sisi kiri** (desktop) via `aside` `lg:static` dalam flex row; mobile menjadi **drawer** `fixed translate-x` dengan backdrop + tutup via ESC/backdrop/tombol X.
  2. **Brand "HadirTadz" sejajar horizontal dengan tombol toggle** di header bagian atas sidebar (`h-16` flex `justify-between`): logo HT + nama (kiri) dan tombol panah collapse (kanan, `hidden lg:inline-flex`).
  3. **Timgggle collapse desktop**: menyusut dari `lg:w-64` → `lg:w-20` (icon-only) — label/group-title/profil tersembunyi via `lg:hidden`/`lg:sr-only`, ikon tetap rapi dengan `lg:justify-center`; bukan full-screen.
  4. **Responsivitas**: di mobile, tombol **burger** di top bar membuka drawer sidebar; **Bottom Navigation Bar** (MobileBottomNav) tetap di bawah layar; brand di top bar hanya ditampilkan di mobile (`lg:hidden`).
- Verifikasi: `tsc` 0 error; smoke `/admin` 200 tanpa error; HTML SSR berisi `id="app-sidebar"`, `lg:static`, burger, dan tombol collapse.

---

## [2026-08-15] Revert Warna Ikon Menu — Kembali ke Satu Warna Seragam

- **Keputusan user**: revisi — fitur ikon menu berwarna unik per menu (chip berwarna) **dikembalikan seperti semula**: ikon semua menu memakai satu warna seragam (skema emerald).
- Perubahan: `nav.tsx` → hapus field `color` dari `NavItem` + objek palet `C` + seluruh `color: C.*` di item admin/guru/siswa; `DashboardShell.tsx` sidebar kembali ke gaya asli (ikon slate→emerald saat hover, item aktif `bg-emerald-700 text-white`, label teks standar); `MobileBottomNav.tsx` popup "Lainnya" kembali ke gaya asli (ikon emerald, item aktif `bg-emerald-700 text-white`).
- Verifikasi: `tsc` 0 error; smoke `/admin` 200 tanpa error; kelas chip warna menu tidak lagi dirender (sisa `bg-purple-100` dsb. hanyalah badge status / tombol aksi yang memang sudah ada).

---

## [2026-08-15] Perbaikan Index Unique Multi-Sekolah (Database)

- **Bug**: register sekolah gagal — `Duplicate entry 'schoolName' for key 'school_settings.setting_key'` lalu `Duplicate entry 'rule-std' for key 'attendance_rules.rule_code'`.
- **Akar masalah**: di DB live, sejumlah tabel memakai unique index **satu kolom** (peninggalan skema lama) padahal `database/schema.sql` menetapkan unique **komposit `(school_id, <kolom>)`** — sehingga sekolah kedua menabrak data sekolah pertama. Melanggar desain multi-sekolah.
- **Perbaikan (ALTER TABLE)**: `school_settings` → `unique_school_setting(school_id, setting_key)`; `attendance_rules` → `unique_school_rule_code(school_id, rule_code)`; `users` → `unique_school_identifier(school_id, identifier)`; `students` → `unique_school_nisn(school_id, nisn)`; `teachers` → `unique_school_nip(school_id, nip)`; `classes` → `unique_school_class_code(school_id, class_code)`.
- Unique global yang memang benar dipertahankan: `schools.npsn`, `schools.school_code`, `roles.role_code`, `users.user_id`, `attendance.unique_user_date`.
- Verifikasi: tidak ada data duplikat sebelum alter; 2 registrasi sekolah baru sukses (HTTP 200) lalu data uji dibersihkan; tersisa 2 sekolah asli.

---

## [2026-08-15] Warna Aksen Khusus per Ikon Menu

- `nav.tsx`: setiap item menu kini punya field `color` — palet aksen unik (emerald, blue, teal, sky, indigo, violet, purple, fuchsia, amber, rose, orange, red, cyan, lime) dengan varian terang/gelap.
- Penerapan: sidebar desktop & popup "Lainnya" (mobile) menampilkan ikon dalam **chip kotak berwarna** sesuai warna masing-masing menu; **teks label selalu hitam** (tidak berubah putih), status aktif ditandai ring emerald di chip (bukan ubah warna teks).
- Verifikasi: `tsc` 0 error; smoke `/admin` 200 tanpa error; kelas warna & teks gelap terlihat di render.

---

## [2026-08-15] Bottom Nav Mobile — Hapus Burger + Popup Menu "Lainnya"

- `DashboardShell.tsx`: tombol burger (hamburger) di header **dihapus**; sidebar kini desktop-only (`hidden lg:flex`, drawer `mobileOpen` dibuang). Tombol hidebar (desktop) tetap ada.
- `MobileBottomNav.tsx`: tombol "Lainnya" kini membuka **popup menu lengkap** (bottom sheet) yang berisi semua menu utama **beserta ikon**, bukan drawer sidebar. Tambah prop `moreGroups`; popup diberi backdrop, tombol tutup, `role="dialog"`, `aria-haspopup`/`aria-expanded`.
- Efek: navigasi mobile memakai bottom nav (5 menu) + popup "Semua Menu" untuk akses penuh; ruang layar lebih lega tanpa burger.
- Verifikasi: `tsc` 0 error; smoke semua role 200 tanpa error.

---

## [2026-08-15] Tombol Sembunyikan Sidebar (Hidebar)

- `src/components/dashboard/DashboardShell.tsx`: tombol toggle di header (icon tersembunyi di <lg, terlihat di desktop) untuk menyembunyikan/menampilkan sidebar — state `collapsed`.
- Saat collapsed: `lg:w-0 lg:border-r-0 lg:overflow-hidden lg:translate-x-0`, konten utama otomatis memanfaatkan ruang lebar penuh; tetap `w-64` saat dibuka.
- Mode mobile tidak terpengaruh (tetap memakai drawer `mobileOpen`); atribut aksesibilitas `aria-label`/`aria-expanded`/`aria-hidden` sudah diatur.
- Verifikasi: `tsc` 0 error; smoke `/admin` 200 tanpa error; tombol toggle ada di render awal dengan label "Sembunyikan menu samping".

---

## [2026-08-15] Sesi Eksekusi Task — Batch #8/#7/#4/#15/#17/#12/#1

### Export Excel/PDF (#8)

- `src/lib/export.ts`: generator XLS (HTML table + BOM) dan PDF (penggerak layout + fragment per halaman + xref/trailer), murni tanpa library eksternal; helper `todayStamp()`.
- `src/components/ui/ExportButtons.tsx`: dropdown "Ekspor" (Excel .xls / PDF) reusable.
- Dipasang di `ReportView`, `UserManager`, `StudentManager`, `TeacherManager`, `PermissionManager`, `AuditLogManager` dengan kolom yang disesuaikan per tabel.

### Sort Data (#7)

- `Pagination.tsx`: `usePagination` kini mendukung `sortKey`/`sortDir` + `compareValues`; tambah komponen `SortableTh` dan hook `useSortable`.
- Penerapan sorting asc/desc pada header tabel CRUD (User, Student, Teacher, Permission), stabil dengan pagination & search.

### Dashboard Admin (#4/#9)

- `dashboard-data.tsx`: `getAttendanceTrend()` (daily 14 hari / weekly 8 / monthly 12 / yearly 6) + `getRecentActivities()` (dari audit_logs).
- `TrendChart.tsx`: stacked bar chart murni CSS, server-safe tanpa library.
- `admin/page.tsx`: empat grafik tren, Quick Action grid, dan "Aktivitas Sistem Terbaru" dibangun.

### PWA (#15)

- `public/manifest.json`, `public/sw.js` (network-first API + stale-while-revalidate + push placeholder), ikon PNG 192/512/180 (generator `scripts/gen-icons.cjs`).
- `ServiceWorkerRegister.tsx` + registration di `layout.tsx`; middleware whitelist `sw.js`/`icons/`.

### Aksesibilitas (#17)

- Skip-link "Lewati ke konten utama" + `id="main-content"` pada DashboardShell, login, register-school, ScanKiosk.
- `:focus-visible` global, `prefers-reduced-motion`, `aria-live` di ScanKiosk, `aria-label`/`aria-expanded`/`aria-current`/`role=alert` di komponen utama.

### Remember Login (#12)

- Login API menerima `remember`; cookie 30 hari bila centang, sebaliknya sesi browser.
- Checkbox "Ingat Saya (30 hari)" di halaman login.

### Responsive & Loading (#1/#5)

- Skeleton `loading.tsx` di segmen dashboard (admin/guru/siswa + riwayat).
- Audit horizontal overflow: hanya `w-[100px]`/`max-w-[150px]` yang aman (truncate), tanpa scroll horizontal bermasalah.

### Verifikasi

- `npx tsc --noEmit` 0 error; `npm run build` sukses; smoke login 3 role + 17 halaman semuanya HTTP 200 tanpa error.

---

## [2026-08-15] Sesi Eksekusi Task — Batch Audit & QR (ringkasan)

### Audit Log UI (#10)

- `src/lib/queries.ts`: `getAuditLogs()` (filter action IN (…), rentang tanggal, search lintas kolom, COUNT total).
- API `GET /api/admin/audit` (auth admin, query action/search/from/to/page/pageSize); `ApiResponse` ditambah klaim `total`.
- Halaman `/admin/audit` + `AuditLogManager.tsx` (grup filter aksi, badge berwarna, parse UA browser/device, tabel sticky + Pagination).
- Menu "Riwayat Audit" ditambahkan ke `src/lib/nav.tsx`.

### QR Dinamis (#13)

- `src/lib/qr-auth.ts`: ticket `HT|v1|<expMs>|<identifier>|<hmac>` TTL 120 s, verifikasi timingSafeEqual + expiry.
- API `GET /api/qr/ticket`; komponen `DynamicQr.tsx` (auto-refresh, countdown); `StudentCard.tsx` memakai QR dinamis.
- `/api/scan/route.ts`: validasi QR dinamis sebelum lookup, `logAudit SCAN_REJECTED`, pakai identifier hasil decode.

---

## [2026-08-12] Fondasi UX & Wajib (#4/#2/#7/#6/#18/#12-session)

- **Toast (#4)**: provider `Toast.tsx`, auto-toast error di `fetchAPI` (opt-out `silent`), dipasang di layout + aksi CRUD/login/logout.
- **Bottom Nav (#2)**: `MobileBottomNav.tsx` maks 5 menu per role + drawer "Lainnya", di `DashboardShell`.
- **Pagination & Sticky Header (#7/#8)**: `Pagination.tsx` (PAGE_SIZES 10/25/50/100), thead sticky + container scroll, diterapkan di semua manager CRUD.
- **Validasi Form (#6)**: `validation.ts` (required/min/max/numeric/email/phone/duplicate) + `FieldError`/`inputFieldCls` di Modal; diterapkan di Student/Teacher/Class/Permission/Login.
- **Dark Mode (#18)**: `ThemeProvider` + `ThemeToggle`, `darkMode:'class'`, varian `dark:` merata di halaman admin/guru/siswa.
- **Session Timeout (#12)**: `SessionWatcher.tsx` (idle 30 menit, warning 10 menit, overlay 60 detik).

---

## Catatan Alur

- Setiap perbaikan selesai → entri ditambahkan di bagian atas file ini.
- Selalu diverifikasi: `npx tsc --noEmit`, `npm run build`, dan smoke runtime role terkait (HTTP 200).
- Jangan menimpa entri lama; tambahkan entri baru dengan tanggal terbaru di atas.
