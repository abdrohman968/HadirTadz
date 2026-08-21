# BUG INVENTORY — HADIR-TADZ

**Tanggal audit:** 20 Agustus 2026
**Referensi:** `PROJECT_BASELINE.md`, `OPENCODE_MASTER_SYNC_PROMPT.md` (item 15)

Daftar error/bug terverifikasi dari source code. Prioritas: P0 = fix pada task
ini; P1/P2 = follow-up terencana.

---

## P0 — Fix di Task Ini (✅ Selesai)

Semua BUG-001 s/d BUG-011 telah di-patch: seluruh query di-scope `school_id`
yang di-resolve dari sesi/auth; INSERT attendance & attendance_rules kini mengisi
`school_id` secara eksplisit; log CHECK_OUT `api/scan_process.php` menyertakan
`school_id`. Verifikasi: `php -l` lolos pada 39 file; smoke test DB menegaskan
query tenant-scoped mengembalikan data per sekolah yang benar.

### BUG-001 — Cross-tenant read `admin/rules.php`
- File:Baris: `admin/rules.php:54`
- SQL: `SELECT * FROM attendance_rules ORDER BY id`
- Dampak: admin melihat/mengedit rule sekolah lain.
- Fix: scoping `WHERE school_id = ?` (juga pada UPDATE/INSERT).

### BUG-002 — Rule lookup tanpa tenant `api/checkin_self.php`
- File:Baris: `api/checkin_self.php:32–34`
- SQL: `SELECT * FROM attendance_rules WHERE role_code = ? OR role_code='all' ...`
- Dampak: user memakai rule sekolah lain; radius/waktu salah.

### BUG-003 — Rule lookup tanpa tenant `api/scan_process.php`
- File:Baris: `api/scan_process.php:55–57`
- SQL: sama seperti BUG-002.
- Dampak: aturan kiosk salah lintas sekolah.

### BUG-004 — INSERT attendance tanpa `school_id`
- File:Baris:
  - `api/checkin_self.php:99–103`
  - `admin/attendance.php:48–53`
  - `admin/permissions.php:50`
  - `guru/kelas.php:30`
- Dampak: record attendance tersimpan ke `school_id DEFAULT 1` → salah tenant
  dan tidak muncul di dashboard sekolah sebenarnya.

### BUG-005 — INSERT attendance_rules tanpa `school_id`
- File:Baris: `admin/rules.php:36–42`
- Dampak: rule baru jatuh ke sekolah default 1.

### BUG-006 — UPDATE/DELETE attendance tanpa scope tenant
- File:Baris: `admin/attendance.php:39–43` (UPDATE), `:65` (DELETE)
- Dampak: admin bisa mengubah/menghapus data sekolah lain bila tahu id.

### BUG-007 — Dashboard admin lintas tenant
- File:Baris: `admin/index.php:13–14,17–28,41–49,52–63`
- Dampak: angka siswa/guru, statistik absensi, izin pending, dan log terkini
  menampilkan data semua sekolah.

### BUG-008 — Laporan & ekspor lintas tenant
- File:Baris: `admin/reports.php:24–45` (CSV), `:68–89` (tampilan), `:65` (kelas)
- Dampak: dokumen/export memuat data sekolah lain.

### BUG-009 — Grafik statistik lintas tenant
- File:Baris: `api/stats.php:23–32`
- Dampak: chart menampilkan data semua sekolah.
- Bonus: endpoint tidak memvalidasi role.

### BUG-010 — Feed kiosk lintas tenant
- File:Baris: `scan.php:22–33`
- Dampak: riwayat terkini kiosk menampilkan presensi semua sekolah.

### BUG-011 — Log CHECK_OUT tanpa `school_id`
- File:Baris: `api/scan_process.php:159–160` (tidak konsisten dengan `:96`)
- Dampak: log CHECK_OUT default ke sekolah 1.

---

## P0.2 — Master Data Tenant Isolation (✅ Selesai — 20 Agustus 2026)

BUG-106 dan seluruh temuan tambahan master-data telah di-patch: seluruh CRUD
master data (students/teachers/classes/journals/cards/users/permissions)
di-scope `school_id` yang di-resolve dari sesi/auth; semua INSERT eksplisit
mengisi `school_id`. Verifikasi: `php -l` lolos pada 8 file yang diubah; smoke
test menegaskan SELECT tenant-scoped mengembalikan data per sekolah yang benar.

