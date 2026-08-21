# HADIR-TADZ — PROJECT BASELINE
## Baseline Sinkronisasi Source Project

**Tanggal audit:** 20 Agustus 2026  
**Source:** `absensi_digital-sumber.zip`

## 1. Prinsip Source of Truth

Source code project asli adalah **SOURCE OF TRUTH**.

Requirement, mockup, dan prompt baru hanya menjadi target penyempurnaan.

Runtime utama project saat ini adalah **PHP Native**. Dokumentasi project menyebut `src/` sebagai aplikasi Next.js cadangan yang tidak dipakai aktif. Jangan melakukan migrasi/rewrite ke Next.js kecuali ada keputusan eksplisit baru.

## 2. Struktur Utama

```text
admin/                 Modul admin
api/                   Endpoint PHP
assets/                Asset CSS/JS/icon
 auth/                 Login, register sekolah, logout
config/                Database, auth, helper
 database/              Schema dan migration
guru/                  Portal guru
siswa/                 Portal siswa
includes/              Header/sidebar/bottom nav/footer
mobile/                Capacitor/mobile wrapper
public/                PWA assets
src/                   Next.js backup/cadangan
docs/                  Dokumentasi
index.php              Entry point PHP
scan.php               Kiosk scanner
```

## 3. Modul Existing yang Harus Dipertahankan

Project sudah memiliki fondasi untuk:

- authentication
- role admin, guru, siswa
- multi-school / multi-tenant
- attendance
- attendance rules
- school settings
- dashboard per role
- mobile bottom navigation
- kiosk scanner
- QR/selfie/GPS attendance flow
- reports
- permissions
- journals
- PWA/mobile wrapper

**Jangan membangun ulang modul yang sudah benar.**

## 4. Login Existing

`auth/login.php` sudah memiliki:

- identifier NISN/NIP/username/email
- password
- show/hide password
- remember me
- forgot-password information panel
- link pendaftaran sekolah
- kiosk entry
- flash/error handling

Target baru yang sudah disepakati hanya mengubah **visual/UI/UX**, bukan authentication flow.

Target visual:

```text
WHITE + GREEN GRADIENT
```

Desktop: split branding + form.  
Mobile: single-column.

CTA signup:

```text
belum punya akun?
Daftar Sekarang
```

## 5. Signup Existing

`auth/register_school.php` sudah memiliki business logic pendaftaran sekolah:

```text
POST
 ↓
validasi dasar
 ↓
cek NPSN
 ↓
transaction
 ↓
create school
 ↓
create admin user
 ↓
create school_settings defaults
 ↓
create attendance_rules defaults
 ↓
commit
 ↓
redirect login
```

Artinya target Signup Multi-Step adalah **redesign + penyempurnaan** atas fitur existing, bukan sistem registrasi baru.

### Target UX

```text
Step 1 — Informasi Sekolah
        ↓
Step 2 — Admin Sekolah
        ↓
Step 3 — Verifikasi
        ↓
Step 4 — Selesai
```

Business logic, password hashing, transaction, school relation, dan role assignment harus dipertahankan kecuali audit membuktikan ada bug.

## 6. Multi-Tenant Model

Master tenant:

`schools`

Relasi utama:

`school_id`

Role:

- admin
- guru
- siswa

Schema sudah memiliki foreign key school pada banyak tabel dan unique constraint berbasis school.

Contoh constraint yang sudah ada:

- `schools.school_code` UNIQUE
- `schools.npsn` UNIQUE
- `users (school_id, identifier)` UNIQUE
- `teachers (school_id, nip)` UNIQUE
- `students (school_id, nisn)` UNIQUE
- `classes (school_id, class_code)` UNIQUE
- `attendance_rules (school_id, rule_code)` UNIQUE
- `school_settings (school_id, setting_key)` UNIQUE
- `attendance (user_id, date)` UNIQUE

Constraint existing ini **jangan dihapus sembarangan**.

## 7. Temuan Prioritas P0 — Tenant Isolation

### `admin/rules.php`

Ditemukan query:

```sql
SELECT * FROM attendance_rules ORDER BY id
```

Query update/insert rule juga perlu dipastikan menggunakan `school_id` dari authenticated context.

Risiko:
- rule sekolah lain dapat terbaca
- rule sekolah lain dapat diubah
- cross-tenant data leakage

### `api/checkin_self.php`

Ditemukan query rule:

```sql
SELECT * FROM attendance_rules
WHERE role_code = ? OR role_code = 'all'
ORDER BY ...
LIMIT 1
```

Query tersebut tidak terlihat dibatasi `school_id`.

Query attendance/student juga perlu diaudit untuk memastikan tenant scope konsisten.

### `api/scan_process.php`

Query rule juga tidak terlihat membatasi `school_id` sebelum rule dipakai.

Ada bagian yang baru mengambil `school_id` dari user setelah user ditemukan, sehingga urutan scoping perlu diperbaiki agar rule lookup sudah tenant-aware.

### Kebijakan

Selalu:

```text
Authenticated User
      ↓
Resolve school_id
      ↓
Query dengan school_id
```

Jangan mempercayai `school_id` dari request client sebagai authority.

## 8. Temuan P0 — Dual Source of Truth Attendance

Ada dua sistem konfigurasi:

### `school_settings`
Key-value settings.

### `attendance_rules`
Aturan absensi terstruktur.

Target policy:

