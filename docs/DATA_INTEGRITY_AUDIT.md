# DATA INTEGRITY AUDIT — HADIR-TADZ

**Tanggal audit:** 20 Agustus 2026
**Referensi:** `PROJECT_BASELINE.md` (item 8, 11–15)

---

## 1. Dual Source of Truth Attendance

Terdapat dua tabel konfigurasi yang saling tumpang tindih:

| Aspek | `attendance_rules` | `school_settings` |
|-------|--------------------|-------------------|
| Waktu masuk (check_in_start / work_start_time / late_threshold_time) | **YA** (kolom `time*`) | YA (key `timeInStart`, `timeInEnd`, `lateThreshold`) |
| Jam pulang (check_out_start / early_leave_threshold / work_end_time) | **YA** | YA (key `timeOutStart`) |
| Radius GPS | **YA** (`radius_limit`) | YA (key `radiusMeters`) |
| Profil sekolah / operator / WA Gateway | - | YA |

### Writer
| File:Baris | Tabel yang ditulis |
|------------|--------------------|
| `auth/register_school.php:80` | writes `school_settings` (termasuk time & radius) |
| `auth/register_school.php:89` | writes `attendance_rules` (termasuk time & radius) |
| `admin/settings.php:27` | writes `school_settings` (`latitude`, `longitude`, `radiusMeters`, ...) |
| `admin/rules.php:29,39` | writes `attendance_rules` (waktu & `radius_limit`) |

### Reader
| File:Baris | Baca dari | Field |
|------------|-----------|-------|
| `api/checkin_self.php:27–29` | `school_settings` | latitude, longitude, `radiusMeters` |
| `api/checkin_self.php:32–34` | `attendance_rules` | `radius_limit`, timing |
| `api/scan_process.php:55–57` | `attendance_rules` | timing, radius (jika dipakai) |
| `guru/absen.php:13–15` | `school_settings` | latitude, longitude, `radiusMeters` |
| `siswa/absen.php:13–15` | `school_settings` | latitude, longitude, `radiusMeters` |

### Inkonsistensi terbukti
1. **radius**: `admin/settings.php` menulis ke `school_settings.radiusMeters`,
   `admin/rules.php` menulis ke `attendance_rules.radius_limit`, dan teks editor
   aturan memakai sumber yang berbeda → pengaturan radius yang sama dapat
   berbeda hasil antara kiosk/self-check vs halaman siswa/guru.
2. Untuk siswa/guru, radius dibaca dari `school_settings.radiusMeters`; untuk
   rule engine (`checkin_self`, `scan_process`) lebih memprioritaskan
   `attendance_rules.radius_limit`.

### Keputusan source of truth (sesuai baseline & master prompt)
```text
attendance_rules  = source of truth untuk aturan waktu & aturan absensi terstruktur
school_settings   = konfigurasi umum sekolah (profil, GPS titik, WA gateway, operator)
```

Tindakan task ini:
- Semua reader `attendance_rules` di-scope tenant (lihat TENANT_ISOLATION_AUDIT).
- Tidak menghapus salah satu tabel.
- Fallback kompatibilitas dipertahankan (default time `07:15:00`, radius 150).

Follow-up (P0.2): konsolidasikan UI admin agar radius/waktu diedit dari satu
tempat (`admin/rules.php`), dan `school_settings` hanya menyimpan profil/GPS
titik. Migration data nilai `radiusMeters` lama ke `attendance_rules.radius_limit`
dilakukan hanya setelah disetujui.

---

## 2. `school_id DEFAULT 1` — Risiko Data

Kolom berikut memiliki `DEFAULT 1` pada schema:
`users`, `classes`, `teachers`, `students`, `attendance`, `attendance_logs`,
`attendance_rules`, `permissions`, `journals`, `school_settings`.

INSERT yang TIDAK mengisi `school_id` → record tersimpan ke sekolah id=1:

| File:Baris | INSERT |
|------------|--------|
| `api/checkin_self.php:99–103` | `attendance` |
| `admin/attendance.php:48–53` | `attendance` |
| `admin/permissions.php:50` | `attendance` |
| `guru/kelas.php:30` | `attendance` |
| `admin/rules.php:36–42` | `attendance_rules` |

Fix P0: seluruh INSERT di atas diisi `school_id` eksplisit.

---

## 3. Collision Generator ID

### School Code — `auth/register_school.php:39`
```php
'SCH-' . strtoupper(substr(preg_replace(...), 0, 3)) . rand(100, 999)
```
`schools.school_code` UNIQUE. Random dapat bertabrakan → INSERT gagal.


### Admin Identifier — `auth/register_school.php:51`
```php
'ADM-' . rand(100, 999)
```
`users (school_id, identifier)` UNIQUE. Random dapat bertabrakan dalam satu sekolah.

### Fix yang direkomendasikan (P1 — bukan bagian task ini, karena menyentuh signup)
```text
generate → check unique → retry (max N) → throw bila tetap collide
```

---

## 4. Email Uniqueness

`users.email` TIDAK memiliki unique constraint (schema.sql:52–57).
Risiko: email duplikat lintas sekolah; login memakai `identifier OR email` tanpa
scope sekolah.

Aksi lanjutan (P1 — membutuhkan keputusan bisnis sebelum migration):
1. scan duplicate email existing
2. tentukan business rule (global vs per-school)
3. bersihkan duplikat secara aman (kanonik + pindah referensi)
4. verifikasi foreign references
5. tambah constraint

TIDAK menambah UNIQUE sekarang (berisiko gagal terhadap data lama).

---

## 5. Hardcoded Role ID

`auth/register_school.php:58` memakai `role_id = 1` untuk admin.
Seed schema mengonfirmasi `roles.id = 1` = `admin`. Aman saat ini, tetapi
fragile. Fix P1: lookup `role_code = 'admin'` dengan fallback id=1.

---

## 6. Konsistensi Log Attendance

`api/scan_process.php`:
- CHECK_IN log (`:96`) menyertakan `school_id`.
- CHECK_OUT log (`:159`) **tidak** menyertakan `school_id` → record log default 1.

Fix P0: seragamkan (tambahkan `school_id` pada log CHECK_OUT).

---

## 7. Status Implementasi

| Temuan | Status |
|--------|--------|
| INSERT attendance/rule tanpa school_id (4 file) | **Fix P0 task ini** |
| Log CHECK_OUT tanpa school_id | **Fix P0 task ini** |
| Source of truth radius/waktu inkonsisten | **Dokumentasi + fix reader tenant; konsolidasi UI = follow-up** |
| Collision school_code / ADM | **P1 (signup) — tanpa perubahan di task ini** |
| Email uniqueness | **P1 (analisis + migration aman)** |
| role_id hardcoded | **P1 (lookup role_code)** |