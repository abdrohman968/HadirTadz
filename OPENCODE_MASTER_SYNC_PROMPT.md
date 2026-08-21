# HADIR-TADZ — MASTER OPENCODE SYNC / REPAIR PROMPT

## TUJUAN

Gunakan source project Hadir-Tadz yang sedang dibuka di workspace sebagai **SOURCE OF TRUTH**.

Jangan membangun aplikasi baru.

Tugas Anda adalah:

1. memahami architecture existing
2. mencocokkan requirement baru dengan implementation existing
3. mempertahankan code yang sudah benar
4. menyempurnakan bagian yang kurang
5. memperbaiki bug/error
6. menghilangkan code/route/component/data yang benar-benar duplikat secara aman
7. memperbaiki data yang tidak muncul/tidak terdeteksi/tidak tersinkron
8. menjaga tenant isolation
9. menjaga authentication dan role
10. baru kemudian menambahkan fitur yang memang belum ada

---

# ATURAN ABSOLUT

## 1. EXISTING-FIRST

Untuk setiap requirement gunakan keputusan berikut:

```text
SUDAH ADA + BENAR
→ PERTAHANKAN

SUDAH ADA + KURANG
→ SEMPURNAKAN

SUDAH ADA + BUG
→ PERBAIKI

ADA DUPLIKAT
→ IDENTIFIKASI SOURCE OF TRUTH
→ KONSOLIDASIKAN SECARA AMAN

ADA TAPI TIDAK TERDETEKSI
→ TRACE UI → REQUEST → PHP/API → DATABASE → RESPONSE → UI
→ PERBAIKI ROOT CAUSE

BELUM ADA
→ TAMBAHKAN MINIMAL SESUAI ARCHITECTURE EXISTING
```

Jangan rewrite modul stabil tanpa alasan teknis.

---

# 2. RUNTIME SOURCE OF TRUTH

Runtime utama:

**PHP Native**

Database:

**MySQL/MariaDB**

`src/` adalah Next.js backup/cadangan berdasarkan dokumentasi project.

**Jangan migrasikan aplikasi ke Next.js.**

---

# 3. FIRST EXECUTION — JANGAN LANGSUNG CODING UI

Pada eksekusi pertama, lakukan audit/read-only terlebih dahulu.

Baca minimal:

```text
docs/README.md
docs/DEVELOPMENT_RULES.md
docs/CHANGELOG.md
database/schema.sql
database/migrate.php
config/auth.php
config/database.php
config/helpers.php
auth/login.php
auth/register_school.php
includes/sidebar.php
includes/bottom_nav.php
admin/rules.php
admin/settings.php
api/checkin_self.php
api/scan_process.php
```

Kemudian cari seluruh:

```text
school_id
attendance_rules
school_settings
role_id
register_school
login
INSERT
UPDATE
DELETE
SELECT
TODO
FIXME
```

Output pertama yang harus dibuat:

```text
docs/PROJECT_BASELINE.md
docs/BUG_INVENTORY.md
docs/DATA_INTEGRITY_AUDIT.md
docs/TENANT_ISOLATION_AUDIT.md
docs/IMPLEMENTATION_ROADMAP.md
```

Jika `PROJECT_BASELINE.md` sudah ada, update berdasarkan source code terbaru; jangan membuat dokumentasi yang saling bertentangan.

---

# 4. TENANT ISOLATION — PRIORITAS P0

Project bersifat multi-tenant dengan:

```text
schools.id
↓
school_id
```

`school_id` harus berasal dari authenticated user/session.

Jangan mempercayai:

```php
$_GET['school_id']
$_POST['school_id']
```

sebagai authority.

Semua query tenant-aware wajib ter-scope berdasarkan authenticated school.

### Audit wajib

```text
admin/rules.php
admin/settings.php
api/checkin_self.php
api/scan_process.php
attendance
reports
permissions
journals
users
students
teachers
classes
```

### Ditemukan pada baseline

`admin/rules.php` memiliki:

```sql
SELECT * FROM attendance_rules ORDER BY id
```

yang perlu diperbaiki agar tenant-scoped.

`api/checkin_self.php` dan `api/scan_process.php` juga memiliki lookup `attendance_rules` yang perlu dipastikan tenant-scoped sebelum rule dipakai.

Jangan hanya memperbaiki SELECT; audit INSERT/UPDATE/DELETE juga.

---

# 5. ATTENDANCE SOURCE OF TRUTH — PRIORITAS P0

Ada dua sistem:

```text
school_settings
attendance_rules
```

Policy target:

```text
attendance_rules
→ aturan waktu/aturan absensi terstruktur
→ SOURCE OF TRUTH

school_settings
→ konfigurasi umum sekolah
```