```text
attendance_rules
= source of truth untuk aturan waktu/aturan absensi terstruktur

school_settings
= konfigurasi umum sekolah
```

Jangan menghapus salah satu tabel.

Audit seluruh reader/writer agar field yang sama tidak dibaca dari satu tabel tetapi ditegakkan dari tabel lain.

## 9. Temuan P1 — Signup Belum Multi-Step

`auth/register_school.php` saat ini masih berupa satu form besar.

Perbaikan:

- pertahankan business logic
- pecah UX menjadi beberapa step
- validasi per step
- review sebelum submit
- final submit tetap transaction-safe

## 10. Temuan P1 — School Code Collision

Generator saat ini menggunakan pola random:

```php
'SCH-' . PREFIX . rand(100, 999)
```

Unique constraint sudah ada, tetapi generator sebaiknya melakukan:

```text
generate
↓
check unique
↓
retry bila collision
↓
commit
```

Jangan mengubah format school code lama tanpa migration/business requirement.

## 11. Temuan P1 — Admin Identifier Collision

Identifier kosong dibuat menggunakan pola random `ADM-xxx`.

Unique constraint sudah ada pada `(school_id, identifier)`.

Implementasi yang lebih aman:

```text
generate
↓
check unique per school
↓
retry bila collision
```

## 12. Temuan P1 — Hardcoded Role ID

`auth/register_school.php` menggunakan `role_id = 1` ketika membuat admin.

Schema memiliki `roles.role_code` UNIQUE.

Karena ID 1 saat ini memang seeded sebagai admin, ini bukan immediate failure. Namun implementasi lebih aman jika role dicari berdasarkan `role_code = 'admin'` secara backward-compatible.

Jangan mengubah numeric role IDs yang sudah dipakai tanpa migration aman.

## 13. Temuan P1 — Email Uniqueness

Schema `users` belum menunjukkan unique constraint untuk email.

Sebelum menambah constraint:

1. audit duplicate existing email
2. tentukan business rule: global atau per-school
3. bersihkan duplicate secara aman
4. cek foreign references
5. baru migration

Jangan langsung menambah UNIQUE yang berpotensi gagal terhadap data lama.

## 14. Temuan P1 — `school_id DEFAULT 1`

Banyak tabel memakai:

```sql
school_id DEFAULT 1
```

Ini tidak boleh dianggap sebagai tenant isolation.

Code business harus tetap menentukan `school_id` secara eksplisit berdasarkan authenticated context.

Migration untuk menghapus default bukan prioritas pertama; audit query dan insert terlebih dahulu.

## 15. Temuan P1 — Data Integrity

Sebelum menambah tabel/kolom/index/route/component baru:

1. cek apakah sudah ada
2. cek pemakaian
3. cek migration history
4. cek unique constraint
5. cek foreign key/reference
6. cek duplicate data

Jika data ganda ditemukan:

```text
identifikasi canonical record
↓
cek references
↓
pindahkan references jika perlu
↓
hapus duplicate hanya setelah aman
```

Jangan melakukan mass delete untuk sekadar “membersihkan”.

## 16. Temuan P2 — Backup Codebase

`src/` Next.js harus diperlakukan sebagai backup/cadangan.

Jangan menghapusnya hanya karena tidak aktif.

Sebelum menghapus file apa pun:

- grep/import/reference
- route reference
- deployment reference
- dokumentasi
- runtime usage

## 17. Responsive Requirement

`docs/DEVELOPMENT_RULES.md` sudah mewajibkan:

- desktop
- laptop
- tablet landscape
- tablet portrait
- mobile landscape
- mobile portrait
- Tailwind breakpoints

Tidak boleh ada:

- horizontal scroll
- card keluar layar
- tombol terpotong
- sidebar menutupi konten
- bottom bar menutupi konten
- text overflow
- form keluar layar
- grid pecah
- modal lebih besar dari viewport
- komponen bertabrakan

Mobile menggunakan bottom navigation maksimal 5 menu.

## 18. Priority Roadmap

### P0

1. Tenant isolation audit/fix
2. Attendance rules source-of-truth audit/fix
3. Auth/session cross-tenant audit
4. Data integrity / duplicate audit

### P1

5. Signup stabilization + multi-step UI
6. School/admin identifier collision handling
7. Role resolution cleanup
8. Email uniqueness analysis
9. Error/undefined/broken route cleanup

### P2

10. Login visual redesign
11. Dashboard refinement
12. Master-data refinement
13. Attendance UX refinement
14. Reports/monitoring refinement

### P3

15. Performance polish
16. Accessibility polish
17. visual polish

## 19. Definition of Done

Task dianggap selesai bila:

- existing feature tidak rusak
- tenant isolation aman
- tidak ada duplicate route/component
- tidak ada data duplicate yang baru akibat perubahan
- error utama diperbaiki
- responsive desktop/mobile
- auth tetap berfungsi
- role tetap benar
- DB transaction aman
- lint/typecheck/build sesuai tool yang tersedia
- smoke test lolos

## 20. Prinsip Kerja

```text
INSPECT
  ↓
PROVE CURRENT BEHAVIOR
  ↓
IDENTIFY ROOT CAUSE
  ↓
PATCH MINIMALLY
  ↓
TEST
  ↓
REVIEW DIFF
  ↓
REPORT
```

**Jangan memperbaiki UI dengan merusak business logic.**
