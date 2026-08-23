# GURU UI AUDIT — P3.3A

## 1. PAGE INVENTORY

5 pages found:

| File | Purpose | Role | Width | DS Usage | Priority |
|------|---------|------|-------|----------|----------|
| guru/index.php | Dashboard: welcome, today status, journal count, homeroom, recent history | ['guru'] | max-w-7xl | status_badge() | 1 |
| guru/absen.php | Self check-in/out with GPS + selfie camera | ['guru'] | max-w-3xl | ds_page_header() | 2 |
| guru/kelas.php | Record class attendance for all students | ['guru','admin'] | max-w-6xl | ds_page_header() | 3 |
| guru/jurnal.php | Record teaching journal | ['guru'] | max-w-6xl | None (inline header) | 4 |
| guru/riwayat.php | Personal attendance history with monthly summary | ['guru'] | max-w-5xl | ds_page_header(), status_badge() | 5 |

Missing pages: No guru/profil.php (shared via auth/profile.php), No guru/izin.php (siswa-only), No guru/laporan.php (admin-only), No guru/settings.php (admin-only).

## 2. COMPONENT AUDIT

### DS Usage
Only ds_page_header() and status_badge() are used. All forms, buttons, alerts, and cards are inline HTML.

### Buttons
All buttons are inline HTML. Most are navigation <a> tags styled as buttons. Only form submit buttons are candidates for ds_button().

### Forms
3 forms found (kelas filter+save, jurnal save, riwayat month filter). All use inline HTML matching ds_input/ds_select patterns.

### Tables
2 tables (kelas student attendance, riwayat history). Both use table-responsive-card CSS.

### Cards
All use: bg-white rounded-3xl border border-slate-200 p-6 shadow-sm

### Alerts
2 error alerts (kelas, jurnal) use inline rose-50 pattern. Candidates for ds_alert('danger').

### Empty States
All use inline text-center py-8 text-slate-500 text-xs pattern.

### Modals/Tabs
None used.

## 3. ATTENDANCE DOMAIN (guru/absen.php)

DO NOT GENERALIZE: GPS Status Card, Camera Viewport, Camera Fallback Warning, Check-in/out Buttons, Completion Message. All domain-specific.

Business logic to NOT change: get_attendance_rule(), get_attendance_radius(), GPS, camera, selfie, API, SoundEffects.

## 4. JOURNAL DOMAIN (guru/jurnal.php)

UI: Journal Form (8 fields), Journal History Card list.
Business logic to NOT change: class validation, journal insertion, teacher scope, school scope.

## 5. SHELL COMPLIANCE

All 5 pages: ✅ application shell, ✅ require_auth(['guru']), ✅ correct sidebar/bottom nav, ✅ main wrapper, ✅ max-w tokens. No exceptions.

## 6. DS CANDIDATES FROM GURU

| Pattern | Page | Reusable | Priority |
|---------|------|----------|----------|
| Attendance Status Radio Group | kelas.php | Yes | Medium |
| Summary Counter Cards | riwayat.php, index.php | Yes | Medium |
| GPS Status Indicator | absen.php | No | Low |
| Camera/Selfie Viewport | absen.php | No | Low |
| Journal History Card | jurnal.php | Yes | Low |
| Welcome Banner | index.php | No | Low |
| Quick Batch Action Button | kelas.php | Yes | Low |

## 7. RESPONSIVE AUDIT

Key observations:
- guru/index.php: Welcome banner uses md: breakpoint for flex-row. 3 stat cards use md:grid-cols-3. Good.
- guru/absen.php: Camera viewport uses aspect-video sm:aspect-[4/3]. Buttons use flex-col sm:flex-row. Good.
- guru/kelas.php: Filter form uses grid-cols-1 sm:grid-cols-3. Table radio buttons use flex-wrap. Good.
- guru/jurnal.php: Form uses grid-cols-1 sm:grid-cols-3 and sm:grid-cols-2. Good.
- guru/riwayat.php: Summary uses grid-cols-2 sm:grid-cols-4. Good.

No overflow issues found. All pages follow mobile-first patterns.

## 8. ACCESSIBILITY AUDIT

### Fixed in P3.2C/P3.2D
- Label for/id added to kelas.php (class, date fields)
- Label for/id added to jurnal.php (8 field pairs)
- text-slate-400 upgraded to text-slate-500 for contrast

### Remaining Issues
- guru/index.php: Welcome banner emoji in h1 (not an accessibility issue, but unusual)
- guru/absen.php: GPS status card relies on color alone for status (green=valid, red=invalid) — also has icon and text changes, so passes
- guru/kelas.php: Radio button labels use <label> wrapping <input> — accessible pattern
- guru/jurnal.php: All labels have for/id — good
- No aria-label on some interactive elements (e.g., batch action button)

## 9. SECURITY OBSERVATIONS

- All pages use require_auth(['guru']) — correct
- school_id derived from auth_school_id() — server-side, not client-controlled
- No sensitive data exposed in markup (no password_hash, no session tokens)
- GPS coordinates passed to API server-side — not exposed in HTML
- Selfie photo sent as base64 to API — not stored in HTML

## 10. RECOMMENDED P3.3B ROLLOUT ORDER

1. guru/jurnal.php — Convert inline header to ds_page_header(), convert form fields to ds_input/ds_select/ds_textarea, convert error alerts to ds_alert()
2. guru/riwayat.php — Convert summary cards to ds_card_start/end (if applicable), keep ds_page_header() and status_badge()
3. guru/kelas.php — Convert form fields to ds_input/ds_select, convert error alert to ds_alert(), convert save button to ds_button()
4. guru/index.php — Convert stat cards to ds_card_start/end (if applicable), keep welcome banner as-is
5. guru/absen.php — LEAVE AS-IS (domain-specific GPS/camera UI, already uses ds_page_header)
