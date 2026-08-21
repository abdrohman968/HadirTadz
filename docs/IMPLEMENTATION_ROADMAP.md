# IMPLEMENTATION ROADMAP — HADIR-TADZ

**Tanggal:** 20 Agustus 2026
**Referensi:** `PROJECT_BASELINE.md` (item 18), `OPENCODE_MASTER_SYNC_PROMPT.md` (item 25)

Prinsip:

```text
P0 stabilization
  ↓
P1 auth/signup
  ↓
P2 UI/dashboard/attendance
  ↓
P3 polish/performance
```

Setiap perubahan mengikuti workflow: INSPECT → PROVE → ROOT CAUSE → PATCH
MINIMALLY → TEST → REVIEW DIFF → REPORT.

---

## PRASEJARAT — Audit (Selesai)

Dokumen audit yang wajib dihasilkan task pertama:

- [x] `docs/TENANT_ISOLATION_AUDIT.md`
- [x] `docs/DATA_INTEGRITY_AUDIT.md`
- [x] `docs/BUG_INVENTORY.md`
- [x] `docs/IMPLEMENTATION_ROADMAP.md` (ini)

---

## FASE 1 — P0 Stabilization (✅ Selesai — 20 Agustus 2026)

### 1.1 Tenant Isolation — Attendance paths (✅ Selesai)
Semua item di bawah telah diterapkan dan lolos `php -l` (39 file) + smoke test
DB (query tenant-scoped mengembalikan data per sekolah; 37 record attendance
lama terkonfirmasi berada pada `school_id=1` — konsisten dengan temuan default).
1. `admin/rules.php` — scope SELECT/INSERT/UPDATE dengan `school_id`. ✅
2. `api/checkin_self.php` — rule lookup tenant-aware + `school_id` pada INSERT
   & UPDATE attendance. ✅
3. `api/scan_process.php` — resolve `school_id` sebelum rule lookup; scope rule;
   `school_id` pada log CHECK_OUT; scope UPDATE. ✅
4. Jalur attendance lain:
   - `admin/attendance.php` — classes/users/attendance list + UPDATE/DELETE/INSERT ✅
   - `admin/index.php` — counts, stats, pending permissions, recent attendance ✅
   - `admin/reports.php` — laporan & ekspor CSV ✅
   - `api/stats.php` — stats + validasi role admin ✅
   - `scan.php` — feed riwayat kiosk ✅
   - `admin/permissions.php` — INSERT attendance dengan `school_id` ✅
   - `guru/kelas.php` — INSERT attendance dengan `school_id` + scope kelas/siswa ✅

### 1.2 Attendance Source of Truth (✅ Selesai — 21 Agustus 2026, P0.4)
Dokumentasi lengkap: `docs/ATTENDANCE_SETTINGS_MAPPING.md` (matriks
`Parameter | Current Source | Canonical Source | Consumers | Migration Needed`).
- **Canonical source ditetapkan:** `attendance_rules` = aturan absensi
  terstruktur (waktu, telat, pulang cepat, radius per-role);
  `school_settings` = konfigurasi umum (profil + koordinat GPS + radius
  default fallback). `schools.*` hanya fallback via `get_setting()`.
- **Fix reader:** `api/checkin_self.php`, `api/scan_process.php` kini memakai
  resolver canonical `get_attendance_rule()`/`get_attendance_radius()`
  (baru di `config/helpers.php`). Bug tersembunyi UI↔server radius GPS
  (UI `guru/absen` & `siswa/absen` baca `school_settings.radiusMeters`
  sedangkan server memakai `attendance_rules.radius_limit`) diperbaiki:
  UI kini memakai `get_attendance_radius($role)` → klien & server satu suara.
- **Fix writer:** `admin/settings.php` — field radius dilabel ulang menjadi
  "Batas Radius Default" + keterangan per-role diatur di `admin/rules.php`.
- **Tanpa migrasi data:** `school_settings.time*` (timeInStart/timeInEnd/
  lateThreshold/timeOutStart) ditandai ORPHAN legacy (tidak pernah dibaca);
  `allow_late`/`days_of_week` placeholder kebijakan; semuanya dipertahankan.
- Verifikasi: `php -l` 0 error seluruh proyek; smoke test resolver radius
  (fallback rule `all` vs rule spesifik role) PASS.

