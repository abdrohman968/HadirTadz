# TENANT ISOLATION AUDIT — HADIR-TADZ

**Tanggal audit:** 20 Agustus 2026
**Referensi:** `PROJECT_BASELINE.md` (item 7), `OPENCODE_MASTER_SYNC_PROMPT.md` (item 4)
**Runtime:** PHP Native + MySQL/MariaDB
**Model tenant:** `schools.id` → `school_id` pada seluruh tabel data.

---

## 1. Teknik Audit

Seluruh file PHP yang mengakses tabel tenant di-scan untuk menemukan query
`SELECT` / `INSERT` / `UPDATE` / `DELETE` yang tidak di-scope `school_id`.

Scope audit menyeluruh:

```text
admin/rules.php, admin/attendance.php, admin/index.php, admin/reports.php,
admin/settings.php, admin/permissions.php, admin/students.php,
admin/teachers.php, admin/classes.php, admin/journals.php, admin/cards.php,
api/checkin_self.php, api/scan_process.php, api/stats.php,
guru/absen.php, guru/index.php, guru/jurnal.php, guru/kelas.php,
siswa/absen.php, siswa/izin.php, siswa/kartu.php,
scan.php, auth/login.php, auth/register_school.php, includes/header.php
```

Kebijakan target (wajib):

```text
Authenticated User
      ↓
Resolve school_id (darî session/auth_user — BUKAN dari client)
      ↓
Query dengan school_id
```

`$_GET['school_id']` / `$_POST['school_id']` TIDAK BOLEH dijadikan authority.

---

## 2. Temuan (P0 — Perbaiki di Task Ini)

### 2.1 `admin/rules.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 54 | `SELECT * FROM attendance_rules ORDER BY id` | Semua rule semua sekolah terbaca |
| 28–33 | `UPDATE attendance_rules ... WHERE id = ?` | Admin sekolah A bisa mengubah rule sekolah B bila tahu id |
| 36–42 | `INSERT INTO attendance_rules (...) VALUES (...)` tanpa `school_id` | Rule baru jatuh ke `school_id DEFAULT 1` |

Risiko: **cross-tenant read + write + data corruption**.

---

### 2.2 `api/checkin_self.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 32–34 | `SELECT * FROM attendance_rules WHERE role_code = ? OR role_code='all' ...` | Rule lookup tidak dibatasi `school_id` → rule sekolah lain bisa dipakai |
| 99–103 | `INSERT INTO attendance (user_id, ...)` tanpa `school_id` | Record attendance tersimpan ke `school_id DEFAULT 1` walau user milik sekolah lain |
| 75–76 | `SELECT * FROM attendance WHERE user_id = ? AND date = ?` | Aman (scoped pengguna terautentikasi) |

Coordinates (`get_setting latitude/longitude/radiusMeters`) sudah tenant-aware via
`auth_school_id()` (helpers.php:161).

---

### 2.3 `api/scan_process.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 55–57 | `SELECT * FROM attendance_rules WHERE role_code = ? OR role_code='all' ...` | Rule lookup tidak dibatasi `school_id` |
| 86 | `$school_id = $user['school_id'] ?? 1` | Resolusi `school_id` terjadi SETELAH rule dipakai; urutan scoping salah |
| 155 | `UPDATE attendance SET time_out = ? ... WHERE id = ?` | Update tanpa scope `school_id` |
| 159–160 | `INSERT INTO attendance_logs (attendance_id, ...)` tanpa `school_id` | Log CHECK_OUT tidak konsisten dengan CHECK_IN (baris 96 sudah ada school_id) |

---

### 2.4 `admin/attendance.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 76 | `SELECT * FROM classes ORDER BY grade, class_name` | Kelas semua sekolah tampil di filter |
| 79–87 | `SELECT u.* ... FROM users u ...` | Dropdown pilih user berisi user semua sekolah |
| 90–97 | `SELECT a.* ... WHERE a.date = :date` | Daftar presensi semua sekolah |
| 32–34 | `SELECT class_id FROM students WHERE user_id = ?` | Tanpa scope sekolah (aman-ish, perlu dikunci) |
| 38–43 | `UPDATE attendance ... WHERE id = ?` | Admin lintas sekolah bisa mengubah record milik sekolah lain |
| 48–53 | `INSERT INTO attendance (user_id,...)` tanpa `school_id` | Record baru jatuh ke `school_id DEFAULT 1` |
| 65 | `DELETE FROM attendance WHERE id = ?` | Admin lintas sekolah bisa menghapus record sekolah lain |

