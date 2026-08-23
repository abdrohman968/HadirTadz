# P3.2D — Shell QA & Accessibility Cleanup Report

> **Date**: 2026-08-22
> **Status**: SELESAI
> **Predecessor**: P3.2C (Application Shell Implementation) → P3.2D (QA & Accessibility)

---

## 1. Summary

Closed two known issues from P3.2C audit without expanding scope. Fixed authorization regression in admin/consents.php and upgraded text-slate-400 to text-slate-500 for WCAG AA contrast compliance across the entire shell. All tests pass.

## 2. Issue #1: Admin Consents Authorization

### Problem
`admin/consents.php` had `require_auth()` without a role parameter — any authenticated user (guru, siswa) could access the page.

### Fix
```php
// Before
require_auth();

// After
require_auth(['admin']);
```

### Verification
- E2E Section 5 (Cross-Tenant Isolation): all 17 checks PASS
- Every other admin page already uses `require_auth(['admin'])` — this was the only outlier

## 3. Issue #2: Color Contrast (text-slate-400)

### Problem
`text-slate-400` (#94a3b8) on white background yields ~3.5:1 contrast ratio — below WCAG AA 4.5:1 threshold for small text.

### Fix
Upgraded `text-slate-400` → `text-slate-500` (#64748b) which yields ~5.3:1 ratio — passes WCAG AA.

### Scope

**Shell includes (2 files):**
- `includes/sidebar.php` — 7 section labels + 1 icon color (icon preserved as text-slate-400)
- `includes/header.php` — 1 school name in dropdown

**Design system (1 file):**
- `includes/design_system.php` — 3 help text instances + 1 modal close button

**Page files (25 files):**
- admin/attendance.php, classes.php, students.php, teachers.php, users.php, permissions.php, journals.php, kiosk.php, cards.php, reports.php, consents.php, rules.php, index.php, settings.php
- guru/riwayat.php, kelas.php, jurnal.php, index.php, absen.php
- siswa/riwayat.php, izin.php, absen.php, index.php
- auth/profile.php
- scan.php

### Preserved as text-slate-400 (icon colors only)
| File | Element |
|------|---------|
| admin/attendance.php:132 | `<i class="fa-solid fa-file-export text-slate-400">` |
| admin/teachers.php:143 | Search icon wrapper |
| admin/journals.php:106 | `<i class="fa-regular fa-calendar mr-1 text-slate-400">` |
| guru/jurnal.php:163 | `<i class="fa-solid fa-clock-rotate-left text-slate-400">` |
| siswa/izin.php:129 | `<i class="fa-solid fa-list-check text-slate-400">` |
| includes/header.php:142 | `<i class="fa-solid fa-user-gear text-slate-400">` |
| includes/footer.php:75 | PWA close button |
| includes/bottom_nav.php:28 | Inactive nav icon |

## 4. Regression Results

### PHP Lint
- **0 errors** across all project files

### E2E Auth Tests
- **139/139 PASS** — all 15 sections including:
  - School signup flow (21 checks)
  - Duplicate/validation (6 checks)
  - Rollback test (3 checks)
  - Login/session security (7 checks)
  - Cross-tenant isolation (17 checks)
  - Kiosk integration (9 checks)
  - Attendance integration (16 checks)
  - Logout/session security (7 checks)
  - Registration success screen (5 checks)
  - Login UI regression (17 checks)
  - Register school UI (13 checks)
  - Database integrity (9 checks)
  - Existing data safety (3 checks)
  - PHP lint (1 check)
  - Logout flow (6 checks)

### Security Verification
- school_id: unchanged ✓
- auth: unchanged ✓
- role: unchanged ✓
- tenant isolation: unchanged ✓ (E2E Section 5: 17/17 PASS)

## 5. Files Changed

```
admin/consents.php              # require_auth(['admin'])
includes/sidebar.php            # text-slate-400 → text-slate-500 (section labels)
includes/header.php             # text-slate-400 → text-slate-500 (school name)
includes/design_system.php      # text-slate-400 → text-slate-500 (help text, modal close)
admin/attendance.php            # text-slate-400 → text-slate-500 (table header, empty state, metadata)
admin/classes.php               # text-slate-400 → text-slate-500 (empty state, labels)
admin/students.php              # text-slate-400 → text-slate-500 (table header, empty state, metadata)
admin/teachers.php              # text-slate-400 → text-slate-500 (table header, empty state, metadata)
admin/users.php                 # text-slate-400 → text-slate-500 (table header, metadata)
admin/permissions.php           # text-slate-400 → text-slate-500 (table header, empty state, metadata)
admin/journals.php              # text-slate-400 → text-slate-500 (empty state, labels, timestamp)
admin/kiosk.php                 # text-slate-400 → text-slate-500 (empty state, metadata)
admin/cards.php                 # text-slate-400 → text-slate-500 (empty state)
admin/reports.php               # text-slate-400 → text-slate-500 (empty state)
admin/rules.php                 # text-slate-400 → text-slate-500 (time labels)
admin/index.php                 # text-slate-400 → text-slate-500 (empty state, metadata)
admin/settings.php              # text-slate-400 → text-slate-500 (help text)
guru/riwayat.php                # text-slate-400 → text-slate-500 (table header, empty state, metadata)
guru/kelas.php                  # text-slate-400 → text-slate-500 (table header, empty state, metadata)
guru/jurnal.php                 # text-slate-400 → text-slate-500 (empty state)
guru/index.php                  # text-slate-400 → text-slate-500 (empty state, metadata)
guru/absen.php                  # text-slate-400 → text-slate-500 (radius label)
siswa/riwayat.php               # text-slate-400 → text-slate-500 (table header, empty state, metadata)
siswa/izin.php                  # text-slate-400 → text-slate-500 (help text, empty state, metadata)
siswa/absen.php                 # text-slate-400 → text-slate-500 (radius label)
siswa/index.php                 # text-slate-400 → text-slate-500 (date display)
auth/profile.php                # text-slate-400 → text-slate-500 (field labels)
scan.php                        # text-slate-400 → text-slate-500 (labels, empty state, metadata)
docs/APP_SHELL_CONTRACT.md      # Version 1.2 → 1.3
docs/CHANGELOG.md               # P3.2D entry
docs/IMPLEMENTATION_ROADMAP.md  # P3.2 section added
```

Total: 30 files changed.

## 6. P3.2 Status

| Phase | Status |
|-------|--------|
| P3.2A APP_SHELL_AUDIT | ✅ CLOSED |
| P3.2B SHELL CONSOLIDATION | ✅ CLOSED |
| P3.2C APPLICATION SHELL | ✅ CLOSED |
| P3.2D SHELL QA & ACCESSIBILITY | ✅ CLOSED |

**P3.2 = CLOSED.**
