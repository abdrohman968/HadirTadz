# ATTENDANCE SETTINGS MAPPING — SOURCE OF TRUTH (P0.4) — HADIR-TADZ

**Tipe tugas:** P0 Stabilization — Attendance Source of Truth
**Tanggal:** 21 Agustus 2026
**Status:** ✅ Selesai
**Referensi:** `docs/IMPLEMENTATION_ROADMAP.md` (risiko #2 - radius), `docs/KIOSK_SCHOOL_CONTEXT.md`

---

## 1. Tujuan

Seluruh jalur presensi (self check-in, kiosk/QR scan, UI guru & siswa, eksekusi
attendance engine) W A J I B membaca konfigurasi absensi dari **sumber yang sama
(canonical source)**. Task ini memetakan setiap parameter absensi ke canonical
source-nya, merapikan contraction sumber radius yang bertumpuk, dan
mendokumentasikan homologasi `school_settings` vs `attendance_rules`.

**Aturan keras:**
- TIDAK ada migrasi data langsung (mass UPDATE/DELETE/DROP) — hanya
  regularisasi reader/writer + fallback kompatibel.
- Nama field memakai nama yang benar-benar ada di source (hasil grep, bukan
  asumsi).
- Prinsip pembagian: `attendance_rules` = aturan absensi terstruktur per-role;
  `school_settings` = konfigurasi umum sekolah (profil & nilai default).

---

## 2. Ringkasan Audit (WRITER / READER / TABLE / Digunakan oleh)

### 2a. `attendance_rules` (aturan absensi terstruktur)

| Field | WRITER | READER (engine/UI) | Digunakan oleh |
|-------|--------|--------------------|----------------|
| `check_in_start` (time, def 06:00:00) | `admin/rules.php`, `migrate.php:490`, `auth/register_school.php:89` | tampilan `admin/rules.php:103` | **belum di-consume engine** (info/masa depan) |
| `work_start_time` (time, def 07:00:00) | sama | tampilan `admin/rules.php:107` | **belum di-consume engine** |
| `late_threshold_time` (time, def 07:15:00) | sama | `api/checkin_self.php`, `api/scan_process.php` | ✅ **engine** — status TERLAMBAT (batch masuk) |
| `check_out_start` (time, def 14:00:00) | sama | tampilan `admin/rules.php:111`; var `scan_process.php:106` | **belum dipakai** dalam keputusan check-out |
| `work_end_time` (time, def 15:30:00) | sama | tampilan form rules | **belum di-consume engine** |
| `early_leave_threshold` (time, def 13:30:00) | sama | `api/scan_process.php:107,194` | ✅ **engine** — catatan "Pulang cepat" |
| `allow_late` (tinyint, def 1) | `migrate.php:490`, `register_school.php:89` | — | **belum di-consume** (placeholder kebijakan terlambat) |
| `radius_limit` (int, def 150) | `admin/rules.php:25,31,40` | `api/checkin_self.php` (canonical resolver) | ✅ **engine** — batas radius per-role |
| `days_of_week` (varchar, def '1,2,3,4,5') | `migrate.php:490`, `register_school.php:89` | — | **belum di-consume** (placeholder aturan weekend/holiday) |

### 2b. `school_settings` (konfigurasi umum sekolah)

| Key | WRITER | READER | Digunakan oleh |
|-----|--------|--------|----------------|
| `schoolName`, `npsn`, `schoolLevel`, `address` | `admin/settings.php`, `migrate.php:480`, `register_school.php:80` | `get_setting` (header, kartu, laporan) | Profil/identitas — ✅ tidak overlap dgn aturan |
| `operatorName`, `operatorPhone` | sama | `admin/settings.php` | Profil admin |
| `latitude`, `longitude` | sama | `checkin_self.php`, `guru/absen.php:13-14`, `siswa/absen.php:13-14` | ✅ **engine** — titik koordinat pusat geofencing |
| `radiusMeters` | sama | `admin/settings.php:137`, `guru/absen.php:15`, `siswa/absen.php:15` | **FALLBACK default** radius (lihat §4) |
| `waApiKey`, `waGatewayNumber` | `admin/settings.php:22-23` | `admin/settings.php:49-50` | **belum di-consume** (config notifikasi WA, masa depan) |
| `timeInStart`='06:00', `timeInEnd`='07:15', `lateThreshold`='07:15', `timeOutStart`='14:00' | `migrate.php:467-470`, `register_school.php:71-74` | — | **ORPHAN / legacy** — tidak pernah dibaca engine (lihat §5) |

> Catatan fallback `get_setting()` (`config/helpers.php:281`): prioritas
> `school_settings` → kolom tabel `schools` (name, address, npsn, level,
> latitude, longitude, radius_meters) → `$default`. Setiap `set_setting()`
> memakai `ON DUPLICATE KEY UPDATE` (unique school_id+setting_key).

### 2c. `schools` (tabel induk)

Kolom `latitude`, `longitude`, `radius_meters` (def 150) bukan jalur tulis utama
(disimpan saat seeder/register), dan hanya terpakai sebagai **fallback** oleh
`get_setting()`. Lihat §4.

---

## 3. Matriks Kanonikal: Parameter | Sumber Sekarang | Canonical | Konsumen | Migrasi

| Parameter | Current Source | **Canonical Source** | Consumers | Migration Needed |
|-----------|----------------|----------------------|-----------|------------------|
| Titik pusat GPS (`latitude`, `longitude`) | `school_settings` (fallback `schools`) | `school_settings` (writer: `admin/settings.php`; fallback `schools` via `get_setting`) | `checkin_self`, `guru/absen`, `siswa/absen` | ❌ |
| Radius GPS per-role (`radius_limit`) | `attendance_rules.radius_limit` + tumpang tindih `school_settings.radiusMeters` + `schools.radius_meters` | **`attendance_rules.radius_limit`** (writer: `admin/rules.php`) | `checkin_self` (engine), `guru/absen`, `siswa/absen` (UI — kini sinkron via resolver) | ❌ data; ✅ reader sudah diarahkan |
| Radius default fallback (`radiusMeters`) | `school_settings.radiusMeters` (fallback `schools.radius_meters`) | `school_settings.radiusMeters` HANYA sebagai fallback default bila tidak ada rule | `admin/settings.php` (label "Default"), resolver `get_attendance_radius` | ❌ (label admin diperjelas) |
| Batas telat (`late_threshold_time`) | `attendance_rules` (def `07:15:00`) | `attendance_rules` | `checkin_self`, `scan_process` | ❌ |
| Pulang cepat (`early_leave_threshold`) | `attendance_rules` (def `13:30:00`) | `attendance_rules` | `scan_process` | ❌ |
| Waktu kerja lain (`check_in_start`, `work_start_time`, `check_out_start`, `work_end_time`) | `attendance_rules` | `attendance_rules` (info/masa depan) | tampilan `admin/rules.php` | ❌ (belum di-consume engine) |
| Aturan weekend/hari libur | — (belum ada field; `days_of_week` placeholder) | `attendance_rules.days_of_week` (belum di-consume) | — | ❌ (ditandai placeholder) |
| Kebijakan terlambat/izin | — (belum ada field; `allow_late` placeholder) | `attendance_rules.allow_late` (belum di-consume) | — | ❌ (ditandai placeholder) |
| Mode absensi / selfie / GPS / QR requirement | — (tidak ada field konfigurasi; dipaksakan via kode) | — | `photo_base64` wajib di `checkin_self`, `method=qr` di `scan_process` | ❌ (tidak ada konfigurasi) |

---

## 4. Overlap Utama: Radius (3 Sumber → 1 Canonical)

### Temuan

Analog (radius) tersimpan di **3 tempat**:

1. `schools.radius_meters` (kolom, def 150) — ditulis seeder/register,
   dibaca hanya sebagai fallback `get_setting('radiusMeters')`.
2. `school_settings.radiusMeters` (key, def '150') — ditulis `admin/settings.php`,
   dibaca `get_setting('radiusMeters')`.
3. `attendance_rules.radius_limit` (kolom, def 150) — ditulis `admin/rules.php`
   (per-role), dibaca engine.

**Masalah konsistensi (BUG tersembunyi):** server `api/checkin_self.php`
menghitung `is_within_radius` memakai `radius_limit` dari **rule** (bila ada),
tetapi UI `guru/absen.php` & `siswa/absen.php` menghitung radius tampilan
pakai `get_setting('radiusMeters')` dari **school_settings**. Akibat: admin
mengatur radius 200m khusus guru di halaman Aturan, UI guru tetap menampilkan
150m — klien memutuskan di luar radius lebih dini daripada server.

### Solusi (canonical resolver)

- Helper baru `get_attendance_radius($role_code)` di `config/helpers.php`:
  1. `attendance_rules.radius_limit` untuk role → **menang**
  2. `school_settings.radiusMeters` (via `get_setting`) → fallback
  3. `schools.radius_meters` (via `get_setting`) → fallback terakhir
- Semua konsumen radius diarahkan ke resolver: `checkin_self`, `guru/absen`,
  `siswa/absen`. Satu sumber keputusan client == server.
- `get_attendance_rule($role_code)` = resolver rule terstruktur (prioritas
  rule spesifik role → rule `'all'`).
- `admin/settings.php:136` dilabel ulang menjadi **"Batas Radius Default"** +
  keterangan bahwa per-role diatur di **Aturan Absensi**.

**Konsumen radius (final):** `api/checkin_self.php:43` (engine),
`guru/absen.php:15` (UI), `siswa/absen.php:15` (UI). Konsumen `radius_limit`
untuk `scan_process` tidak berlaku (kiosk tanpa GPS).

---

## 5. Legacy / Orphan Keys

| Key | Ditulis oleh | Dibaca oleh | Status |
|-----|--------------|-------------|--------|
| `school_settings.timeInStart` | `migrate.php:467`, `register_school.php:71` | — | **ORPHAN** — tidak pernah dibaca engine; nilai menduplikasi `attendance_rules.check_in_start`. Tidak dihapus (kompatibilitas), didokumentasikan agar tidak dipakai. |
| `school_settings.timeInEnd` | `migrate.php:468`, `register_school.php:72` | — | **ORPHAN** — duplikat konsep `late_threshold_time`. |
| `school_settings.lateThreshold` | `migrate.php:469`, `register_school.php:73` | — | **ORPHAN** — duplikat `late_threshold_time`. |
| `school_settings.timeOutStart` | `migrate.php:470`, `register_school.php:74` | — | **ORPHAN** — duplikat `check_out_start`. |
| `attendance_rules.check_out_start` | `admin/rules.php` | var tidak terpakai `scan_process.php:106` | Dibaca tapi belum dipakai dalam keputusan; diparalelkan sebagai info. |
| `attendance_rules.allow_late`, `days_of_week` | seeder/register | — | Placeholder kebijakan (weekend/holiday), siap di-consume di iterasi lanjutan. |

> Semua yang ditandai ORPHAN/placeholder TIDAK dihapus dan TIDAK dimigrasi
> (per aturan task). Ditandai agar pengembangan berikutnya tidak menjadikan
> `school_settings.time*` sebagai sumber truth.

---

## 6. Sumber Truth Final per Parameter Absensi

```
READER CONSUMER                      WRITER                CANONICAL SOURCE
─────────────────────────────────────────────────────────────────────────────
api/checkin_self.php            admin/rules.php   ──►    attendance_rules
api/scan_process.php            admin/rules.php   ──►    attendance_rules
guru/absen.php (UI)             admin/rules.php   ──►    attendance_rules.radius_limit
siswa/absen.php (UI)            admin/rules.php   ──►    attendance_rules.radius_limit
(checkin koord. GPS)            admin/settings.php ──►   school_settings.latitude/longitude
(radius fallback)               admin/settings.php ──►   school_settings.radiusMeters
(attendance_rules seed)         migrate.php / register_school.php
```

Rantai **Writer → Canonical → Reader → Engine** yang kini konsisten:
`ADMIN UI (rules.php / settings.php) → WRITER → CANONICAL SOURCE → READER (get_attendance_rule / get_attendance_radius / get_setting) → ATTENDANCE ENGINE`

---

## 7. Perubahan File (P0.4)

| File | Perubahan |
|------|-----------|
| `config/helpers.php` | **Baru:** `get_attendance_rule()` dan `get_attendance_radius()` — canonical resolver terstruktur. |
| `api/checkin_self.php` | Ganti blok rule+radius manual dengan resolver canonical (radius per-role menang). |
| `api/scan_process.php` | Ganti query rule manual dengan `get_attendance_rule()` — perilaku identik. |
| `guru/absen.php` | Radius UI dari `get_attendance_radius($user['role_code'])` — sinkron dgn server. |
| `siswa/absen.php` | Radius UI dari `get_attendance_radius($user['role_code'])` — sinkron dgn server. |
| `admin/settings.php` | Label "Batas Radius Default" + keterangan fallback per-role. |
| `docs/ATTENDANCE_SETTINGS_MAPPING.md` | **Baru (berkas ini).** |
| `docs/IMPLEMENTATION_ROADMAP.md` | Risiko #2 (radius) diperbarui → CLOSED oleh P0.4. |
| `docs/CHANGELOG.md` | Entry P0.4. |

**TIDAK dihapus/dimigrasi:** `school_settings.time*`, `school_settings.radiusMeters`,
`schools.radius_meters`, `attendance_rules.allow_late/days_of_week` — tetap ada
sebagai fallback/legacy/placeholder sesuai tabel §5.

---

## 8. Test

- `php -l` seluruh file diubah → `0 errors`.
- Smoke test CLI vs DB `hadir_tadz`:
  - School 1: rule `siswa` radius 150, rule `guru` radius 200 →
    `get_attendance_radius('guru',150,1)=200`, `get_attendance_radius('siswa',150,1)=150`
    (rule spesifik role menang; per-role konsisten ver server).
  - School 2: **tanpa rule** → fallback `schools.radius_meters=200`
    (`get_attendance_radius('guru'|'siswa',150,2)=200`) — rantai fallback
    rule → school_settings → schools terbukti.
  - Role tak dikenal → fallback default (`>= 1`) aman.
- Rantai fallback tervalidasi 10/10 PASS.
- HTTP: self-checkin guru di sekolah dengan rule radius > default → diterima
  & UI menampilkan radius yang sama (client memakai resolver yang sama).