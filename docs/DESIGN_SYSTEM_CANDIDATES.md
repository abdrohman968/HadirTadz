# DESIGN SYSTEM CANDIDATES

Catatan pola UI yang ditemukan selama rollout tapi belum tersedia di `design_system.php`.
Diprioritaskan untuk iterasi mendatang.

---

## 1. Stat Card

**Pola:** Kartu statistik dengan ikon di body, nilai besar, subtitle, dan deskripsi kecil.

**Contoh:** `admin/index.php` — 4 kartu KPI (Hadir, Terlambat, Izin/Sakit, Total Siswa).

**Kandidat function:**
```php
ds_stat_card($value, $label, $icon, $description = '', $color = 'emerald')
```

**Prioritas:** RENDAH — hanya ada di dashboard, bukan komponen umum.

---

## 2. Filter Bar

**Pola:** Form horizontal dalam kartu dengan select + input + tombol aksi.

**Contoh:** `admin/students.php` — filter kelas + search + terapkan/reset.

**Kandidat function:**
```php
ds_filter_bar($filters_html, $actions_html)
```

**Prioritas:** SEDANG — digunakan di students, teachers, attendance, reports.

---

## 3. Table Card Header

**Pola:** Header kartu yang menampilkan jumlah record + label.

**Contoh:** `admin/students.php` — "Total Siswa: 42 Orang".

**Kandidat function:**
```php
ds_table_header($count, $label, $actions_html = '')
```

**Prioritas:** RENDAH — cukup sederhana, bisa dihandle dengan inline HTML.

---

## 4. Icon Action Button (Table Row) — ✅ IMPLEMENTED (P3.1C Phase 3)

**Pola:** Tombol kecil (p-1.5) dengan ikon saja untuk aksi edit/delete di tabel.

**Contoh:** `admin/students.php` — tombol edit (emerald) dan delete (rose) di kolom Aksi.

**Status:** ✅ `ds_icon_button()` dibuat di `design_system.php` (P3.1C Phase 3).

**API:**
```php
ds_icon_button($icon, $variant = 'neutral', $type = 'button', $attributes = [])
```

**Variants:** `neutral`, `primary`, `danger`, `success`

**Fitur:**
- `aria-label` + `title` untuk accessibility
- `type` parameter (button|submit) untuk form compatibility
- `disabled` state
- Focus ring
- Supports both `<button>` standalone dan `<button>` inside `<form>`

**Evidence:** Pattern ditemukan di6+ file admin (students, teachers, attendance, classes, rules, users) dengan struktur identik: `p-1.5 rounded-lg` + icon FA `text-xs` + warna variant.

---

## 5. Table Responsive Pattern

**Pola:** Tabel dengan `data-label` attribute untuk mobile card view via CSS.

**Contoh:** `admin/students.php` — `table-responsive-card` class.

**Status:** Sudah ada di CSS (`assets/css/custom.css`), bukan komponen PHP.

**Prioritas:** TIDAK PERLU — sudah resolved via CSS.

---

## Rekap

| # | Pattern | Prioritas | Status | Halaman |
|---|---------|-----------|--------|---------|
| 1 | Stat Card | Rendah | Candidate | index.php |
| 2 | Filter Bar | Sedang | Candidate | students, teachers, attendance, reports |
| 3 | Table Card Header | Rendah | Candidate | students, teachers, classes |
| 4 | Icon Action Button | Tinggi | ✅ IMPLEMENTED | students, teachers, attendance, classes, rules, users |
| 5 | Table Responsive | Selesai | ✅ CSS exists | semua tabel |
