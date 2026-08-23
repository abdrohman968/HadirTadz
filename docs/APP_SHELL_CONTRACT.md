# APP SHELL CONTRACT

> **Version**: 1.3 (P3.2D QA & Accessibility)
> **Date**: 2026-08-22

## Include Order

Every authenticated page MUST follow this exact order:

```
1. $page_title = '...';                    // Page title (optional, defaults to 'Absensi Digital')
2. require_once config/database.php         // DB connection + session start
3. require_once config/auth.php             // Auth functions (require_once, safe to re-include)
4. require_once config/helpers.php          // Helper functions (require_once, safe to re-include)
5. require_auth(['role']);                  // Authorization gate — redirects if unauthorized
6. ... page-specific logic ...             // DB queries, POST handling, etc.
7. $load_apexcharts = true;                // (optional) Only if page uses ApexCharts
8. include includes/header.php             // Opens <html>, <head>, <body>, <header>, <div class="flex-1">
9. include includes/sidebar.php            // <aside> sidebar + mobile backdrop
10. ... page content in <main> ...         // Page HTML output
11. include includes/footer.php            // Closes </div>, includes bottom_nav.php, JS, PWA
```

## Variables Available After header.php

| Variable | Source | Type | Notes |
|---|---|---|---|
| `$current_user` | `header.php` | array|null | Full user row from DB (no password_hash) |
| `$user` | `header.php` | array|null | Alias of `$current_user` for convenience |
| `$school` | `header.php` | array|null | Current school row |
| `$school_name` | `header.php` | string | School display name |
| `$base_url` | `header.php` | string | Application base URL (e.g., `/absensi_digital`) |
| `$page_title` | page file | string | Page title for <title> tag |
| `$pdo` | `config/database.php` | PDO | Database connection |
| `$load_apexcharts` | page file (optional) | bool | Set `true` before header include to load ApexCharts |

## Page-Level Responsibilities

### Before header.php include:
- Set `$page_title`
- Run `require_once` for config files
- Call `require_auth(['allowed_roles'])`
- Execute page-specific DB queries
- Handle POST form submissions (redirect on success)
- Optionally set `$load_apexcharts = true`

### After header.php include:
- `$current_user`, `$user`, `$base_url`, `$school_name` are available
- Do NOT call `auth_user()` again — use `$current_user` or `$user`
- Do NOT call `get_base_url()` again — use `$base_url`
- Output page content inside `<main>` tag

## Shell Components

| Component | File | Role-Conditional | Notes |
|---|---|---|---|
| Header + Top Nav | `includes/header.php` | No | Shared across all roles |
| Sidebar | `includes/sidebar.php` | Yes (by `$role`) | Menu items differ per role |
| Bottom Nav | `includes/bottom_nav.php` | Yes (by `$role`) | Mobile-only, role-specific items |
| Footer + Scripts | `includes/footer.php` | No | Includes bottom_nav.php, loads app.js |
| Design System | `includes/design_system.php` | No | `ds_*` helper functions |
| Custom CSS | `assets/css/custom.css` | No | Global styles, breakpoints |
| Core JS | `assets/js/app.js` | No | Clock, sounds, toast |

## Responsive Breakpoints

| Breakpoint | Tailwind Class | Usage |
|---|---|---|
| `< 640px` | (mobile default) | Stack layouts, full-width |
| `>= 640px` | `sm:` | Typography scaling |
| `>= 768px` | `md:` | Grid columns, table layout |
| `>= 1024px` | `lg:` | Sidebar visible, bottom nav hidden |

**Source of truth**: Tailwind default breakpoints. Custom CSS uses `767px` for `< md` (mobile-only).

## Content Width Tokens

| Width Class | Pixels | Use Case |
|---|---|---|
| `max-w-3xl` | 768px | Camera/GPS pages, focused forms |
| `max-w-4xl` | 896px | Settings, config forms |
| `max-w-5xl` | 1024px | Lists, secondary pages |
| `max-w-6xl` | 1152px | Complex forms with tables |
| `max-w-7xl` | 1280px | Dashboards, data tables (default) |

## Design System Helpers

### Shell-Level (use in any page):
- `ds_button()` — Standard button
- `ds_icon_button()` — Icon-only button
- `ds_badge()` — Status badge
- `ds_alert()` — Alert message
- `ds_page_header()` — Page title + subtitle + action slot
- `ds_modal_start()` / `ds_modal_end()` / `ds_modal_js()` — Modal dialog

### Page-Level (forms, tables, cards):
- `ds_input()` — Form input with label
- `ds_textarea()` — Form textarea
- `ds_select()` — Form select dropdown
- `ds_card_start()` / `ds_card_end()` — Card container

## Security Rules

- Never cache `auth_user()` result across requests
- Never bypass `require_auth()` check
- Never expose `password_hash` in user context
- `ds_page_header()` `$action_html` is trusted (caller must escape user content)
- All dynamic text in HTML output must use `htmlspecialchars()`

## Page Structure Rules

### Main Content Wrapper

Every authenticated page MUST use this exact `<main>` wrapper:

```html
<main class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-{TOKEN} mx-auto space-y-6">
        <!-- Page content -->
    </div>
</main>
```

**Exception:** `siswa/kartu.php` uses `bg-slate-900` (dark QR card page).

### Inner Container Width

Select the appropriate `max-w-*` token based on content type:

| Content Type | Width Token | Example Pages |
|---|---|---|
| Dashboard | `max-w-7xl` | admin/index, guru/index, siswa/index |
| Data table | `max-w-7xl` | admin/students, admin/teachers, admin/users |
| Wide list | `max-w-6xl` | admin/rules, admin/journals, guru/journal, guru/kelas |
| Secondary list | `max-w-5xl` | guru/riwayat, siswa/riwayat |
| Form / detail | `max-w-4xl` | admin/settings, admin/kiosk, admin/consents, siswa/izin |
| Camera / GPS | `max-w-3xl` | guru/absen, siswa/absen |

### Page Headers

Use `ds_page_header()` for all new pages and when refactoring existing pages:

```php
<?= ds_page_header('Title', 'Subtitle text.', '<action HTML>') ?>
```

**Signature:** `ds_page_header($title, $subtitle = '', $action_html = '', $icon = '')`

- `$title` — Page title (escaped automatically)
- `$subtitle` — Optional subtitle (escaped automatically)
- `$action_html` — Trusted raw HTML for action buttons (NOT escaped)
- `$icon` — Optional FontAwesome icon class (escaped automatically)

**Action HTML examples:**
- Single button: `ds_button('Label', 'primary', 'button', ['onclick' => 'handler()'])`
- Anchor link: `'<a href="..." class="...">Text</a>'`
- Multiple actions: concatenate with `.` operator

### Responsive Header Pattern

If NOT using `ds_page_header()`, the page header MUST use:

```html
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Title</h1>
        <p class="text-xs sm:text-sm text-slate-500">Subtitle</p>
    </div>
    <div class="flex items-center gap-2.5">
        <!-- Action buttons -->
    </div>
</div>
```

### Accessibility Requirements

- All `<label>` elements MUST have a `for` attribute matching the associated input's `id`
- All `<img>` elements MUST have an `alt` attribute
- All form inputs MUST have an `id` attribute when paired with a label
- Modals MUST use `ds_modal_start()` which provides `role="dialog"`, `aria-modal`, and `aria-label`
