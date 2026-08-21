# KIOSK ACTIVE SCHOOL CONTEXT (P0.3) — HADIR-TADZ

**Tipe tugas:** P0 Stabilization — Kiosk Active School Context
**Tanggal:** 20 Agustus 2026
**Status:** ✅ Selesai
**Referensi:** `docs/TENANT_ISOLATION_AUDIT.md`, `docs/BUG_INVENTORY.md` (BUG-105), `docs/IMPLEMENTATION_ROADMAP.md` (risiko #1)

---

## 1. Masalah

Kiosk presensi (`scan.php` / `api/scan_process.php`) adalah halaman **anonym**
(tanpa sesi login). `auth_school_id()` di `config/helpers.php` mengembalikan
`1` bila tidak ada sesi — akibatnya:

- Feed "Riwayat Terkini Hari Ini" pada kiosk selalu menampilkan data **Sekolah 1**
  di semua perangkat kiosk.
- Kiosk **tidak memiliki konteks sekolah eksplisit** — tidak bisa membedakan
  kiosk milik SMA Negeri Harapan Bangsa vs SMK Informatika Mandiri.
- `school_id` default hardcoded `1` dipakai sebagai *authority* bila tak ada sesi.

**Konteks task:** kiosk TIDAK boleh diarahkan oleh `school_id` dari URL/JSON
(khususnya `?school_id=` / `school_id` di body), karena itu dapat dimanipulasi
klien. Konteks sekolah kiosk WAJIB berasal dari identitas kiosk yang
terverifikasi server-side.

## 2. Hasil Audit Mekanisme Existing

Sebelum desain, seluruh `*.php` di-scan untuk mekanisme kiosk yang sudah ada:
`kiosk token`, `scanner token`, `device registration`, `kiosk identifier`,
`signed URL`, `session key`, `school_code`. Hasilnya:

| Mekanisme | Ada? | Keterangan |
|-----------|------|------------|
| Kiosk token / scanner token | ❌ | Tidak ada |
| Device registration | ❌ | Tidak ada |
| Kiosk identifier | ❌ | Tidak ada |
| Signed URL | ❌ | Tidak ada |
| `schools.school_code` | ✅ | unique, NOT NULL — tapi bukan kredensial |
| `schools.is_active` | ✅ | Status sekolah |
| `auth_school_id()` fallback `1` | ✅ | `config/helpers.php` — **root cause** |

Karena tidak ada mekanisme existing yang bisa di-reuse sebagai identitas kiosk,
mekanisme **Kiosk Token** dibuat minimal & kompatibel.

## 3. Mekanisme yang Dipilih: Kiosk Token (Perangkat)

Setiap perangkat kiosk memiliki **token unik** yang terikat ke satu sekolah.

```
Kiosk Device → Token (?k=TOKEN) → validate kiosk_tokens (server-side)
                                    ↓
                          school_id terikat (trusted identity)
                                    ↓
                        Semua query & scan di-scope school_id tersebut
```

### Desain keamanan

- **Token disimpan sebagai SHA-256 hash** (`token_hash CHAR(64)`) di tabel
  `kiosk_tokens`. Token mentah TIDAK pernah disimpan di DB — hanya ditampilkan
  sekali saat generate di `admin/kiosk.php` (dan di-print saat `migrate.php`
  untuk token seed kompatibilitas).
- **Authority = token terverifikasi.** `school_id` dari URL/JSON/browser
  TIDAK pernah dijadikan authority. `scan.php` dan `api/scan_process.php`
  hanya memakai `school_id` hasil validasi token (atau konteks sesi/auth
  pada jalur legacy).
- **Cross-school rejection:** kartu/user yang di-scan WAJIB milik sekolah
  yang sama dengan kiosk. Scan lintas sekolah → ditolak (log audit
  `KIOSK_CROSS_SCHOOL_REJECT`).
- **Expiry:** kolom `expires_at` opsional; token dimatikan setelah lewat
  batas (dikembalikan `TOKEN_EXPIRED`).
- **Revoke:** status `active` / `revoked`; token dicabut akan ditolak.

## 4. Perubahan Basis Data

### Tabel baru: `kiosk_tokens`

```sql
CREATE TABLE IF NOT EXISTS `kiosk_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,          -- FK -> schools.id (ON DELETE CASCADE)
  `token_hash` char(64) NOT NULL,                -- SHA-256 token mentah
  `device_name` varchar(100) NOT NULL DEFAULT 'Kiosk Gerbang',
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `expires_at` datetime DEFAULT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token_hash` (`token_hash`),
  KEY `fk_kiosk_tokens_school` (`school_id`)
)
```

Didefinisikan di `database/schema.sql` (seksi 14) dan `database/migrate.php`.

### Token seed (backward compatibility)

`migrate.php` memastikan setiap sekolah `is_active=1` memiliki minimal satu
token kiosk aktif. Saat migrate dijalankan:

```
[KIOSK] Token kiosk `SMA Negeri Harapan Bangsa` (school_id=1) => scan.php?k=KTK-...
[KIOSK] Token kiosk `SMK Informatika Mandiri` (school_id=2) => scan.php?k=KTK-...
```

## 5. Perubahan File

| File | Perubahan |
|------|-----------|
| `config/helpers.php` | Prioritas `$_SESSION['kiosk_school_id']` pada `auth_school_id()`; fungsi baru `kiosk_validate_token()`, `kiosk_bind_context()`, `kiosk_context()`, `kiosk_generate_token()`, `kiosk_revoke_token()`. |
| `database/schema.sql` | Tambah tabel `kiosk_tokens`. |
| `database/migrate.php` | Tambah tabel `kiosk_tokens` + seeder token per sekolah (print token). |
| `scan.php` | Resolve konteks kiosk dari `?k=TOKEN`; bila token invalid/expired → tampilkan **blocked state** (bukan scanner); feed di-scope sekolah hasil resolve; kirim `kiosk_token` ke JS → `api/scan_process.php`. |
| `api/scan_process.php` | Terima `kiosk_token`; validasi token (REJECT bilamana invalid/revoked/expired); **cross-school rejection**; authority bukan `school_id` request. |
| `admin/kiosk.php` | **Baru.** Kelola token kiosk sekolah aktif: generate (tampilkan sekali), revoke, tampil URL kiosk + salin. |
| `includes/sidebar.php` | Menu admin **Kiosk Scanner** di grup "Laporan & Sistem". |
| `auth/register_school.php` | Setelah mendaftar sekolah, auto-generate 1 token kiosk (opsional; resilient bila tabel belum ada). |

### BUG yang ditutup

- **BUG-105** (`docs/BUG_INVENTORY.md`) — kiosk default ke sekolah 1 tanpa
  sesi login → **CLOSED** dengan mekanisme token + legacy path tetap kompatibel.

## 6. Skenario Keamanan (7 Wajib) — Hasil Test

Smoke test CLI meniru `scan_process` terhadap DB `hadir_tadz` (semua skenario PASS):

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | Kiosk S1, scan valid user S1 | ✅ Diterima, sekolah=S1 |
| 2 | Kiosk S2, scan valid user S2 | ✅ Diterima, sekolah=S2 |
| 3 | Cross-scan (user S1 di kiosk S2) | ✅ Ditolak (CROSS_SCHOOL) |
| 4 | Cross-scan (user S2 di kiosk S1) | ✅ Ditolak (CROSS_SCHOOL) |
| 5 | Token invalid | ✅ Ditolak (TOKEN_INVALID) |
| 6 | Token expired | ✅ Ditolak (TOKEN_EXPIRED) |
| 7 | Manipulasi `school_id` request | ✅ Authority tetap token; `scan_process.php` & `scan.php` TOG repost tidak membaca `school_id` dari input |
| Bonus | Kiosk tanpa token (legacy) + user S1 | ✅ Diterima — backward compat kiosk lama |

Tambahan: seluruh file PHP `php -l` → `0 errors` (lint level seluruh proyek).

## 7. Backward Compatibility

1. **Kiosk tanpa token (`scan.php`)** — konteks sekolah dari sesi/auth
   (`auth_school_id()`), default `1`. Ini menjaga kiosk yang sudah berfungsi dan
   jalur `api/scan_process.php` yang resolve `school_id` dari user tetap jalan.
2. **Token seed otomatis** saat migrate — kiosk baru langsung punya token untuk
   dimuat via `scan.php?k=...`.
3. **Delegasi immutable:** perubahan hanya menambah jalur; tidak menghapus
   kolom, tidak merubah login/signup secara substantif, dan tidak mengubah
   query tenant yang sudah benar dari P0.1/P0.2.

## 8. Risiko Tersisa

1. **Kiosk token di URL** (`?k=`): token terlihat pada history browser.
   Migrasi dari kartu/PWA tetap mungkin. Untuk penerapan tingkat tinggi,
   ikat token di server-side (session) dan jadikan URL generik menyimpan
   token di-server.
2. **Legacy tanpa token** tetap default ke sekolah 1. Disarankan semua kiosk
   produksi memakai token eksplisit agar tidak ambigu lintas sekolah.
3. Token mentah dicetak di log `migrate.php` dan flash message
   `auth/register_school.php` — hanya satu kali dan bersifat setup; di
   lingkungan produksi yang ketat, ganti mekanisme distribusi token.