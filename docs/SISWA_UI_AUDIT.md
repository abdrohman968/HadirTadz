# SISWA UI AUDIT — HadirTadz

**Date:** 22 Agustus 2026  
**Scope:** Full audit of all 5 siswa pages before Design System rollout (P3.4A)  
**Status:** AUDIT ONLY — no code changes

---

## 1. Page Inventory

| File | Fungsi | Lines | Existing DS | Custom UI | Action |
|------|--------|-------|-------------|-----------|--------|
| `siswa/index.php` | Dashboard siswa — banner, status hari ini, QR snapshot, counter bulanan | 199 | status_badge() | Welcome banner, stat cards, QR code, monthly counters | LEAVE AS-IS |
| `siswa/absen.php` | Absensi mandiri GPS + kamera selfie | 242 | ds_page_header(), status_badge() | GPS status card, camera viewport, check-in/out buttons | LEAVE AS-IS |
| `siswa/izin.php` | Pengajuan izin/sakit + riwayat | 178 | ds_page_header(), status_badge() | Error alert (inline), form fields (inline), submit button (inline), history cards | MIGRATE (error, form, button) |
| `siswa/riwayat.php` | Riwayat kehadiran bulanan | 110 | ds_page_header() ✅ | Summary counters, table (already table-responsive-card) | MIGRATE (fix ds_page_header bug only) |
| `siswa/kartu.php` | Kartu pelajar digital + QR code | 102 | status_badge() | Dark page, ID card layout, QR code, print button | LEAVE AS-IS |

---

## 2. Detailed Audit Per Page

### 2.1 siswa/index.php — Dashboard (LEAVE AS-IS)

**Rationale:** Same pattern as `guru/index.php` (Phase 4). All layouts are role-specific and don't match existing DS components.

| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| Welcome banner | 59-82 | Custom gradient card | Role-specific (student greeting, NISN, class, homeroom teacher) |
| Today's status | 88-134 | Custom card | Domain-specific (conditional: attended / not attended) |
| Digital ID snapshot | 137-160 | Custom gradient card | Domain-specific (QR code, student info) |
| Monthly counters | 164-181 | Custom 4-card grid | Same pattern as guru/riwayat — already documented as candidate #7 |
| QR Code JS | 186-197 | QRCode library | Domain-specific |
| ds_page_header() | Not used | Banner IS the header | Consistent with guru/index.php |
| status_badge() | 99 | Domain helper | Keep |

**Forcing `ds_card_start/end` would break:** custom stat card structure, gradient banner, QR code layout.

---

### 2.2 siswa/absen.php — GPS/Camera Selfie (LEAVE AS-IS)

**Rationale:** Domain-specific UI with GPS, camera, and API interaction. Same pattern as `guru/absen.php`.

| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| ds_page_header() | 28 | ✅ Already migrated | Keep |
| GPS status card | 33-47 | Domain-specific | Dynamic JS-driven state changes |
| Camera fallback | 50-61 | Domain-specific | Camera error handling |
| Selfie camera preview | 64-70 | Domain-specific | `<video>` + `<canvas>` |
| Action buttons | 73-89 | Domain-specific | GPS+camera check-in/out, disabled until GPS valid |
| All JS | 97-240 | Domain-specific | GPS distance calc, camera init, API call |

---

### 2.3 siswa/izin.php — Permission Request (MIGRATE)

**Rationale:** Contains inline error alert, form fields, and submit button that should use DS components.

| Component | Lines | Status | Action |
|-----------|-------|--------|--------|
| ds_page_header() | 69 | ✅ Already migrated | Keep |
| Error alert | 72-74 | Inline HTML `<div>` | → `ds_alert($error, 'danger')` |
| Form card | 78-124 | Custom card with icon header | Keep (custom layout with h3 header) |
| Type select | 88-95 | Inline `<select>` with label | → `ds_select()` |
| Start date | 97-98 | Inline `<input type="date">` with label | → `ds_input('date')` |
| End date | 101-102 | Inline `<input type="date">` with label | → `ds_input('date')` |
| Reason textarea | 107-108 | Inline `<textarea>` with label | → `ds_textarea()` |
| File upload | 112-114 | Inline `<input type="file">` with label | Keep (file input, no DS component) |
| Submit button | 118-121 | Inline `<button>` | → `ds_button('primary')` |
| History card | 127-173 | Custom card | Keep (custom layout) |
| Type badge | 143-145 | Inline styled `<span>` | Keep (domain-specific inline badge) |
| status_badge() | 149 | Domain helper | Keep |
| Rejection reason | 156-158 | Custom alert-like div | Keep |
| Attachment link | 164-166 | `<a>` navigation | Keep |

