# APP SHELL AUDIT — P3.2A

> **Status**: P3.2C COMPLETE — Application Shell Implementation done
> **Date**: 2026-08-22
> **Scope**: Global layout architecture before unified shell
> **Action**: AUDIT ONLY — No refactoring
> **Note**: P3.2C standardized all 24 page files. See `P3_2C_APPLICATION_SHELL_IMPLEMENTATION.md` for details.

---

## 1. CURRENT SHELL ARCHITECTURE

### 1.1 Shell Components

| Component | File | Shared | Role-Conditional |
|---|---|---|---|
| DOCTYPE + Head | `includes/header.php` | Yes | No |
| Top Nav Bar | `includes/header.php` | Yes | No |
| Sidebar | `includes/sidebar.php` | Yes | Yes (by `role_code`) |
| Bottom Nav | `includes/bottom_nav.php` | Yes | Yes (by `role_code`) |
| Footer + Scripts | `includes/footer.php` | Yes | No |
| Design System | `includes/design_system.php` | Yes | No |
| Core JS | `assets/js/app.js` | Yes | No |
| Custom CSS | `assets/css/custom.css` | Yes | No |

### 1.2 Include Chain (Every Page)

```
1. $page_title = '...';
2. require_once config/database.php
3. require_once config/auth.php
4. require_once config/helpers.php
5. require_auth(['role'])
6. ... page-specific logic ...
7. include includes/header.php     ← opens <html>, <head>, <body>, <header>, <div class="flex-1 flex overflow-hidden relative">
8. include includes/sidebar.php    ← <aside> + mobile backdrop
9. ... page content in <main> ...
10. include includes/footer.php    ← closes </div>, includes bottom_nav.php, loads JS, PWA banner
```

### 1.3 Page Content Pattern

Every page wraps content in:

```html
<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-{VARIABLE} mx-auto space-y-6">
        <!-- page content -->
    </div>
</main>
```

---

## 2. SHARED ELEMENTS

### 2.1 Identical Across All Roles

| Element | Location | Notes |
|---|---|---|
| `<!DOCTYPE html>` + `<head>` | `header.php:13-65` | Tailwind CDN, FA icons, custom CSS |
| Top navigation bar | `header.php:69-153` | Emerald-800 bg, logo, clock, kiosk link, user dropdown |
| User avatar dropdown | `header.php:113-149` | Profile + logout links |
| Body wrapper open | `header.php:156` | `<div class="flex-1 flex overflow-hidden relative">` |
| Sidebar shell | `sidebar.php:39` | `<aside id="app-sidebar" class="no-print fixed lg:static ...">` |
| Sidebar footer profile | `sidebar.php:114-124` | Avatar + name + identifier |
| Sidebar backdrop | `sidebar.php:36` | Mobile overlay |
| Sidebar collapse JS | `footer.php:11-24` | localStorage-persisted toggle |
| Bottom nav bar shell | `bottom_nav.php:54` | `<nav class="lg:hidden fixed bottom-0 ...">` |
| Flash messages | `footer.php:117-125` | showToast trigger |
| PWA install banner | `footer.php:63-79` | Same for all roles |
| PWA SW registration | `footer.php:82-89` | Same for all roles |
| `app.js` (clock, sounds, toast) | `assets/js/app.js` | All roles |
| `design_system.php` components | All roles use `ds_button`, `ds_badge`, `ds_alert`, `ds_modal_*`, `ds_input`, `ds_select`, `ds_card_start/end` |

### 2.2 Include Pattern — 100% Consistent

All 24 pages (14 admin + 5 guru + 5 siswa) + `auth/profile.php` use identical include sequence:

```php
include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
// ... <main> content ...
include __DIR__ . '/../includes/footer.php';
```

---

## 3. ROLE-SPECIFIC ELEMENTS

### 3.1 Sidebar Menu (`sidebar.php`)

| Role | Menu Items | Sections |
|---|---|---|
| `admin` | 14 items | Utama (3), Master Data (4), Aktivitas & Izin (3), Laporan & Sistem (5) |
| `guru` | 5 items | Menu Guru (5) |
| `siswa` | 5 items | Portal Siswa (5) |

**Navigation Functions**: `is_nav_active()`, `nav_item()` — shared, role-agnostic.

### 3.2 Bottom Nav (`bottom_nav.php`)

