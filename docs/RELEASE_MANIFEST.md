# RELEASE MANIFEST — HadirTadz v1.0.0

**Version:** 1.0.0  
**Date:** 23 Agustus 2026  
**Status:** FROZEN — No further code changes except release-blocking security/data bugs.

---

## Verification Summary

| Check | Result |
|-------|--------|
| PHP Lint (all files) | ✅ 0 errors |
| E2E Auth Tests | ✅ 139/139 PASS |
| Security Audit | ✅ All critical paths verified |
| Data Integrity | ✅ No orphans, unique constraints enforced |
| Responsive | ✅ 360px–1920px no overflow |
| Accessibility | ✅ Labels, headings, focus, contrast, ARIA |
| Hotfix Phase 1 (Critical) | ✅ 5/5 fixed, 1 stale dismissed |
| Hotfix Phase 2 (High) | ✅ 7/7 fixed, 1 false positive dismissed |

---

## Project Structure

```
absensi_digital/
├── admin/                    # Admin panel (10 pages)
│   ├── index.php             # Dashboard
│   ├── students.php          # Student CRUD
│   ├── teachers.php          # Teacher CRUD
│   ├── classes.php           # Class CRUD
│   ├── attendance.php        # Attendance management
│   ├── rules.php             # Attendance rules
│   ├── permissions.php       # Permission requests
│   ├── reports.php           # Reports & CSV export
│   ├── cards.php             # Student ID cards (QR)
│   ├── kiosk.php             # Kiosk token management
│   ├── users.php             # User management
│   ├── settings.php          # School settings
│   ├── journals.php          # Teaching journals
│   └── consents.php          # Legal consent viewer
├── api/                      # API endpoints
│   ├── checkin_self.php      # Self check-in (GPS/camera)
│   ├── scan_process.php      # QR kiosk scan processing
│   └── stats.php             # Dashboard statistics
├── auth/                     # Authentication
│   ├── login.php             # Login page + success screen
│   ├── register_school.php   # School registration (3-step)
│   ├── logout.php            # Logout handler
│   └── profile.php           # User profile & password change
├── config/                   # Configuration
│   ├── database.php          # PDO connection + session config
│   ├── auth.php              # Auth helpers (auth_check, auth_user, require_auth)
│   └── helpers.php           # App helpers (get_setting, set_flash, kiosk_*, etc.)
├── includes/                 # Shared includes
│   ├── header.php            # HTML head, Google Fonts, top nav
│   ├── sidebar.php           # Sidebar navigation
│   ├── bottom_nav.php        # Mobile bottom navigation
│   ├── footer.php            # Footer + scripts
│   └── design_system.php     # Design system (11 ds_* functions)
├── guru/                     # Teacher portal (5 pages)
│   ├── index.php             # Teacher dashboard
│   ├── absen.php             # GPS/camera check-in
│   ├── kelas.php             # Class attendance
│   ├── jurnal.php            # Teaching journal
│   └── riwayat.php           # Attendance history
├── siswa/                    # Student portal (5 pages)
│   ├── index.php             # Student dashboard
│   ├── absen.php             # GPS/camera check-in
│   ├── izin.php              # Permission request
│   ├── riwayat.php           # Attendance history
│   └── kartu.php             # Digital ID card (QR)
├── assets/                   # Static assets
│   └── uploads/permissions/  # Permission attachments
├── database/                 # Database
│   ├── schema.sql            # Full schema
│   └── migrate.php           # Migration script (CLI only)
├── mobile/                   # Expo React Native app
│   ├── App.js                # WebView wrapper
│   └── package.json          # Dependencies
├── tests/                    # Test scripts
│   └── e2e_auth.php          # E2E auth test suite (139 tests)
├── docs/                     # Documentation
│   ├── RELEASE_READINESS.md  # Release readiness checklist
│   ├── FINAL_QA_REPORT.md    # QA report
│   ├── RELEASE_MANIFEST.md   # This file
│   ├── HOTFIX_VALIDATION.md  # Critical findings validation
│   ├── HIGH_FINDINGS_VALIDATION.md  # High findings validation
│   ├── IMPLEMENTATION_ROADMAP.md    # Full implementation history
│   ├── CHANGELOG.md          # Detailed changelog
│   └── ...                   # 30+ additional docs
├── index.php                 # Root redirect to login
├── scan.php                  # Public kiosk QR scanner
├── terms.php                 # Terms of service (public)
├── privacy.php               # Privacy policy (public)
├── logo.png                  # School logo
├── manifest.json             # PWA manifest
└── service-worker.js         # PWA service worker
```