---

### 2.5 `admin/index.php` (Dashboard)
| Baris | Query | Masalah |
|-------|-------|---------|
| 13 | `SELECT COUNT(*) FROM students` | Jumlah siswa semua sekolah |
| 14 | `SELECT COUNT(*) FROM teachers` | Jumlah guru semua sekolah |
| 17–28 | `... FROM attendance WHERE date = ?` | Statistik absensi semua sekolah |
| 41–49 | `SELECT p.* ... FROM permissions p ...` | Izin pending semua sekolah |
| 52–63 | `SELECT a.* ... FROM attendance a ... WHERE a.date = ?` | Log presensi terkini semua sekolah |

---

### 2.6 `admin/reports.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 65 | `SELECT * FROM classes ...` | Kelas semua sekolah |
| 24–45 | Ekspor CSV `SELECT a.* ... WHERE a.date BETWEEN ...` | **Data sekolah lain ikut terdokumen/di-export** |
| 68–89 | Query tampilan laporan | Sama, lintas sekolah |

---

### 2.7 `api/stats.php`
| Baris | Query | Masalah |
|-------|-------|---------|
| 23–32 | `... FROM attendance WHERE date = ?` | Grafik dashboard menampilkan data semua sekolah |

Tambahan: endpoint hanya `auth_check()` tanpa validasi role (`require_auth(['admin'])`).

---

### 2.8 `scan.php` (Kiosk)
| Baris | Query | Masalah |
|-------|-------|---------|
| 22–33 | `SELECT a.* ... WHERE a.date = ?` | Feed "riwayat terkini hari ini" menampilkan presensi semua sekolah |

Catatan: Kiosk tidak memiliki konsep "aktif sekolah" sebagaimana admin login;
`auth_school_id()` akan menghasilkan 1 bila tanpa sesi login.

---

### 2.9 Tambahan jalur attendance (P0)
| File:Baris | Query | Masalah |
|------------|-------|---------|
| `admin/permissions.php:50` | `INSERT INTO attendance (user_id, ...)` | Approval izin mencatat attendance tanpa `school_id` → default 1 |
| `guru/kelas.php:30` | `INSERT INTO attendance (user_id, ...)` | Guru entri kelas mencatat attendance tanpa `school_id` → default 1 |

---

## 3. Temuan (P0.2 — Follow-up master-data)

Data master bocor lintas tenant. Dipisahkan agar task P0.1 tidak melebar.

| File:Baris | Query |
|------------|-------|
| `admin/students.php:100` | `SELECT * FROM classes` (filter kelas) |
| `admin/classes.php:62` | `SELECT * FROM teachers` (pilih wali kelas) |
| `admin/journals.php:14` | `SELECT * FROM classes` |
| `admin/cards.php:16` | `SELECT * FROM classes` |
| `guru/jurnal.php:48` | `SELECT * FROM classes` |
| `guru/kelas.php:50` | `SELECT * FROM classes` |
| `admin/students.php:32,82` | `SELECT user_id FROM students WHERE id = ?` → tambah scope |
| `admin/teachers.php:31,79,83` | `SELECT user_id ... / DELETE ... WHERE id = ?` → tambah scope |

### Temuan tambahan saat audit P0.2 (20-08-2026)
| File:Baris | Query | Masalah |
|------------|-------|---------|
| `admin/students.php:37,52–65,86–89` | UPDATE users, INSERT users/students tanpa `school_id`, DELETE users/students tanpa scope | INSERT jatuh ke default 1; admin bisa edit/hapus data sekolah lain |
| `admin/teachers.php:35,51–62,83–86` | UPDATE users, INSERT users/teachers tanpa `school_id`, DELETE tanpa scope | sama seperti students |
| `admin/classes.php:26–31,35–39,51` | UPDATE/INSERT/DELETE classes tanpa `school_id` | INSERT default 1; UPDATE/DELETE lintas tenant |
| `admin/journals.php:17–23` | SELECT journals tanpa `school_id` | daftar jurnal semua sekolah |
| `admin/users.php:22,33,47–52` | UPDATE users (reset/setatus) & list users tanpa `school_id` | admin mereset/ubah status & melihat akun sekolah lain |
| `guru/jurnal.php:33` | INSERT journals tanpa `school_id` | jurnal baru jatuh ke default 1; kelas bisa lintas sekolah |
| `siswa/izin.php:37` | INSERT permissions tanpa `school_id` | izin baru jatuh ke default 1 |