### BUG-106 — Master-data lintas tenant
- File:Baris asal:
  `admin/students.php:100`, `admin/classes.php:62`, `admin/journals.php:14`,
  `admin/cards.php:16`, `guru/jurnal.php:48`, `guru/kelas.php:50`,
  `admin/students.php:32,82`, `admin/teachers.php:31,79,83`.
- Dampak: kelas/guru/siswa/jurnal/cards tampil lintas tenant.
- Fix: semua list & dropdown di-scope `WHERE school_id = ?` (tersebar di
  `admin/students.php`, `admin/teachers.php`, `admin/classes.php`,
  `admin/journals.php`, `admin/cards.php`, `guru/jurnal.php`).

### BUG-107 — INSERT master data tanpa `school_id` (default 1)
- File:Baris:
  `admin/students.php:55–65` (users+students),
  `admin/teachers.php:51–62` (users+teachers),
  `admin/classes.php:36–39` (classes),
  `guru/jurnal.php:33` (journals),
  `siswa/izin.php:37` (permissions).
- Dampak: record baru jatuh ke `school_id DEFAULT 1` walau operator sekolah B.
- Fix: seluruh INSERT eksplisit mengisi `school_id` dari `auth_school_id()` /
  `user['school_id']`.

### BUG-108 — UPDATE/DELETE master data tanpa scope tenant
- File:Baris:
  `admin/students.php:32–46,86–89`,
  `admin/teachers.php:31–43,83–86`,
  `admin/classes.php:26–31,51`,
  `admin/users.php:22,33`.
- Dampak: admin sekolah A bisa edit/hapus/reset data sekolah B bila tahu id.
- Fix: seluruh UPDATE/DELETE ditambahkan `AND school_id = ?`; opsional guard
  `if (!$user_id) throw`.

### BUG-109 — List users admin lintas tenant
- File:Baris: `admin/users.php:47–52`
- Dampak: admin melihat akun semua sekolah pada halaman "Kelola Akun".
- Fix: `WHERE u.deleted_at IS NULL AND u.school_id = :school_id`.

---

## P0.3 — Kiosk Active School Context (✅ Selesai — 20 Agustus 2026)

BUG-105 dan seluruh temuan kiosk telah di-patch: kiosk kini memiliki
**konteks sekolah eksplisit dari sumber terpercaya** (Kiosk Token divalidasi
server-side terhadap tabel `kiosk_tokens`), bukan default hardcoded 1.
Verifikasi: `php -l` lolos seluruh proyek (0 error); smoke test CLI 10
skenario PASS (7 skenario keamanan wajib + 3 skenario pendukung).
Dokumentasi lengkap: `docs/KIOSK_SCHOOL_CONTEXT.md`.

### BUG-105 — Kiosk tanpa konsep "aktif sekolah" → default ke sekolah 1
- File:Baris asal: `config/helpers.php:21–29` (root cause), `scan.php:19`.
- Dampak: feed kiosk & konteks kiosk selalu menunjuk sekolah 1 bila tanpa
  sesi login; kiosk tidak punya identitas perangkat/sekolah.
- Fix (P0.3):
  - `config/helpers.php` — `auth_school_id()` memprioritaskan
    `$_SESSION['kiosk_school_id']`; tambah `kiosk_validate_token()`,
    `kiosk_bind_context()`, `kiosk_context()`, `kiosk_generate_token()`,
    `kiosk_revoke_token()`.
  - Tabel baru `kiosk_tokens` (`schema.sql` seksi 14 + `migrate.php`).
  - `scan.php` — resolve konteks dari `?k=TOKEN`; blocked state bila token
    invalid/expired/revoked; feed di-scope sekolah hasil resolve; JS mengirim
    `kiosk_token` ke API.
  - `api/scan_process.php` — validasi token + **cross-school rejection**
    (user di-scan wajib sesekolah dengan kiosk).
  - `admin/kiosk.php` (baru) + menu sidebar; `auth/register_school.php`
    auto-generate token kiosk.
- Backward compat: kiosk tanpa token tetap bekerja (konteks sesi/auth,
  default 1); token seed otomatis di `migrate.php`.

---

## P1 — Follow-up Terencana (Bukan Bagian Task Ini)