### 1.3 Tenant Isolation — Master Data (✅ Selesai — 20 Agustus 2026, P0.2)
Bug-106 s/d Bug-109 ditutup. Seluruh CRUD master-data kini di-scope `school_id`
yang di-resolve dari sesi/auth; INSERT master-data eksplisit mengisi `school_id`.
1. `admin/students.php` — CRUD scoped + INSERT users/students berisi `school_id` ✅
2. `admin/teachers.php` — CRUD scoped + INSERT users/teachers berisi `school_id` ✅
3. `admin/classes.php` — INSERT berisi `school_id`; UPDATE/DELETE/join scoped ✅
4. `admin/journals.php` + `guru/jurnal.php` — list scoped; INSERT journals berisi
   `school_id`; validasi kelas milik sekolah ✅
5. `admin/cards.php` — classes & students scoped ✅
6. `admin/users.php` — reset password/status & list users scoped ✅
7. `siswa/izin.php` — INSERT permissions berisi `school_id` ✅
8. Verifikasi: `php -l` lolos (8 file), smoke test DB menegaskan data per sekolah
   benar; `guru/index.php`/`siswa/*`/`auth/profile.php` terkonfirmasi user-scoped.

### 1.4 Dokumen & Laporan
- `docs/LEGACY_DATA_MAPPING.md` dibuat — seluruh data legacy konsisten di
  `school_id=1`; tidak ada migrasi yang diperlukan saat ini.
- Update docs sesuai hasil patch (bagian "Status Implementasi").
- Laporan akhir: files changed, bug fixed, tests, remaining risks.

### 1.5 Kiosk Active School Context (✅ Selesai — 20 Agustus 2026, P0.3)
Dokumentasi lengkap: `docs/KIOSK_SCHOOL_CONTEXT.md`.
- Root cause BUG-105: `auth_school_id()` fallback `1` tanpa sesi →
  kiosk anonym selalu jelas ke sekolah 1.
- Mekanisme baru: tabel `kiosk_tokens` (token SHA-256 hash, terikat school),
  `scan.php` resolve `?k=TOKEN` (blocked state bila invalid/expired/revoked),
  `api/scan_process.php` validasi token + **cross-school rejection**,
  `admin/kiosk.php` untuk generate/revoke token, sidebar menu, seed token
  di `migrate.php`, auto-token di `auth/register_school.php`.
- Backward compat: kiosk tanpa token tetap jalan (konteks sesi/auth, default 1);
  token seed otomatis untuk semua sekolah aktif.
- Verifikasi: `php -l` 0 error seluruh proyek; smoke test CLI 10/10 PASS
  (7 skenario keamanan wajib: S1/S2 valid, cross-scan REJECT dua arah,
  token invalid REJECT, token expired REJECT, manipulasi `school_id` REJECT).

---

## FASE 2 — P1 Auth / Signup

### 2.1 Auth Security Audit (✅ Selesai — 21 Agustus 2026, P1.1)
Dokumentasi lengkap: `docs/AUTH_SECURITY_AUDIT.md`.
- **Session fixation (CRITICAL):** `session_regenerate_id(true)` ditambahkan
  setelah login sukses di `auth/login.php`.
- **Cookie flags:** `session_set_cookie_params()` di `config/database.php` —
  SameSite=Lax, HttpOnly=true, Secure otomatis.
- **Session hygiene:** `password_hash` tidak lagi disimpan di
  `$_SESSION['user_data']` (dihapus di `login.php` + `auth.php`).
- **Password input:** `trim()` dihapus dari password di `login.php` dan
  `register_school.php`.
- **Login error:** message sudah generic — tidak leak info "user ada/tidak ada."
- **Authorization:** semua halaman admin/guru/siswa sudah `require_auth([role])`;
  `api/stats.php` sudah cek admin role (BUG-201 closed).
- **Redirect:** tidak ada loop — semua redirect ke role-appropriate dashboard.
- **School context:** login set `school_id` dari DB user, tidak bisa dimanipulasi.
- Remaining risks: brute force (P2), session timeout (P2), password reset (P2).

### 2.2 Auth/Signup Follow-up

- BUG-101 / BUG-102 — generator school_code & identifier admin:
  `generate → check unique → retry → commit`.
- BUG-103 — ganti `role_id = 1` dengan lookup `roles.role_code = 'admin'`
  (backward-compatible).
- BUG-104 — email uniqueness: scan duplikat → tentukan rule → bersihkan →
  verifikasi referensi → migration.
- Auth/session cross-tenant: pastikan login tidak ambigu untuk identifier
  identik lintas sekolah (keputusan bisnis diperlukan).

