# HADIRTADZ DESIGN SYSTEM

**Version:** 1.1-hardened  
**Last Updated:** 22 Agustus 2026  
**Principles:** Consistency, Accessibility, Responsiveness, Security.

---

## 1. Colors & Tokens

### Emerald Palette (Main App — Tailwind CDN)

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Brand Primary | `#10b981` | `text-emerald-500` | Logos, accents |
| Primary Action | `#16a34a` | `bg-emerald-600` (green-600) | Buttons, Active states |
| Brand Dark | `#065f46` | `bg-emerald-800` | Header, Sidebar items |
| Success | `#22c55e` | `text-green-500` | Success indicators |
| Danger | `#ef4444` | `text-red-500` | Error messages, Delete buttons |
| Background | `#f8fafc` | `bg-slate-50` | Global page background |
| Surface | `#ffffff` | `bg-white` | Cards, Modals |

### Brand Palette (Standalone Pages: login, register, terms, privacy)

Canonical green palette (Tailwind default):

| Token | Hex |
|-------|-----|
| brand-50 | `#f0fdf4` |
| brand-100 | `#dcfce7` |
| brand-200 | `#bbf7d0` |
| brand-300 | `#86efac` |
| brand-400 | `#4ade80` |
| brand-500 | `#22c55e` |
| brand-600 | `#16a34a` |
| brand-700 | `#15803d` |
| brand-800 | `#166534` |
| brand-900 | `#14532d` |
| brand-950 | `#052e16` |

---

## 2. Typography

- **Font Family:** `Plus Jakarta Sans`, sans-serif.
- **Sizes:**
  - `text-xs` (0.75rem) - Secondary info, tables, badges.
  - `text-sm` (0.875rem) - Standard body text, inputs, buttons.
  - `text-base` (1rem) - Headers, large buttons.
  - `text-xl` to `text-3xl` - Page titles, dashboard stats.

---

## 3. Spacing & Radius

- **Standard Radius:** 
  - `rounded-lg` (0.5rem) - Controls inside dense lists.
  - `rounded-xl` (0.75rem) - Buttons, inputs, small cards.
  - `rounded-2xl` (1rem) - Standard cards, modals.
  - `rounded-3xl` (1.5rem) - Large containers, login/signup panels.
- **Standard Padding:** 
  - `p-4` (1rem) for mobile cards.
  - `p-6` (1.5rem) for desktop cards.

---

## 4. Components (PHP Helpers)

All components are available via `includes/design_system.php`.  
All functions are guarded by `function_exists()` to prevent redeclaration.

### 4.1 Buttons

```php
ds_button($label, $variant = 'primary', $type = 'button', $attributes = [])
```

**Variants:** `primary`, `secondary`, `outline`, `danger`, `ghost`, `light`

**Special attributes:**
- `class` — appended to base classes
- `disabled` — adds disabled attribute + opacity + pointer-events-none
- `loading` — adds aria-busy + spinner SVG + disables

**Example:**
```php
// Basic button
<?= ds_button('Simpan', 'primary', 'submit') ?>

// Disabled button
<?= ds_button('Tidak Tersedia', 'primary', 'button', ['disabled' => true]) ?>

// Loading button
<?= ds_button('Menyimpan...', 'primary', 'button', ['loading' => true]) ?>

// Button with icon
<?= ds_button('<i class="fa-solid fa-plus"></i> Tambah', 'primary') ?>
```

**Note:** `$label` is INTENTIONALLY not escaped to allow trusted HTML (icons). Callers MUST NOT pass user-supplied data without escaping.

---

### 4.1b Icon Buttons (Tables)

```php
ds_icon_button($icon, $variant = 'neutral', $type = 'button', $attributes = [])
```

**Variants:** `neutral`, `primary`, `danger`, `success`

**Special attributes:**
- `aria-label` — REQUIRED for accessibility
- `title` — tooltip for hover
- `disabled` — adds disabled attribute + opacity
- `class` — appended to base classes

**Example:**
```php
// Edit icon (primary)
<?= ds_icon_button('fa-solid fa-pen', 'primary', 'button', [
    'aria-label' => 'Edit',
    'onclick' => "editStudent(json_encode($row))"
]) ?>

// Delete icon (danger)
<?= ds_icon_button('fa-solid fa-trash', 'danger', 'submit', [
    'aria-label' => 'Hapus',
    'onclick' => "return confirm('Hapus siswa ini?')"
]) ?>
```

**Use case:** Table row actions (edit, delete, view, etc.) — too small for `ds_button`.

---

### 4.2 Inputs

```php
ds_input($name, $label = '', $type = 'text', $value = '', $attributes = [])
```