---

## 4. Kebijakan Implementasi

1. `school_id` selalu di-resolve dari sesi/auth (`auth_school_id()` atau `user.school_id`).
2. Semua query tenant dijalankan dengan `school_id` sebagai parameter terikat
   (prepared statement), bukan concatenation.
3. `school_id DEFAULT 1` pada schema dianggap dev-convenience, **bukan** security
   mechanism. Semua INSERT eksplisit mengisi `school_id`.
4. Tidak menghapus default kolom pada task ini — audit & perbaiki query dahulu.

---

## 5. Status

| Area | Status |
|------|--------|
| `admin/rules.php` | **FIXED (task ini)** — SELECT/INSERT/UPDATE di-scope `school_id` |
| `api/checkin_self.php` | **FIXED (task ini)** — rule tenant-scoped, INSERT & UPDATE attendance berisi `school_id` |
| `api/scan_process.php` | **FIXED (task ini)** — resolve `school_id` sebelum rule, rule scoped, log CHECK_OUT berisi `school_id` |
| `admin/attendance.php` | **FIXED (task ini)** — classes/users/attendance list, INSERT/UPDATE/DELETE di-scope tenant |
| `admin/index.php` | **FIXED (task ini)** — counts, stats, pending permissions, recent attendance di-scope tenant |
| `admin/reports.php` | **FIXED (task ini)** — laporan & ekspor CSV di-scope tenant |
| `api/stats.php` | **FIXED (task ini)** — stats di-scope tenant + validasi role admin |
| `scan.php` | **FIXED (P0.3)** — konteks sekolah dari `?k=TOKEN` (validasi `kiosk_tokens`), feed scoped, blocked state untuk token invalid/expired/revoked. Legacy tanpa token (default 1) tetap kompatibel |
| `api/scan_process.php` (kiosk) | **FIXED (P0.3)** — validasi kiosk token + cross-school rejection; `school_id` request TIDAK pernah jadi authority; resolve tetap dari record user (tenant-correct) |
| `admin/permissions.php` | **FIXED (task ini)** — approve di-scope tenant, INSERT attendance berisi `school_id` |
| `guru/kelas.php` | **FIXED (task ini)** — INSERT attendance berisi `school_id`, kelas & siswa di-scope tenant |
| `admin/students.php` | **FIXED (P0.2)** — CRUD di-scope `school_id`, INSERT users/students berisi `school_id`, classes scoped |
| `admin/teachers.php` | **FIXED (P0.2)** — CRUD di-scope `school_id`, INSERT users/teachers berisi `school_id` |
| `admin/classes.php` | **FIXED (P0.2)** — INSERT berisi `school_id`; UPDATE/DELETE/join di-scope tenant |
| `admin/journals.php` | **FIXED (P0.2)** — classes & journals list di-scope `school_id` |
| `guru/jurnal.php` | **FIXED (P0.2)** — INSERT journals berisi `school_id`, validasi kelas, list di-scope tenant |
| `admin/cards.php` | **FIXED (P0.2)** — classes & students di-scope `school_id` |
| `admin/users.php` | **FIXED (P0.2)** — reset/status & list users di-scope `school_id` |
| `siswa/izin.php` | **FIXED (P0.2)** — INSERT permissions berisi `school_id` |
| `guru/index.php`, `siswa/*`, `auth/profile.php` | **BENAR (verified)** — query di-scope user terautentikasi (`user_id`/`teacher_user_id`), bukan lintas tennant |
| `scan.php` / `api/scan_process.php` (kiosk) | **FIXED (P0.3)** — kiosk memiliki konteks sekolah eksplisit (token divalidasi server-side); feed & scan scoped; cross-school REJECT. Lihat `docs/KIOSK_SCHOOL_CONTEXT.md` |