| Role | Items | Center Button | Extra |
|---|---|---|---|
| `admin` | 5 (Beranda, Guru, Menu, Siswa, Presensi) | Menu → opens bottom sheet modal | Bottom sheet with 13 grid tiles |
| `guru` | 5 (Beranda, Kelas, Absen, Jurnal, Profil) | Absen (GPS) | None |
| `siswa` | 5 (Beranda, Kartu QR, Absen, Izin, Profil) | Absen (GPS) | None |
| `guest` | 3 (Masuk, Kiosk Scan, Daftar) | Kiosk Scan | None |

**Bottom Sheet (admin-only)**: `bottom_nav.php:96-131` — duplicated menu items as grid tiles. Only rendered for `$role === 'admin'`.

**Navigation Functions**: `is_bottom_active()`, `bottom_nav_item()`, `bottom_menu_tile()` — shared, role-agnostic.

---

## 4. DUPLICATE ELEMENTS

### 4.1 Duplicated Markup

| Element | Occurrences | Where |
|---|---|---|
| `$current_user = auth_user()` | `header.php:7`, `sidebar.php:3`, `bottom_nav.php:3`, every page file | Redundant — header.php already loads it |
| `$base_url = get_base_url()` | `header.php:10`, `sidebar.php:5`, `bottom_nav.php:5`, every page file | Redundant |
| `$role = $current_user['role_code']` | `sidebar.php:4`, `bottom_nav.php:4` | Duplicated variable |
| `auth_user()` in pages | Every page file calls it again after header includes it | Double-call |
| `is_nav_active()` vs `is_bottom_active()` | `sidebar.php:10-16` vs `bottom_nav.php:10-16` | Identical logic, separate functions |

### 4.2 Duplicated CSS

| Pattern | Where | Issue |
|---|---|---|
| `@import` Google Fonts | `custom.css:7` AND `header.php:31` | Fonts loaded twice |
| `body` font-family | `custom.css:9-14` | Also set by Tailwind config in header |
| `main` padding-bottom | `custom.css:40-47` | Applied globally, conflicts with page-specific padding |
| Table responsive card | `custom.css:78-127` | Only used in admin pages, loaded for all roles |

### 4.3 Duplicated JS

| Pattern | Where | Issue |
|---|---|---|
| `SoundEffects` object | `app.js:25-119` | Used only by guru/absen.php, siswa/absen.php, scan.php — loaded for all |
| `showToast` | `app.js:122-167` | Used everywhere — appropriate |
| `liveClock` | `app.js:6-22` | Used only in header — appropriate |

### 4.4 Duplicated DOM

| Element | Notes |
|---|---|
| `require_once` calls in header + every page | `config/database.php`, `config/auth.php`, `config/helpers.php` included 2× per request (header.php includes them, then page includes them again) |
| `auth_user()` call in header.php + sidebar.php + bottom_nav.php + page file | 4 calls per page load |

---

## 5. RESPONSIVE BEHAVIOR

### 5.1 Breakpoints

| Breakpoint | Source | Used For |
|---|---|---|
| `lg` (1024px) | Tailwind default | **Primary breakpoint** — sidebar show/hide, bottom nav hide/show |
| `sm` (640px) | Tailwind default | Typography scaling, layout adjustments |
| `md` (768px) | Tailwind default | Grid column changes |
| `768px` | `custom.css:33,78` | Font size override, table card layout |

### 5.2 Mobile Behavior (< 1024px)

- Sidebar: Hidden off-screen (`-translate-x-full`), shown via backdrop + JS toggle
- Bottom nav: Visible (`lg:hidden`)
- Header: Compact (clock hidden on `< sm`)
- Content: Full-width, `p-4`

### 5.3 Desktop Behavior (>= 1024px)

- Sidebar: Static (`lg:static lg:translate-x-0`), collapsible via burger
- Bottom nav: Hidden (`lg:hidden`)
- Header: Full (clock visible, user name visible)
- Content: Scrollable, padded

### 5.4 Inconsistencies Found

