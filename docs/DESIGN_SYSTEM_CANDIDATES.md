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

## 6. Attendance Status Radio Group (Guru)

**Pola:** Grup radio button untuk memilih status kehadiran (HADIR, TERLAMBAT, IZIN, SAKIT, ALPHA) dengan style `peer-checked:` Tailwind.

**Contoh:** `guru/kelas.php` —5 radio buttons per siswa di tabel presensi kelas.

**Kandidat function:**
```php
ds_status_radio_group($name, $options, $selected, $layout = 'horizontal')
```

**Prioritas:** SEDANG — digunakan di kelas.php, bisa reusable untuk any batch status selection.

**Evidence:** Pattern identik di satu halaman, 5 opsi dengan warna berbeda per status.

---

## 7. Summary Counter Cards (Guru)

**Pola:** Grid 4 kartu ringkasan (Tepat Waktu, Terlambat, Izin/Sakit, Alpha) dengan angka besar dan label.

**Contoh:** `guru/riwayat.php` — summary counters. `guru/index.php` — stat cards (3 cards).

**Kandidat function:**
```php
ds_summary_counters($counters) // $counters = [['value' => 5, 'label' => 'Tepat Waktu', 'color' => 'emerald'], ...]
```

**Prioritas:** SEDANG — digunakan di 2 halaman guru, pattern umum untuk dashboard summary.

**Evidence:** Grid `grid-cols-2 sm:grid-cols-4` dengan kartu identik.

---

## 8. Quick Batch Action Button (Guru)

**Pola:** Tombol "Semua Hadir" untuk mengatur semua radio ke status tertentu sekaligus.

**Contoh:** `guru/kelas.php` — tombol batch action di header tabel.

**Kandidat function:** Tidak perlu function khusus — cukup `ds_button()` dengan onclick handler.

**Prioritas:** RENDAH — cukup sederhana.

---

## Rekap

| # | Pattern | Prioritas | Status | Halaman |
|---|---------|-----------|--------|---------|
| 1 | Stat Card | Rendah | Candidate | index.php |
| 2 | Filter Bar | Sedang | Candidate | students, teachers, attendance, reports |
| 3 | Table Card Header | Rendah | Candidate | students, teachers, classes |
| 4 | Icon Action Button | Tinggi | ✅ IMPLEMENTED | students, teachers, attendance, classes, rules, users |
| 5 | Table Responsive | Selesai | ✅ CSS exists | semua tabel |
| 6 | Attendance Status Radio Group | Sedang | Candidate | guru/kelas.php |
| 7 | Summary Counter Cards | Sedang | Candidate | guru/riwayat.php, guru/index.php |
| 8 | Quick Batch Action Button | Rendah | Candidate | guru/kelas.php |