Jangan menghapus salah satu tabel.

Audit reader dan writer.

Jika UI menulis ke `school_settings` tetapi engine membaca `attendance_rules` untuk field yang sama, perbaiki agar hanya ada satu source of truth untuk field tersebut.

Gunakan compatibility/fallback sementara bila dibutuhkan untuk data lama.

---

# 6. SIGNUP SEKOLAH — JANGAN BUAT DARI NOL

`auth/register_school.php` sudah merupakan business logic existing.

Pertahankan:

- transaction
- password hashing
- school creation
- admin creation
- initialization settings
- initialization attendance rules
- redirect/auth behavior

Target UX baru:

```text
STEP 1
Informasi Sekolah

↓
STEP 2
Admin Sekolah

↓
STEP 3
Verifikasi

↓
STEP 4
Selesai
```

Artinya:

```text
EXISTING BUSINESS LOGIC
+
NEW MULTI-STEP UI/UX
+
VALIDATION IMPROVEMENT
+
ERROR/LOADING STATE
```

bukan rewrite backend.

---

# 7. SIGNUP FIELD TARGET

## Step 1 — Informasi Sekolah

Minimal target:

- Nama Sekolah
- NPSN
- Jenjang
- Alamat
- Kota/Kabupaten
- Provinsi
- Kode Pos
- Email Sekolah
- No. Telepon

## Step 2 — Admin

- Nama Admin
- NIK/NIP bila memang diperlukan business rule
- Email Admin
- WhatsApp
- Username/Identifier
- Password
- Konfirmasi Password

## Step 3 — Verifikasi

- review data
- edit data
- terms
- privacy

## Step 4 — Selesai

- success state
- school code
- admin identifier
- login CTA

**Jangan mengarang nama field backend.** Gunakan schema/request existing.

---

# 8. SCHOOL CODE / ADMIN IDENTIFIER

Jika generator menggunakan random:

```text
generate
↓
check unique
↓
retry collision
↓
commit
```

Jangan mengubah format existing tanpa requirement.

Unique constraint existing harus dihormati.

---

# 9. ROLE RESOLUTION

Jika terdapat:

```php
role_id = 1
```

audit apakah `1` adalah admin di seed/schema.

Schema memiliki `roles.role_code` UNIQUE.

Bila aman, gunakan lookup berdasarkan role code secara backward-compatible.

Jangan mengubah numeric IDs existing sembarangan.

---

# 10. EMAIL DUPLICATION

Sebelum menambahkan unique email:

```text
scan duplicate existing data
↓
tentukan rule global/per-school
↓
clean safely
↓
verify references
↓
migration
```

Tidak boleh membuat migration yang gagal karena data lama.

---

# 11. `school_id DEFAULT 1`

Banyak tabel mempunyai default `school_id = 1`.

Anggap ini hanya default/dev convenience, **bukan security mechanism**.

Business query tetap harus explicit menggunakan authenticated school.

Jangan langsung menghapus default sebelum audit seluruh insert dan migration.

---

# 12. DATA TIDAK TERDETEKSI / DATA TIDAK MUNCUL

Jika ada laporan “data tidak terdeteksi”, jangan membuat dummy data.

Trace:

```text
UI
↓
REQUEST
↓
PHP/API
↓
AUTH USER
↓
SCHOOL_ID
↓
QUERY
↓
DATABASE
↓
RESPONSE
↓
PARSER/STATE
↓
UI
```

Periksa:

- filter
- date
- school_id
- role
- status
- JOIN
- column name
- JSON format
- empty result handling
- cache
- JS selector
- state refresh

Perbaiki root cause.

---

# 13. DUPLICATE CODE

Sebelum membuat:

- route
- function
- class
- component
- helper
- service
- API
- query helper

WAJIB search repository terlebih dahulu.

Jika sudah ada:

```text
reuse
or
extend
or
refactor
```

Jangan membuat `*_new`, `*_v2`, `copy`, atau duplicate component tanpa alasan architecture yang jelas.

---

# 14. DUPLICATE DATA

Jangan menghapus duplicate secara buta.

Workflow:

```text
identify duplicates
↓
identify canonical record
↓
find foreign references
↓
move/update references
↓
verify
↓
delete duplicate if safe
```

Semua cleanup harus reversible atau tercatat bila memungkinkan.

---

# 15. BUG & ERROR CLEANUP

Audit:

```text
PHP syntax error
undefined variable
undefined index
undefined function
missing include/require
wrong route
404
500
SQL error
unknown column
empty API result
invalid JSON
double submit
stale state
race condition
silent exception
console/debug leakage
```

Jangan menutupi error dengan `@` atau `try/catch` kosong.