- **BUG-101** Collision generator school_code (`auth/register_school.php:39`).
- **BUG-102** Collision identifier admin `ADM-xxx` (`auth/register_school.php:51`).
- **BUG-103** Hardcoded `role_id = 1` (`auth/register_school.php:58`).
- **BUG-104** Email tanpa unique constraint (`users.email`).
- ~~**BUG-105** Kiosk tanpa konsep "aktif sekolah"~~ → **SELESAI (P0.3)**, lihat seksi P0.3 di atas.
- ~~**BUG-106** Master-data lintas tenant~~ → **SELESAI (P0.2)**, lihat seksi P0.2 di atas.

---

## P1.4 — Auth E2E Test (✅ PASS — 139/139)

End-to-end test terhadap seluruh authentication dan school onboarding flow.
Script: `tests/e2e_auth.php`. Status: **PASS** — tidak ada bug ditemukan.

| Section | Tests | Result |
|---------|-------|--------|
| 1. School Signup Flow | 21 | PASS |
| 2. Duplicate / Validation | 6 | PASS |
| 3. Rollback Test | 3 | PASS |
| 4. Login Admin | 6 | PASS |
| 5. Cross-Tenant Isolation | 17 | PASS |
| 6. Kiosk Integration | 9 | PASS |
| 7. Attendance Integration | 16 | PASS |
| 8. Logout + Session Security | 7 | PASS |
| 9. Registration Success Screen | 5 | PASS |
| 10. Login UI Regression | 17 | PASS |
| 11. Register School UI | 13 | PASS |
| 12. Database Integrity | 8 | PASS |
| 13. Existing Data Safety | 3 | PASS |
| 14. PHP Lint | 1 | PASS |
| 15. Logout Flow | 6 | PASS |

---

## P2.3 — School Profile & Signup Data Completion (✅ Selesai)

Bugs yang diperbaiki:

- ~~BUG-301: `schools.email/phone` menyimpan email/phone admin~~ → **SELESAI (P2.3)**.
  `register_school.php` kini memisahkan `email_sekolah/phone_sekolah` (→ schools)
  dari `$email/$phone` (→ users).
- ~~BUG-302: `admin/settings.php` menulis profil ke `school_settings`~~ → **SELESAI (P2.3)**.
  Profile section kini UPDATE langsung ke `schools` + write-through legacy keys.
- ~~BUG-303: Form profil tidak lengkap~~ → **SELESAI (P2.3)**.
  Ditambahkan: jenjang, kota, provinsi, kode pos, email/phone sekolah, logo URL.

---

## P2.4 — Terms, Privacy & Legal Consent (✅ Selesai — 21 Agustus 2026)

No new bugs. All items verified:
- `terms.php` + `privacy.php` — public pages, green/white design, version displayed.
- `register_school.php` — two separate checkboxes, both validated (PHP + JS).
- Consent inserts use version constants from `config/helpers.php`.
- `admin/consents.php` — tenant-scoped, paginated, sidebar link added.
- php -l 44 files 0 errors; E2E 139/139 PASS.

---

## P2/P3 — Catatan (Bukan Task Ini)

- ~~**BUG-201** Endpoint API (`api/stats.php`) hanya `auth_check()` tanpa role~~
  → **SELESAI (P1.1)**, sudah cek `$role_code !== 'admin'` → Forbidden.
- **BUG-202** Pesan error PHP/SQL mentah terekspos di respons JSON:
  - `api/checkin_self.php:137`
  - `api/scan_process.php:183`
  - `api/stats.php:51`
  (#20 SECURITY — jangan expose raw SQL error).
- **BUG-203** Definisi berulang `get_base_url()` di `database.php`, `auth.php`,
  `helpers.php`, `scan.php` — aman karena dibungkus `function_exists`, tetapi
  redundan (konsolidasi P3).
- **BUG-204** `console.log` debug leakage di kiosk/register/login/footer
  (bukan blocker untuk task ini).

---

## Validasi Catatan (Bukan Bug)

- `auth_school_id()` default 1 saat tanpa sesi → oleh desain (dev convenience).
  Menjadi bug hanya bila dipakai sebagai otorisasi (lihat BUG-105).
- Login global tanpa pilihan sekolah: bukan celah keamanan (password diverifikasi
  dengan hash user yang cocok), tetapi keterbatasan bila identifier sama
  lintas sekolah — didokumentasikan sebagai risiko di IMPLEMENTATION_ROADMAP.