**Special attributes:**
- `id` — override default id (defaults to `$name`)
- `class` — appended to base classes
- `required` — shows red asterisk on label
- `error` — error message string (red border + error text below)
- `help_text` — help text below input
- Any other key/value is rendered as HTML attribute (escaped)

**Accessibility:**
- `<label>` associated via `for`/`id`
- `aria-describedby` links to error/help text
- `aria-invalid="true"` set when error is present

**Example:**
```php
<?= ds_input('email', 'Email', 'email', $value, ['required' => true]) ?>
<?= ds_input('radius', 'Radius', 'number', $radius, ['error' => 'Harus angka']) ?>
<?= ds_input('code', 'Kode', 'text', '', ['help_text' => 'Kode unik sekolah']) ?>
```

---

### 4.3 Textarea

```php
ds_textarea($name, $label = '', $value = '', $attributes = [])
```

**Special attributes:**
- `rows` — default 3
- `maxlength` — rendered as HTML maxlength attribute
- `error` — error message string
- `help_text` — help text below textarea
- Same accessibility features as `ds_input`

**Example:**
```php
<?= ds_textarea('address', 'Alamat', $addr, ['rows' => 2, 'maxlength' => 500]) ?>
```

---

### 4.4 Select

```php
ds_select($name, $options = [], $selected = '', $label = '', $attributes = [])
```

**Parameters:**
- `$options` — associative array `[value => label]`
- `$selected` — current value (compared with strict `===` after string cast)

**Special attributes:**
- `placeholder` — adds a disabled empty first option
- `error` — error message string
- `help_text` — help text below select
- Same accessibility features as `ds_input`

**Example:**
```php
$levels = ['SD'=>'SD', 'SMP'=>'SMP', 'SMA'=>'SMA'];
<?= ds_select('level', $levels, $schoolLevel, 'Jenjang', ['required' => true]) ?>
<?= ds_select('status', $statuses, '', 'Status', ['placeholder' => '-- Pilih Status --']) ?>
```

---

### 4.5 Badges

```php
ds_badge($text, $variant = 'neutral', $icon = '')
```

**Variants:** `success`, `warning`, `danger`, `info`, `neutral`

**Example:**
```php
<?= ds_badge('Aktif', 'success') ?>
<?= ds_badge('Menunggu', 'warning', 'fa-solid fa-clock') ?>
```

---

### 4.6 Cards

```php
ds_card_start($title = '', $icon = '', $attributes = [])
ds_card_end()
```

White surface, slate-200 border, shadow-sm, rounded-2xl.

**Example:**
```php
<?= ds_card_start('Profil Sekolah', 'fa-solid fa-school') ?>
    <!-- card content here -->
<?= ds_card_end() ?>
```

---

### 4.7 Alerts

```php
ds_alert($message, $variant = 'info', $icon = '', $dismissible = false)
```

**Variants:** `success`, `danger`, `warning`, `info`

**Features:**
- `aria-live="polite"` for screen readers
- Optional dismiss button (X) when `$dismissible = true`

**Note:** `$message` is INTENTIONALLY not escaped to allow trusted HTML (links). Callers MUST escape user input before passing.

**Example:**
```php
<?= ds_alert('Berhasil disimpan!', 'success') ?>
<?= ds_alert('Error: <b>field</b> wajib diisi', 'danger') ?>
<?= ds_alert('Peringatan', 'warning', '', true) ?>
```

---

### 4.8 Modals

```php
ds_modal_start($id, $title, $size = 'md')
ds_modal_end($footer_html = '')
```

**Sizes:** `sm`, `md`, `lg`, `xl`, `2xl`

**Features:**
- `role="dialog"`, `aria-modal="true"`, `aria-label`
- Escape key closes modal
- Backdrop click closes modal
- Focus trap within modal
- Body scroll locked when open
- `max-h-[90vh]` with scrollable body

**JavaScript controller:**
```php
// Call once per page (typically in footer)
<?= ds_modal_js() ?>
```

**Example:**
```php
<?= ds_modal_start('modal-delete', 'Hapus Data', 'sm') ?>
    <p>Yakin ingin menghapus?</p>
<?= ds_modal_end(ds_button('Hapus', 'danger', 'button')) ?>

<!-- Open modal -->
<button onclick="openModal('modal-delete')">Hapus</button>
```

---

## 5. Navigation

### 5.1 Desktop (Sidebar)
- Fixed width `w-64`.
- Collapsible to `w-20` (if supported by layout).
- Active state: `bg-emerald-700 text-white`.

### 5.2 Mobile (Bottom Nav)
- Max 5 items.
- Center item for primary action (Absen/Menu).
- Active state: `text-emerald-700 font-extrabold` + dot indicator.

---

## 6. Escaping Rules