| Issue | Location | Detail |
|---|---|---|
| **Custom breakpoint overlap** | `custom.css:33` `@media (max-width: 767px)` | Font-size override at 767px, but Tailwind `md` is 768px — off by 1px |
| **Table card breakpoint** | `custom.css:78` `@media (max-width: 768px)` | Different value than font-size (767 vs 768) |
| **Bottom nav max-width** | `bottom_nav.php:55` | `max-w-lg` (512px) — no tablet consideration |
| **Main padding-bottom** | `custom.css:40-47` | `!important` override conflicts with pages that set their own padding |
| **No tablet-specific layout** | All | Tablets get mobile sidebar + bottom nav — may be suboptimal for landscape tablets |

---

## 6. CONTAINER WIDTH MAP

| Page | Container Width | Rationale |
|---|---|---|
| admin/index.php | `max-w-7xl` (1280px) | Dashboard — full width |
| admin/students.php | `max-w-7xl` | Data table |
| admin/teachers.php | `max-w-7xl` | Data table |
| admin/classes.php | `max-w-7xl` | Data table |
| admin/users.php | `max-w-7xl` | Data table |
| admin/attendance.php | `max-w-7xl` | Data table |
| admin/reports.php | `max-w-7xl` | Reports |
| admin/cards.php | `max-w-7xl` | Card grid |
| admin/journals.php | `max-w-7xl` | List |
| admin/permissions.php | `max-w-7xl` | Data table |
| admin/settings.php | `max-w-4xl` (896px) | Form — narrower |
| admin/rules.php | `max-w-6xl` (1152px) | Form |
| admin/kiosk.php | `max-w-4xl` | Config |
| admin/consents.php | `max-w-4xl` | Static content |
| guru/index.php | `max-w-7xl` | Dashboard |
| guru/kelas.php | `max-w-6xl` | Form + table |
| guru/jurnal.php | `max-w-6xl` | Form |
| guru/absen.php | `max-w-3xl` (768px) | Camera/GPS — focused |
| guru/riwayat.php | `max-w-5xl` (1024px) | List |
| siswa/index.php | `max-w-7xl` | Dashboard |
| siswa/absen.php | `max-w-3xl` | Camera/GPS — focused |
| siswa/kartu.php | `max-w-md` (448px) | QR card — centered |
| siswa/izin.php | `max-w-4xl` | Form |
| siswa/riwayat.php | `max-w-5xl` | List |

**Pattern**: Dashboards = `7xl`, Forms = `3xl-4xl`, Lists = `5xl-7xl`, Special = role-appropriate.

---

## 7. DESIGN SYSTEM INTEGRATION

### 7.1 Shell-Level Components (Should Stay Shell)

| Component | Current Location | Recommendation |
|---|---|---|
| `ds_modal_start/end/js` | `design_system.php` | Shell-level — used across roles |
| `ds_button` | `design_system.php` | Shell-level — universal |
| `ds_alert` | `design_system.php` | Shell-level — universal |
| `ds_badge` | `design_system.php` | Shell-level — universal |

### 7.2 Page-Specific Components

| Component | Current Location | Recommendation |
|---|---|---|
| `ds_input` | `design_system.php` | Page-level — forms |
| `ds_textarea` | `design_system.php` | Page-level — forms |
| `ds_select` | `design_system.php` | Page-level — forms |
| `ds_card_start/end` | `design_system.php` | Page-level — content |
| `ds_icon_button` | `design_system.php` | Page-level — tables |

### 7.3 Design System Coverage Gaps

| Missing | Used In | Pattern |
|---|---|---|
| Page header component | Every page | `<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">` — **duplicated 10+ times** |
| Data table wrapper | admin pages | `<div class="bg-white rounded-2xl border ..."><div class="table-responsive-card">` |
| Stat card | dashboards | KPI cards — not abstracted |
| Welcome banner | dashboards | `<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r ...">` — **duplicated 3×** |
| Filter bar | list pages | `<div class="bg-white rounded-2xl border ... p-4">` with form grid |

---

## 8. OVERFLOW RISK ASSESSMENT

### 8.1 Identified Overflow Sources

| Source | Risk | Location |
|---|---|---|
| Tables with many columns | **High** | admin/students.php (7 cols), admin/attendance.php, guru/kelas.php (4 cols) |
| Wide data in table cells | Medium | admin/permissions.php, admin/students.php |
| Sidebar fixed width (w-64) | Low | `sidebar.php:39` — but collapsible |
| Fixed header height (h-16) | Low | `header.php:71` — consistent |
| Bottom nav z-index layering | Low | `bottom_nav.php:54` — z-40, but content has no z-index |
| PWA banner positioning | Low | `footer.php:63` — `fixed bottom-20`, can overlap bottom nav |
| Camera preview aspect ratio | Medium | `siswa/absen.php:71`, `guru/absen.php:71` — `aspect-video sm:aspect-[4/3]` |