**Bug found:** None. All `htmlspecialchars()` properly applied.

---

### 2.4 siswa/riwayat.php — Attendance History (MIGRATE — fix bug only)

**Rationale:** Same as `guru/riwayat.php` (Phase 2). Fix broken PHP short echo tag in ds_page_header() action slot.

| Component | Lines | Status | Action |
|-----------|-------|--------|--------|
| ds_page_header() | 35 | ✅ Migrated — BUT has bug | Fix `<?= htmlspecialchars($month) ?>` in single-quoted string |
| Summary counters | 38-55 | Custom 4-card grid | Keep (same as guru/riwayat) |
| Table | 58-105 | table-responsive-card + data-label | Already correct |
| status_badge() | 91 | Domain helper | Keep |
| Empty state | 73-76 | Custom text | Keep |

**Bug found:** Line 35 — `<?= htmlspecialchars($month) ?>` inside single-quoted string passed to `ds_page_header()`. PHP short echo tag not executed. Same bug as `guru/riwayat.php` Phase 2.

---

### 2.5 siswa/kartu.php — Digital Student Card (LEAVE AS-IS)

**Rationale:** Unique dark-themed page with QR code, school branding, print-optimized layout. No DS components match.

| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| Dark background | 29 | `bg-slate-900` | Unique theme, not standard app |
| ID card | 39-76 | Custom gradient card | Domain-specific (school branding, QR, student info) |
| Print button | 79-82 | Inline `<button>` with `window.print()` | Print-specific, not generic |
| QR Code JS | 89-100 | QRCode library | Domain-specific |

---

## 3. Summary

### Migration Scope

| Page | Action | Components to Migrate |
|------|--------|----------------------|
| siswa/index.php | LEAVE AS-IS | None |
| siswa/absen.php | LEAVE AS-IS | None |
| siswa/izin.php | MIGRATE | ds_alert, ds_select, ds_input (×2), ds_textarea, ds_button |
| siswa/riwayat.php | MIGRATE (bug fix) | Fix ds_page_header() month value bug |
| siswa/kartu.php | LEAVE AS-IS | None |

### Security (All Pages)

| Check | Result |
|-------|--------|
| require_auth(['siswa']) | ✅ All 5 pages |
| school_id server-scoped | ✅ All queries use $user['id'] |
| No client-controlled school_id | ✅ No $_GET/$_POST used for school_id |
| htmlspecialchars() on output | ✅ All user data escaped |
| status_badge() domain helper | ✅ Preserved on all pages |

### Responsive

| Check | Result |
|-------|--------|
| table-responsive-card + data-label | ✅ riwayat.php, index.php (counters use grid) |
| No horizontal overflow | ✅ All pages use max-w-* containers |
| Mobile-friendly buttons | ✅ flex-wrap on action buttons |
| Camera viewport responsive | ✅ aspect-video/aspect-[4/3] with max-w-md |

### Accessibility

| Check | Result |
|-------|--------|
| Labels for all inputs | ✅ izin.php has proper label/for/id pairs |
| Heading hierarchy | ✅ h1 → h3 → h4 consistent |
| Status semantics | ✅ status_badge() provides semantic HTML |
| Focus states | ✅ All inputs have focus:ring-2 |
| Contrast | ✅ text-slate-500 on white (~5.3:1) |

---

## 4. Recommended P3.4B Rollout Order

1. `siswa/izin.php` — Form fields migration (ds_alert, ds_select, ds_input, ds_textarea, ds_button)
2. `siswa/riwayat.php` — Bug fix only (ds_page_header month value)

**Not migrating:** siswa/index.php, siswa/absen.php, siswa/kartu.php (all domain-specific)

---

## 5. DS Candidates

| Pattern | Location | Status |
|---------|----------|--------|
| Summary Counter Cards | siswa/index.php, siswa/riwayat.php | Already documented (#7 in DESIGN_SYSTEM_CANDIDATES.md) |
| Permission Type Badge | siswa/izin.php | Simple inline `<span>` — not worth abstracting |
| GPS Status Card | siswa/absen.php | Domain-specific — not reusable |
| Student ID Card | siswa/kartu.php | Domain-specific — not reusable |