| Context | Rule |
|---------|------|
| `ds_button($label)` | NOT escaped — trusted HTML only (icons). Callers must not pass user data. |
| `ds_alert($message)` | NOT escaped — trusted HTML only (links). Callers must escape user input. |
| All other string params | Escaped with `htmlspecialchars()` |
| `$attributes` values | Escaped with `htmlspecialchars()` |
| `$icon` params | Escaped with `htmlspecialchars()` |

**Rule of thumb:** If the function parameter is rendered via `$param` (not `htmlspecialchars($param)`), it is a trusted HTML slot. Never pass raw user input to these parameters.

---

## 7. Accessibility Rules

1. **Labels:** All inputs have a `<label>` associated via `for`/`id`.
2. **Contrast:** No white text on light green. Use dark green text for success badges.
3. **Focus:** Every interactive element has a visible `focus:ring-2` (Emerald).
4. **Semantic HTML:** Use `<button>` for actions, `<a>` for navigation.
5. **Error states:** `aria-invalid="true"` and `aria-describedby` linking to error message.
6. **Modals:** `role="dialog"`, `aria-modal="true"`, keyboard escape, focus trap.
7. **Alerts:** `role="alert"`, `aria-live="polite"` for dynamic content.
8. **Buttons:** `disabled` attribute prevents interaction; `aria-busy` for loading state.

---

## 8. Responsive Breakpoints

Test on these viewports:

| Width | Target |
|-------|--------|
| 360px | Small Android phones |
| 375px | iPhone SE/Mini |
| 390px | iPhone 14 Pro |
| 412px | Pixel 7 |
| 768px | Tablet portrait |
| 1024px | Tablet landscape / Small laptop |
| 1366px | Standard laptop |
| 1440px | Desktop |
| 1920px | Full HD |

**Rules:**
- No horizontal overflow
- No content clipping
- No layout collapse at any breakpoint
- `max-h-[90vh]` on modals for mobile viewport

---

## 9. Design Tokens — Canonical Values

### Emerald (Main App)
Defined in `includes/header.php` Tailwind CDN config.  
Override is redundant (matches Tailwind defaults) but ensures consistency.

### Brand (Standalone Pages)
Canonical green palette used in: `login.php`, `register_school.php`, `terms.php`, `privacy.php`.

| Shade | Hex |
|-------|-----|
| 50 | `#f0fdf4` |
| 100 | `#dcfce7` |
| 200 | `#bbf7d0` |
| 300 | `#86efac` |
| 400 | `#4ade80` |
| 500 | `#22c55e` |
| 600 | `#16a34a` |
| 700 | `#15803d` |
| 800 | `#166534` |
| 900 | `#14532d` |
| 950 | `#052e16` |

### Forbidden
- No duplicate `green` palette alongside `emerald`
- No second `emerald` palette
- No hardcoded hex variants in multiple files
- No `brand.700` = `#059669` (that's emerald-600, not green-700)

---

## 10. Security

- All functions guarded by `function_exists()` to prevent redeclaration.
- No user data passes through unescaped output.
- `htmlspecialchars()` uses default flags (ENT_QUOTES | ENT_SUBSTITUTE).
- `$type` in `ds_button()` is escaped to prevent type attribute injection.
- Modal IDs are escaped to prevent attribute injection.
- No new JS frameworks introduced — vanilla JS only.

---

## 11. Rollout Status

| Phase | File | Components Migrated | Date |
|-------|------|---------------------|------|
| P3.1B | includes/design_system.php | All 10 functions hardened | 22 Aug 2026 |
| P3.1C-1 | admin/index.php | ds_badge (permission type) | 22 Aug 2026 |
| P3.1C-2 | admin/students.php | ds_button, ds_alert, ds_select, ds_input, ds_badge, ds_modal, ds_modal_js | 22 Aug 2026 |
| P3.1C-3 | admin/teachers.php | ds_button, ds_alert, ds_input, ds_select, ds_badge, ds_icon_button, ds_modal, ds_modal_js | 22 Aug 2026 |
| P3.1C-4 | admin/classes.php | — | PENDING |
| P3.1C-5 | admin/attendance.php | — | PENDING |
| P3.1C-6 | admin/rules.php | — | PENDING |
| P3.1C-7 | admin/permissions.php | — | PENDING |
| P3.1C-8 | admin/reports.php | — | PENDING |
| P3.1C-9 | admin/cards.php | — | PENDING |
| P3.1C-10 | admin/kiosk.php | — | PENDING |

**Note:** Many admin pages use `<a>` navigation links styled as buttons, not `<button>` elements. `ds_button()` renders `<button>` tags. These links are intentionally NOT migrated to preserve navigation semantics. Card layouts with custom internal structures (stat cards, chart cards, feed cards) are also kept as-is when `ds_card_start/end` would break the visual design.
