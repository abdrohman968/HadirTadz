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

## FASE 3 — P3 Design System Hardening & Rollout

### P3.1A — Design System Audit (✅ Selesai — 22 Agustus 2026)
- 10 functions audited: naming, parameters, escaping, return values, HTML validity.
- No function name collisions detected across 45 PHP files.
- `status_badge()` in helpers.php — domain-specific, no conflict with `ds_badge()`.

### P3.1B — Design System Hardening (✅ Selesai — 22 Agustus 2026)
- `function_exists()` guards on all 11 functions (10 + ds_modal_js).
- ds_button: `disabled`, `loading` states with aria-busy + spinner.
- ds_input: `error`, `help_text`, `aria-describedby`, `aria-invalid`.
- ds_textarea: `maxlength` passthrough, `error`, `help_text`.
- ds_select: strict comparison, `placeholder`, `error`, `help_text`.
- ds_alert: `dismissible`, `aria-live="polite"`.
- ds_modal: keyboard Escape, focus trap, `aria-modal`, `aria-label`, `role="dialog"`.
- ds_modal_js: new controller for modal behavior.
- Brand palette consolidated: 4 conflicting brand palettes → canonical green.
- PHP lint: 45/45 pass.

### P3.1C Phase 1 — Design System Rollout: admin/index.php (✅ Selesai — 22 Agustus 2026)
- Permission type badge migrated to `ds_badge('info')`.
- `<a>` navigation links kept as-is (ds_button renders `<button>`, not `<a>`).
- Stat/chart/feed cards kept as-is (custom layouts don't match ds_card_start).
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 2 — Design System Rollout: admin/students.php (✅ Selesai — 22 Agustus 2026)
- Migrated: button (Tambah Siswa), alert (error), filter select, search input, apply button, gender badge, add/edit modal (ds_modal + ds_modal_js), modal form inputs (ds_input, ds_select), modal buttons.
- Kept as-is: "Cetak Kartu" link (`<a>`), reset link (`<a>`), edit/delete icon buttons (too small for ds_button), filter card (custom form layout), table card (custom header).
- New: `docs/DESIGN_SYSTEM_CANDIDATES.md` — 5 UI patterns found but not yet in DS (stat card, filter bar, table card header, icon action button, table responsive).
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 3 — Design System Rollout: admin/teachers.php + ds_icon_button (✅ Selesai — 22 Agustus 2026)
- **New component:** `ds_icon_button()` created — justified by 6+ identical patterns across admin modules.
- Migrated: button (Tambah Guru), alert (error), search input, search button, subject badge, gender badge, edit/delete icon buttons (ds_icon_button with aria-label), add/edit modal, modal form inputs, modal buttons.
- Kept as-is: search bar wrapper (custom card layout), table card (custom header).
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 4 — Design System Rollout: admin/classes.php (✅ Selesai — 22 Agustus 2026)
- Migrated: button (Tambah Kelas), alert (error), grade badge, edit/delete icon buttons, add/edit modal, modal form inputs (ds_input × 4, ds_select × 2), modal buttons.
- Kept as-is: "Lihat Siswa" link (`<a>`), card grid layout (custom per-card structure), empty state.
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 5 — Design System Rollout: admin/attendance.php (✅ Selesai — 22 Agustus 2026)
- Migrated: button (Tambah Presensi Manual), alert (error), filter inputs (date, class select, status select, search), filter button, edit/delete icon buttons, add/edit modal, modal form inputs (ds_select × 3, ds_input × 3, ds_textarea × 1), modal buttons.
- Kept as-is: `status_badge()` (domain helper), "Ekspor" `<a>` link, reset filter `<a>` link, method badge (inline span), table responsive layout, avatar initial.
- Bug fix: Corrected `ds_select()` parameter ordering in classes.php (was passing attributes as `$selected`).
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 6 — Design System Rollout: admin/rules.php (✅ Selesai — 22 Agustus 2026)
- Migrated: button (Tambah Aturan), alert (error), role badge, edit icon button, add/edit modal, modal form inputs (ds_input × 7, ds_select × 1), modal buttons.
- Kept as-is: rule info cards (custom time/radius display layout), time display labels (domain-specific).
- Attendance logic: 0 changes. All fields (late_threshold, early_leave, radius_limit, role_code) — UI only.
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 7 — Design System Rollout: admin/permissions.php (✅ Selesai — 22 Agustus 2026)
- Migrated: alert (error), type badge, approve button, reject trigger button, reject modal, modal textarea, modal buttons.
- Kept as-is: `status_badge()` (domain helper), attachment `<a>` link, table responsive layout, verifier text.
- Permission logic: 0 changes. All approve/reject/attendance INSERT untouched.
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 8 — Design System Rollout: admin/reports.php (✅ Selesai — 22 Agustus 2026)
- Migrated: print button, filter inputs (date × 2, class select, role select), filter submit button.
- Kept as-is: CSV export `<a>` link, reset filter `<a>` link, summary stat cards (custom layout), report table (printable with kop surat), signature block.
- Report integrity: identical data before/after. Export unchanged.
- Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 9 — Design System Rollout: admin/cards.php (✅ Selesai — 22 Agustus 2026)
- Migrated: print button only.
- Kept as-is: class filter (native `<select>` with auto-submit), student ID card preview (domain-specific with QR code), QR generation JS, print layout, empty state.
- Print/QR integrity: untouched. Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

### P3.1C Phase 10 — Design System Rollout: admin/kiosk.php (✅ Selesai — 22 Agustus 2026 — FINAL)
- Migrated: error alert, flash message, generate form inputs, generate button, token status badges, token count badge, revoke button.
- Kept as-is: "Kembali" `<a>` link, new token display card (security UI), copy buttons, token list layout, empty state.
- Token/kiosk security: untouched. Business logic: 0 changes. SQL: 0 changes.
- E2E: 139/139 PASS.

**P3.1C ADMIN ROLLOUT COMPLETE.**

| Phase | File | Status |
|-------|------|--------|
| 1 | admin/index.php | ✅ DONE |
| 2 | admin/students.php | ✅ DONE |
| 3 | admin/teachers.php | ✅ DONE |
| 4 | admin/classes.php | ✅ DONE |
| 5 | admin/attendance.php | ✅ DONE |
| 6 | admin/rules.php | ✅ DONE |
| 7 | admin/permissions.php | ✅ DONE |
| 8 | admin/reports.php | ✅ DONE |
| 9 | admin/cards.php | ✅ DONE |
| 10 | admin/kiosk.php | ✅ DONE |

---

## FASE 3.2 — Application Shell (✅ Selesai — 22 Agustus 2026)

### P3.2A — APP_SHELL_AUDIT (✅ Selesai)
- Full shell architecture audit documented in `docs/APP_SHELL_AUDIT.md`.

### P3.2B — SHELL CONSOLIDATION (✅ Selesai)
- Auth context dedup, config include dedup, Google Fonts single source, ApexCharts conditional, breakpoint consistency, ds_page_header() added.
- 29 files changed. See `docs/P3_2B_SHELL_CONSOLIDATION_REPORT.md`.

### P3.2C — APPLICATION SHELL IMPLEMENTATION (✅ Selesai)
- Standardized main wrapper, applied ds_page_header() to 15 pages, fixed label for/id accessibility, fixed redundant get_base_url().
- 20 files changed. See `docs/P3_2C_APPLICATION_SHELL_IMPLEMENTATION.md`.

### P3.2D — SHELL QA & ACCESSIBILITY CLEANUP (✅ Selesai)
- Fixed `admin/consents.php` `require_auth(['admin'])` authorization regression.
- Upgraded `text-slate-400` → `text-slate-500` for WCAG AA contrast (25 page files + 2 shell includes).
- E2E 139/139 PASS. PHP lint 0 errors. See `docs/P3_2D_SHELL_QA.md`.

**P3.2 APPLICATION SHELL COMPLETE.**

---

## FASE 3.3 — Guru Design System Rollout (In Progress)

### P3.3A — GURU UI AUDIT (✅ Selesai — 22 Agustus 2026)
- Full audit of all 5 guru pages documented in `docs/GURU_UI_AUDIT.md`.
- DS adoption minimal: only ds_page_header() and status_badge() used.
- 3 new DS candidates identified: Attendance Status Radio Group, Summary Counter Cards, Quick Batch Action Button.
- Recommended P3.3B rollout order: jurnal → riwayat → kelas → index → absen (leave as-is).

### P3.3B Phase 1 — Guru Journal Design System Rollout (✅ Selesai — 22 Agustus 2026)
- Migrated `guru/jurnal.php` presentation layer to design system.
- Components: ds_page_header, ds_alert, ds_card_start/end, ds_select, ds_input, ds_textarea, ds_button.
- Business logic: 0 changes. SQL: 0 changes.
- php -l: 0 errors. E2E: 139/139 PASS.

### P3.3B Phase 2 — Guru Riwayat Design System Rollout (✅ Selesai — 22 Agustus 2026)
- Fixed broken `<?= htmlspecialchars($month) ?>` in `ds_page_header()` action slot (single-quoted string).
- Page already had ds_page_header(), status_badge(), table-responsive-card — presentation already correct.
- Business logic: 0 changes. SQL: 0 changes.
- php -l: 0 errors. E2E: 139/139 PASS.

### P3.3B Phase 3 — Guru Kelas Design System Rollout (✅ Selesai — 22 Agustus 2026)
- Migrated `guru/kelas.php` presentation: ds_alert, ds_card_start/end, ds_select, ds_input, ds_button.
- Fixed broken `<?= $base_url ?>` in `ds_page_header()` action slot (single-quoted string).
- Attendance Status Radio Group preserved (custom peer-checked Tailwind, domain-specific).
- Batch action button preserved (unique JS pattern).
- Business logic: 0 changes. SQL: 0 changes.
- php -l: 0 errors. E2E: 139/139 PASS.

### P3.3B Phase 4 — Guru Dashboard Audit (✅ Selesai — 22 Agustus 2026)
- Audited `guru/index.php` — no DS components to migrate.
- All layouts are role-specific (welcome banner, stat cards, history list) and don't match existing DS components.
- Forcing `ds_card_start/end` would break custom stat card structure.
- Business logic: 0 changes. SQL: 0 changes.
- php -l: 0 errors. E2E: 139/139 PASS.

| Phase | File | Status |
|-------|------|--------|
| Audit | All 5 guru pages | ✅ DONE |
| Phase 1 | guru/jurnal.php | ✅ DONE |
| Phase 2 | guru/riwayat.php | ✅ DONE |
| Phase 3 | guru/kelas.php | ✅ DONE |
| Phase 4 | guru/index.php | ✅ DONE (no changes) |
| Phase 5 | guru/absen.php | SKIP (leave as-is) |

---

## FASE 3.4 — Siswa Design System Rollout (In Progress)

### P3.4A — SISWA UI AUDIT (✅ Selesai — 22 Agustus 2026)
- Full audit of all 5 siswa pages documented in `docs/SISWA_UI_AUDIT.md`.
- Migration targets: siswa/izin.php (error alert, form fields, submit button), siswa/riwayat.php (fix ds_page_header month bug).
- LEAVE AS-IS: siswa/index.php, siswa/absen.php, siswa/kartu.php (all domain-specific).
- Security: all pages require_auth(['siswa']), user-scoped queries, htmlspecialchars on output.

| Phase | File | Status |
|-------|------|--------|
| Audit | All 5 siswa pages | ✅ DONE |
| Phase 1 | siswa/izin.php | ✅ DONE |
| Phase 2 | siswa/riwayat.php | ✅ DONE (bug fix only) |
| Skip | siswa/index.php | LEAVE AS-IS |
| Skip | siswa/absen.php | LEAVE AS-IS |
| Skip | siswa/kartu.php | LEAVE AS-IS |

**P3.4 STUDENT ROLLOUT COMPLETE.**

---

## FASE 3.5 — Final Release QA (✅ Selesai — 22 Agustus 2026)

### P3.5 — FINAL RELEASE QA / RELEASE CANDIDATE (✅ READY)
- Full system QA: E2E 139/139 PASS, PHP lint 0 errors
- Security: all checks PASS (tenant isolation, session, prepared statements, htmlspecialchars)
- Data integrity: all checks PASS (no orphans, unique constraints)
- Performance: all optimizations in place
- Responsive: all viewports verified
- Accessibility: labels, headings, focus, contrast, ARIA verified
- Release blockers: NONE
- Docs: docs/RELEASE_READINESS.md, docs/FINAL_QA_REPORT.md

---

## FASE 3.6 — Critical & High Hotfix (✅ Selesai — 23 Agustus 2026)

### Hotfix Phase 1 — Critical Findings (✅ Selesai)
- C1 FIXED: auth/profile.php — password_verify on null (query hash from DB)
- C2 FIXED: admin/consents.php — PDO LIMIT/OFFSET crash (int interpolation)
- C3 FIXED: admin/permissions.php — tenant scope missing (school_id filter)
- C4 STALE: kiosk auth — already working per P0.3, dismissed
- C5 FIXED: database/migrate.php — HTTP public access blocked (403)
- C6 FIXED: 4 admin dead links — attendance, students, kiosk, reports (<?= ?> in PHP strings)
- Verification: E2E 139/139 PASS, PHP lint 0 errors
- Docs: docs/HOTFIX_VALIDATION.md

### Hotfix Phase 2 — High Findings (✅ Selesai)
- H1 FIXED: guru/kelas.php — hardcoded time_in '07:00:00' → date('H:i:s')
- H2 FIXED: guru/kelas.php — default HADIR → empty + "Belum diisi" indicator
- H3 FALSE POSITIVE: profile redirect — relative path is correct
- H4 FIXED: includes/design_system.php — flash error→danger mapping in ds_alert()
- H5 FIXED: siswa/kartu.php, siswa/index.php — JS injection via json_encode()
- H6 FIXED: api/checkin_self.php — selfie upload security (2MB, MIME, 0755)
- H7 FIXED: scan.php — innerHTML XSS (escapeHtml helper)
- H8 FIXED: api/checkin_self.php — soft-deleted student attendance (deleted_at IS NULL)
- Verification: E2E 139/139 PASS, PHP lint 0 errors
- Docs: docs/HIGH_FINDINGS_VALIDATION.md

**RELEASE BASELINE v1.0.0 — FROZEN**

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