### 2.3 School Signup Multi-Step (✅ Selesai — 21 Agustus 2026, P1.2)
Dokumentasi lengkap: `docs/SCHOOL_SIGNUP.md`.
- **UI multi-step:** form tunggal → 3-step wizard (Sekolah → Admin → Review)
  dengan step indicator, frontend validation per-step, loading state.
- **Layout:** desktop split (branding hijau + form) | mobile single column.
- **Success screen (Step 4):** ditampilkan di `login.php` via session —
  menampilkan nama sekolah, kode sekolah, jenjang, admin, username.
- **Backend preserved:** semua business logic identik (transaction, settings,
  rules, kiosk token). Terms checkbox + error handling yang disederhanakan.
- **Requirements gap:** field Kota/Provinsi/Kode Pos/NIK/NIP belum ada di schema;
  Terms/Privacy page masih placeholder.

### 2.4 Login UI/UX Redesign (✅ Selesai — 21 Agustus 2026, P1.3)
- **Design:** dark theme → white + green gradient (brand: #22C55E, #16A34A, #059669).
- **Layout:** desktop split (left green branding + right white login card) | mobile single column.
- **Left panel:** gradient, logo, tagline "Disiplin hari ini, sukses nanti.", feature cards.
- **Login card:** "Selamat Datang!" header, labeled inputs, green gradient button, forgot password, register CTA.
- **Auth logic untouched:** session_regenerate_id, password_verify, role detection, redirect.
- **Responsive:** 360px–1920px, no overflow. Accessibility: labels, aria, focus-visible.

### 2.5 Auth E2E QA (✅ Selesai — 21 Agustus 2026, P1.4)
- **Status:** PASS — 139/139 tests, 0 bugs.
- **Coverage:** signup → login → cross-tenant → kiosk → attendance → logout → session security → UI → DB integrity.
- **Script:** `tests/e2e_auth.php` (CLI, creates & cleans E2E test data automatically).
- **Production data:** Untouched. Test data uses `E2E-*` prefix.
- **No bugs found.** All critical flows verified.

### 3.1 School Data Model Enhancement (✅ Audit — 21 Agustus 2026, P2.1)
- **Status:** AUDIT + DESIGN + MIGRATION PLAN — no DB changes yet.
- **Requirement gaps identified:** 4 fields truly missing (city, province, postal_code, nik).
- **Existing reusable:** 12 fields already in schema (email, address, phone, etc.).
- **Normalization:** Address/location duplicated in `schools` + `school_settings` — canonical = `schools`.
- **Legal consent:** No terms/privacy page, no consent table, checkbox not stored — design documented.
- **Migration plan:** 4 ALTER TABLE + 1 CREATE TABLE, all nullable, zero data loss, reversible.
- **Risk:** LOW. See `docs/SCHOOL_DATA_MODEL_AUDIT.md`, `docs/SCHOOL_DATA_MIGRATION_PLAN.md`, `docs/LEGAL_CONSENT_REQUIREMENT.md`.

### 3.2 Safe School Profile DB Migration (✅ Selesai — 21 Agustus 2026, P2.2)
- **Status:** MIGRATION EXECUTED + REGRESSION PASS.
- **Schema:** `schools.city/province/postal_code` (varchar, NULL) + `users.nik`
  (varchar(30), NULL) + tabel `legal_consents` (FK schools/users, CASCADE).
- **Mechanism:** existing `ensure_column()` di `database/migrate.php` — idempotent
  (SHOW COLUMNS check sebelum ALTER). Tidak ada framework migrasi baru.
- **Idempotency:** migration dijalankan 2x — no duplicate error, exit 0.
- **Consent persistence:** `register_school.php` menyimpan 2 baris consent
  (terms+privacy v1.0, IP+UA) di dalam transaksi registrasi.
- **Existing data:** utuh (schools=2, users=9, dst.) — semua kolom baru NULL.
- **Regression:** php -l 41 files 0 errors; E2E P1.4 = 139/139 PASS;
  functional consent test 9/9 PASS.
- **Follow-up P2.3/P2.4:** input UI city/province/postal_code/nik di signup +
  admin settings; halaman terms/privacy.

### 3.3 School Profile & Signup Data Completion (✅ Selesai — 21 Agustus 2026, P2.3)
- **Signup:** Field baru city/province/postal_code (Step 1) + nik (Step 2) aktif.
  Server-side validation (max length). Review step + JS populated. Bug fixed:
  `schools.email/phone` kini menyimpan email/phone institusi, bukan admin.
- **Admin settings:** Profil Sekolah section baru — reads langsung dari `schools`
  (canonical). Fields: jenjang, kota, provinsi, kode pos, email/phone sekolah, logo.
  Tenant-scoped via `auth_school_id()`. Write-through sync legacy keys agar
  reader lama (cards, scan, header, guru/siswa absen) tetap sinkron.
- **Tests:** 49/49 P2.3 tests PASS; E2E 139/139 PASS; php -l 41 files 0 errors.
- **Docs:** `docs/SCHOOL_PROFILE.md` (profile schema, signup mapping, settings mapping).

### 3.4 Terms, Privacy & Legal Consent (✅ Selesai — 21 Agustus 2026, P2.4)
- **Version constants:** `TERMS_VERSION = '2026-08-21-v1'` and `PRIVACY_VERSION = '2026-08-21-v1'` defined in `config/helpers.php`.
- **Legal pages:** `terms.php` and `privacy.php` created at project root — public, no auth required, green/white design, version displayed in header.
- **Signup checkboxes:** Single `agree_terms` checkbox split into two separate checkboxes (`agree_terms` + `agree_privacy`), each with clickable link to its respective page (opens in new tab).
- **Backend validation:** PHP checks both `$_POST['agree_terms']` and `$_POST['agree_privacy']`. JS `validateStep(3)` checks both. Error message updated.
- **Consent inserts:** Use `TERMS_VERSION` / `PRIVACY_VERSION` constants (no hardcoded `'1.0'`). Two rows inserted per registration, inside transaction.
- **Admin consent viewer:** `admin/consents.php` — tenant-scoped table showing user, type, version, IP, timestamp. Paginated 20/page. Added to sidebar under "Laporan & Sistem".
- **Tests:** php -l 44 files 0 errors; E2E 139/139 PASS.
- **Docs:** `docs/LEGAL_CONSENT_REQUIREMENT.md` updated to COMPLETE status.

---

## FASE 3 (DISARANKAN SETELAH P0) — P2 UI/Dashboard/Attendance

- Dashboard per role refinement (data sudah tenant-safe).
- Master data refinement (tenant isolation master-data telah dibereskan di
  P0.2 — sisa tinggal UX/polish).
- Attendance UX refinement.
- Reports/monitoring refinement.

---

## FASE 4 — P3 Polish

- API error handling tanpa expose SQL raw (BUG-202).
- Konsolidasi helper duplikat (BUG-203).
- Hapus `console.log` debug (BUG-204).
- Performance, accessibility, visual polish sesuai `docs/DEVELOPMENT_RULES.md`.

---

## Definition of Done (dari PROJECT_BASELINE.md)

- existing feature tidak rusak
- tenant isolation aman
- tidak ada duplicate route/component baru
- tidak ada duplicate data baru akibat perubahan
- error utama diperbaiki
- responsive desktop/mobile (tidak berubah di task P0 ini — dipastikan tidak
  menurun)
- auth & role tetap benar
- DB transaction aman
- lint PHP lolos
- smoke test lolos
- laporan lengkap (TASK RESULT) diserahkan

---

## Risiko Tersisa (setelah FASE 1 + P0.2 + P0.3 + P0.4)

1. ~~Kiosk belum punya pemilih sekolah aktif~~ → **SELESAI (P0.3)** dengan
   mekanisme Kiosk Token (`docs/KIOSK_SCHOOL_CONTEXT.md`). Tersisa: token di
   URL terlihat di history browser — untuk produksi ketat ikat token di
   server/session.
2. ~~Konsolidasi radius/waktu UI (source of truth bertumpuk)~~ → **SELESAI
   (P0.4)** — canonical source radius = `attendance_rules.radius_limit`,
   fallback `school_settings.radiusMeters`/`schools.radius_meters`; semua
   reader memakai resolver `get_attendance_radius()`.
   Tersisa (keputusan business, opsional): migrasi nilai `radiusMeters`
   lama ke `radius_limit`, dan konsolidasi form radius/waktu tunggal.
3. Identik identifier lintas sekolah berpotensi ambigu saat login (perlu
   kebijakan identifier global).
4. Migrasi/dupikasi data legacy (seluruhnya di `school_id=1`) menunggu approval
   bisnis — lihat `docs/LEGACY_DATA_MAPPING.md`.