---

## Technology Stack

| Component | Version |
|-----------|---------|
| PHP | 8.0+ |
| MySQL | 8.0+ (utf8mb4) |
| PDO | MySQL extension |
| CSS | Tailwind CSS CDN |
| Icons | Font Awesome 6 |
| Fonts | Plus Jakarta Sans |
| Charts | ApexCharts (admin only) |
| QR | qrcodejs (CDN) |
| Mobile | Expo React Native (WebView) |
| PWA | Service Worker + manifest.json |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| schools | School info (name, code, NPSN, coordinates, city, province, postal_code) |
| users | All users (admin, guru, siswa) with password_hash, nik |
| roles | Role definitions (admin, guru, siswa) |
| classes | School classes with grade level and homeroom teacher |
| students | Student-specific data (NIS, class_id, gender, DOB) |
| attendance | Attendance records (user, status, time_in/out, GPS, selfie) |
| attendance_rules | Per-role attendance rules (times, radius, late threshold) |
| school_settings | School config (GPS coordinates, radius, branding) |
| permissions | Student permission requests (type, dates, reason, attachment) |
| journals | Teaching journals (class, subject, topic, attendance) |
| kiosk_tokens | Kiosk device tokens (SHA-256 hash, school-bound, active/revoked) |
| legal_consents | Terms/Privacy consent records (version, IP, user-agent) |

---

## Hotfix History

### Phase 1 — Critical (C1–C6)
| ID | File | Issue | Resolution |
|----|------|-------|------------|
| C1 | auth/profile.php | password_verify on null hash | Query hash from DB |
| C2 | admin/consents.php | PDO LIMIT/OFFSET crash | Int interpolation |
| C3 | admin/permissions.php | Missing tenant scope | school_id filter |
| C4 | — | Kiosk auth broken | STALE — already working |
| C5 | database/migrate.php | Public HTTP access | 403 block |
| C6 | admin/attendance,students,kiosk,reports | Dead links (<?= ?>) | String concatenation fix |

### Phase 2 — High (H1–H8)
| ID | File | Issue | Resolution |
|----|------|-------|------------|
| H1 | guru/kelas.php | Hardcoded time '07:00:00' | date('H:i:s') |
| H2 | guru/kelas.php | Default HADIR for all | Empty + "Belum diisi" indicator |
| H3 | auth/profile.php | Redirect "leak" | FALSE POSITIVE — relative path correct |
| H4 | includes/design_system.php | flash error vs danger | error→danger mapping |
| H5 | siswa/kartu.php, siswa/index.php | JS injection | json_encode() |
| H6 | api/checkin_self.php | Insecure selfie upload | 2MB limit, MIME, perms |
| H7 | scan.php | innerHTML XSS | escapeHtml() helper |
| H8 | api/checkin_self.php | Soft-deleted student check-in | deleted_at IS NULL |

---

## Post-Release Backlog

| ID | Priority | Description |
|----|----------|-------------|
| M1 | Medium | register_school no transaction wrapping |
| M2 | Medium | DB error messages may leak credentials |
| M3 | Medium | auth_school_id() defaults to school 1 |
| M4 | Low | api/stats HTTP 200 on error |
| M5 | Low | LIKE wildcard not escaped in search |
| M6 | Low | scan_process NULL concatenation |
| L1 | Low | scan.php stray `>` character |
| L2 | Low | kartu.php hardcoded year |
| L3 | Low | scan.php dead code |
| — | Medium | CSRF tokens on forms |
| — | Low | Flash message not displayed on guru/kelas.php |
| — | Low | get_base_url() defined in 4 files |

---

## Deployment Requirements

1. PHP 8.0+ with PDO MySQL extension
2. MySQL 8.0+ with utf8mb4 charset
3. Run `php database/migrate.php` (CLI only — HTTP blocked)
4. Set `config/database.php` credentials for production
5. Ensure `assets/uploads/permissions/` directory is writable
6. HTTPS recommended for GPS/camera features
7. Service worker registered for PWA (optional)
8. Session cookie params configured for production domain

---

## Files Excluded from Release Artifact

- `.git/` — Git history
- `node_modules/` — npm dependencies
- `tests/` — E2E test scripts
- `docs/` — Documentation (not needed in production)
- `src/` — Next.js backup (not active)
- `.env*` — Environment files
- `*.log` — Log files