### 8.2 Table Overflow Mitigation

Tables use `.table-responsive-card` class from `custom.css:78-127`:
- `< 768px`: Converts to stacked card layout
- `>= 768px`: Standard table (can overflow if many columns)

**Risk**: 7-column table (admin/students.php) overflows on tablet (768px-1024px).

---

## 9. PERFORMANCE AUDIT

### 9.1 Duplicated Resource Loads

| Resource | Load Count | Impact |
|---|---|---|
| Google Fonts CSS | 2× (`header.php:31` + `custom.css:7`) | Minor — browser deduplicates |
| `config/database.php` | 2× per page (header.php + page file) | Minor — `require_once` prevents double-execution |
| `config/auth.php` | 2× per page | Same — `require_once` |
| `config/helpers.php` | 2× per page | Same — `require_once` |
| `auth_user()` | 3-4× per page (header + sidebar + bottom_nav + page) | Minor — function call overhead |

### 9.2 Unnecessary DOM

| Element | Loaded For | Used By |
|---|---|---|
| ApexCharts CDN | All pages (`header.php:64`) | Only `admin/index.php` |
| QRCode.js CDN | All pages via `siswa/index.php` | Only `siswa/index.php`, `siswa/kartu.php` |
| SoundEffects | All pages (`app.js`) | Only `guru/absen.php`, `siswa/absen.php`, `scan.php` |
| Live clock | All pages (`app.js`) | Only `header.php` |
| PWA banner + SW | All pages (`footer.php:63-113`) | Universal — appropriate |
| Admin bottom sheet | Admin only (`bottom_nav.php:96-131`) | Only admin on mobile |

### 9.3 Total External Requests Per Page Load

```
1. cdn.tailwindcss.com (JS)
2. fonts.googleapis.com (CSS)
3. fonts.gstatic.com (fonts)
4. cdnjs.cloudflare.com/font-awesome (CSS)
5. cdn.jsdelivr.net/npm/apexcharts (JS)
6. /assets/css/custom.css
7. /assets/js/app.js
= 7 external + 2 local resources
```

---

## 10. RECOMMENDED UNIFIED ARCHITECTURE

### 10.1 Target: Single Shell + Role Config

```
Current:
  header.php (shared)
  sidebar.php (shared + role switch)
  bottom_nav.php (shared + role switch)
  footer.php (shared)
  
  Each page:
    include header
    include sidebar
    <main>content</main>
    include footer

Target:
  includes/shell.php  ← new, orchestrates everything
    role config loaded from auth context
    sidebar menu data structure (role → items)
    bottom nav data structure (role → items)
    header rendered
    sidebar rendered
    <main>{content from page}</main>
    bottom nav rendered
    footer rendered
  
  Each page:
    $page_content = function() { ... };
    include includes/shell.php;
```

### 10.2 Role Configuration Data Structure

```php
$shell_config = [
    'sidebar' => [
        'admin' => [
            ['section' => 'Utama', 'items' => [
                ['url' => '/admin/index.php', 'icon' => 'fa-gauge-high', 'label' => 'Dashboard'],
                // ...
            ]],
        ],
        'guru' => [
            ['section' => 'Menu Guru', 'items' => [
                ['url' => '/guru/index.php', 'icon' => 'fa-gauge-high', 'label' => 'Dashboard'],
                // ...
            ]],
        ],
        'siswa' => [
            ['section' => 'Portal Siswa', 'items' => [
                ['url' => '/siswa/index.php', 'icon' => 'fa-gauge-high', 'label' => 'Dashboard'],
                // ...
            ]],
        ],
    ],
    'bottom_nav' => [
        'admin' => [
            ['url' => '/admin/index.php', 'icon' => 'fa-house', 'label' => 'Beranda'],
            // ...
            ['type' => 'menu_button'], // center
        ],
        // ...
    ],
];
```

### 10.3 Content Width Strategy

Standardize on semantic width tokens instead of arbitrary `max-w-*`:

| Token | Width | Use Case |
|---|---|---|
| `shell-content--narrow` | `max-w-3xl` (768px) | Camera/GPS pages, single forms |
| `shell-content--medium` | `max-w-5xl` (1024px) | Lists, secondary pages |
| `shell-content--wide` | `max-w-7xl` (1280px) | Dashboards, data tables |

### 10.4 Consolidated Main Wrapper

Replace per-page `<main>` wrapper with:

```php
<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="<?= $content_width ?? 'max-w-7xl' ?> mx-auto space-y-6">
        <?= $page_content() ?>
    </div>
</main>
```

---

## 11. FILES AFFECTED (If Migration Proceeds)

### 11.1 New Files

| File | Purpose |
|---|---|
| `includes/shell.php` | Unified shell orchestrator |
| `includes/nav_config.php` | Role-based menu data structures |
| `includes/components/page_header.php` | Reusable page header component |
| `includes/components/content_wrapper.php` | Reusable content width wrapper |

### 11.2 Modified Files

| File | Change |
|---|---|
| `includes/header.php` | Remove duplicated `$current_user`, `$base_url` |
| `includes/sidebar.php` | Refactor to use nav config data |
| `includes/bottom_nav.php` | Refactor to use nav config data |
| `includes/footer.php` | Remove duplicated DOM |
| `assets/css/custom.css` | Remove duplicate `@import`, consolidate `main` padding |
| `assets/js/app.js` | Remove role-specific code if not needed globally |

### 11.3 All 24+ Page Files

Every page in `admin/`, `guru/`, `siswa/`, `auth/profile.php` would change their include pattern from:

```php
include header;
include sidebar;
<main>...</main>
include footer;
```

To:

```php
$page_content = function() { /* ... */ };
include shell.php;
```

---

## 12. RISKS

| Risk | Severity | Mitigation |
|---|---|---|
| Breaking all pages simultaneously | **High** | Test each role independently; staged rollout |
| Sidebar menu active state regression | Medium | Automated test for `is_nav_active()` |
| Bottom nav regression | Medium | Visual regression test per role |
| Admin bottom sheet breakage | Low | Only affects admin mobile — test last |
| Performance regression from refactoring | Low | Measure before/after |
| Auth/permission bypass | **High** | Never change `require_auth()` in shell |
| Mobile layout regression | Medium | Test on actual devices (320px-1024px) |

---

## 13. MIGRATION ORDER (If Approved)

```
Phase 1: Non-breaking prep
  1.1 Fix duplicate @import in custom.css
  1.2 Consolidate require_once calls
  1.3 Create nav_config.php with menu data
  1.4 Create page_header component

Phase 2: Shell creation
  2.1 Create shell.php with role config
  2.2 Test admin pages only (14 files)
  2.3 Test guru pages only (5 files)
  2.4 Test siswa pages only (5 files)
  2.5 Test auth/profile.php

Phase 3: Content migration
  3.1 Migrate admin pages to use shell
  3.2 Migrate guru pages to use shell
  3.3 Migrate siswa pages to use shell
  3.4 Migrate auth/profile.php

Phase 4: Cleanup
  4.1 Remove old include pattern from pages
  4.2 Audit performance improvements
  4.3 Visual regression testing
```

---

## 14. SUMMARY

### Current State: Well-Structured But Duplicated

**Strengths**:
- Consistent include pattern across all 24+ pages
- Role switching already exists in sidebar and bottom nav
- Design system (`design_system.php`) provides reusable components
- Responsive breakpoints are consistent (`lg` as primary)
- Mobile bottom nav with admin bottom sheet is well-designed

**Weaknesses**:
- Auth/config includes duplicated (2× per page)
- `auth_user()` called 3-4× per page
- Google Fonts loaded twice
- ApexCharts loaded for all pages (used by 1)
- No unified page header component (duplicated 10+ times)
- No unified welcome banner component (duplicated 3×)
- Table responsive card breakpoint off by 1px from Tailwind `md`

### Recommendation

The existing architecture is **80% aligned** with a unified shell pattern. The role switching logic already lives in `sidebar.php` and `bottom_nav.php`. A unified shell would primarily:
1. Eliminate redundant includes and function calls
2. Extract repeated page header/banner patterns into components
3. Centralize role menu configuration in one data structure
4. Fix the minor CSS breakpoint inconsistency

**No breaking changes needed** — the migration is consolidation, not replacement.