Perbaiki root cause.

---

# 16. AUTHENTICATION REGRESSION

Jangan rusak:

- login admin
- login guru
- login siswa
- logout
- session
- role redirect
- password hashing
- remember session
- forgot password behavior
- kiosk access

Authentication tetap menjadi backend responsibility.

---

# 17. LOGIN UI TARGET

Desain baru:

**WHITE + GREEN GRADIENT**

Desktop:

```text
Branding/illustration | Login form
```

Mobile:

```text
Branding
↓
Login form
```

Target copy:

```text
Selamat Datang!
Silakan masuk untuk melanjutkan.
```

CTA:

```text
Masuk
```

Signup CTA:

```text
belum punya akun?
Daftar Sekarang
```

Jangan menghapus backend dependency sebelum audit.

---

# 18. RESPONSIVE

WAJIB test minimal:

```text
360×800
375×812
390×844
412×915
768px
1024px
1366×768
1440×900
1920×1080
```

Tidak boleh:

- horizontal scroll
- clipped content
- input overflow
- button overflow
- sidebar overlap
- bottom nav overlap
- keyboard menutup CTA
- modal keluar viewport

Jangan menggunakan `overflow:hidden` sebagai cara menutupi layout bug.

---

# 19. UI COMPONENT POLICY

Gunakan existing:

- Button
- Input
- Select
- Card
- Modal
- Toast
- Icons
- Tailwind/config

Jangan install dependency baru hanya untuk kosmetik jika existing tools sudah cukup.

---

# 20. SECURITY

Jangan:

- expose password
- expose token
- expose secret
- trust role from client
- trust school_id from client
- expose raw SQL error
- store plaintext password
- use unsafe HTML injection

---

# 21. DATABASE CHANGE POLICY

Sebelum migration:

1. cek schema
2. cek migration history
3. cek current columns
4. cek indexes
5. cek foreign key
6. cek duplicate data
7. cek production compatibility

Migration harus:

- idempotent bila memungkinkan
- backward-compatible bila memungkinkan
- aman terhadap data lama

---

# 22. TESTING

Setelah perubahan, gunakan command yang memang tersedia di project.

Minimal untuk PHP:

```bash
find . -name "*.php" -print0 | xargs -0 -n1 php -l
```

Jalankan juga bila tersedia:

- lint
- typecheck
- test
- build

Smoke test:

```text
login admin
login guru
login siswa
signup sekolah
logout
attendance
rules
reports
mobile navigation
```

---

# 23. CHANGE WORKFLOW

Untuk setiap perubahan:

```text
INSPECT
↓
UNDERSTAND EXISTING FLOW
↓
IDENTIFY ROOT CAUSE
↓
PATCH MINIMALLY
↓
RUN TESTS
↓
REVIEW DIFF
↓
UPDATE DOCUMENTATION
↓
REPORT
```

Jangan melakukan large-scale rewrite satu kali jalan.

---

# 24. OUTPUT WAJIB

Setiap task harus melaporkan:

```text
TASK RESULT

Status: PASS / PARTIAL / BLOCKED

Files changed:
...

Files added:
...

Files intentionally untouched:
...

Bug fixed:
...

Duplicate consolidated:
...

Data integrity:
...

Tenant isolation:
...

Tests executed:
...

Build/lint/typecheck:
...

Remaining risks:
...
```

Jangan hanya mengatakan `Done`.

---

# 25. FIRST TASK YANG HARUS DIKERJAKAN SEKARANG

Sebelum redesign Login dan Signup, buat audit baseline lengkap.

Kerjakan P0 terlebih dahulu:

1. tenant isolation
2. attendance source of truth
3. auth/session scope
4. data integrity
5. duplicate query/code/data

Lalu hasil audit disimpan ke:

```text
docs/PROJECT_BASELINE.md
docs/BUG_INVENTORY.md
docs/DATA_INTEGRITY_AUDIT.md
docs/TENANT_ISOLATION_AUDIT.md
docs/IMPLEMENTATION_ROADMAP.md
```

Setelah P0 jelas, implementasi dilakukan bertahap:

```text
P0 stabilization
↓
P1 auth/signup
↓
P2 UI/dashboard/attendance
↓
P3 polish/performance
```

---

# FINAL PRINCIPLE

> **Jangan membuat ulang yang sudah ada.**
>
> **Jangan menghapus yang masih dipakai.**
>
> **Jangan menambah dummy data untuk menutupi bug.**
>
> **Jangan memperbaiki UI sambil merusak business logic.**
>
> **Source project asli adalah baseline utama.**
>
> **Setiap perubahan harus dapat dijelaskan dengan bukti dari codebase.**
