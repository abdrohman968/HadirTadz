# LEGACY DATA MAPPING — HADIR-TADZ

**Tanggal:** 20 Agustus 2026
**Referensi:** `docs/DATA_INTEGRITY_AUDIT.md`, smoke test DB (verifikasi langsung via PDO)

> **Kebijakan:** Dokumen ini hanya MENYAJIKAN pemetaan untuk pengambilan keputusan
> migrasi di kemudian hari. **TIDAK ada record legacy yang di-UPDATE/DELETE** pada
> task ini. Semua pemindahan `school_id` memerlukan approval bisnis dan running
> migration, di luar scope P0/P0.2.

---

## 1. Ringkasan Data (hasil smoke test 20-08-2026)

Seluruh data saat ini terkonsentrasi pada `school_id = 1` (sekolah seed).
`school_id = 2` hanya memiliki 1 akun admin (dari `auth/register_school.php`).
Tidak ada data master ataupun attendance pada sekolah 2.

| Table              | school1 | school2 |
|--------------------|--------:|--------:|
| users              | 8       | 1       |
| classes            | 4       | 0       |
| teachers           | 2       | 0       |
| students           | 5       | 0       |
| attendance         | 37      | 0       |
| attendance_logs    | 2       | 0       |
| attendance_rules   | 2       | 0       |
| permissions        | 2       | 0       |
| journals           | 1       | 0       |
| school_settings    | 15      | 0       |

---

## 2. Matriks Pemetaan per Tabel

Konvensi kolom:
- **PK** = primary key tabel data
- **Relation** = kaitan ke `users`/`students` (untuk melacak kepemilikan)
- **Owner saat ini** = `is_active` + identitas sekolah pada data
- **Confidence** = seberapa yakin record milik sekolah tersebut
- **Recommendation** = rekomendasi (bukan eksekusi)

| Table | PK | Current school_id | Relation | Kemungkinan owner | Confidence | Recommendation |
|-------|----|--------------------|----------|-------------------|-----------|----------------|
| `users` | `id` | 1 (8 user) | admin/guru/siswa direktori | SMA Negeri Harapan Bangsa (seed) | **Tinggi** — 5 user.id terhubung ke `students`, 2 ke `teachers`, 1 admin seed | Tetap school 1 |
| `classes` | `id` | 1 (4 kelas) | `homeroom_teacher_id` → `teachers.id` (teacher school 1) | SMA Negeri Harapan Bangsa | **Tinggi** — homeroom teacher ke-2 record teacher milik school 1 | Tetap school 1 |
| `teachers` | `id` | 1 (2 guru) | `user_id` → `users.id` (school 1) | SMA Negeri Harapan Bangsa | **Tinggi** — user pendukung school 1 | Tetap school 1 |
| `students` | `id` | 1 (5 siswa) | `user_id` → `users.id`; `class_id` → `classes.id` (semua school 1) | SMA Negeri Harapan Bangsa | **Tinggi** — user + kelas pendukung school 1 | Tetap school 1 |
| `attendance` | `id` | 1 (37 record) | `user_id` → `users.id` (school 1) | SMA Negeri Harapan Bangsa | **Tinggi** — seluruh user pendukung school 1 | Tetap school 1 |
| `attendance_logs` | `id` | 1 (2 record) | `attendance_id` → `attendance.id` | ikut parent attendance | **Tinggi** | ikut keputusan parent |
| `attendance_rules` | `id` | 1 (2 rule) | independen per sekolah | SMA Negeri Harapan Bangsa | **Tinggi** — seed rule default | Tetap school 1 |
| `permissions` | `id` | 1 (2 izin) | `user_id` → `users.id` (school 1) | SMA Negeri Harapan Bangsa | **Tinggi** | Tetap school 1 |
| `journals` | `id` | 1 (1 jurnal) | `teacher_user_id` → `users.id`; `class_id` → `classes.id` (school 1) | SMA Negeri Harapan Bangsa | **Tinggi** | Tetap school 1 |
| `school_settings` | `(school_id, setting_key)` | 1 (15 nilai) | per sekolah | SMA Negeri Harapan Bangsa | **Tinggi** | Tetap school 1 |

---

## 3. Analisis Owner & Dampak

### 3.1 Semua record konsisten di `school_id = 1`
Tidak ada record lintas tenant (tidak ada record school 2 di tabel data mana pun).
Oleh karena itu **tidak ada skenario split yang membingungkan** — seluruh data
secara konsisten milik sekolah seed. Confidence tinggi di semua tabel.

### 3.2 Catatan khusus
- 37 record attendance = data operasional yang dibuat saat sistem masih single-tenant
  (sebelum default `school_id` diberlakukan di INSERT). Karena seluruh `user_id`
  pendukung berada di school 1, data ini **benar berada di school 1** — bukan
  kesalahan migrasi.
- `users.school_id = 1` untuk 8 user = konsisten dengan `teachers/students`-nya.
- School 2 (dari registrasi kedua) hanya memiliki 1 admin tanpa data master —
  wajar, karena belum ada kegiatan operasional di sekolah tersebut.

---

## 4. Rekomendasi Eksekusi (prod, DI LUAR TASK INI)

1. **Tidak ada migrasi yang diperlukan saat ini.** Seluruh data sudah konsisten
   di school 1. Tambahkan hanya bila nanti ada keputusan business:
   - memindahkan batch siswa/guru antar sekolah,
   - menduplikasi seed data ke sekolah baru.
2. Jika migrasi di masa depan:
   - jalankan `database/migrate.php` (sudah mendukung kolom `school_id`),
   - gunakan transaction + backup, buat script migrasi tersendiri,
   - perbarui `cascade` hanya bila relasi dirombak (jangan ubah FK default).
3. Proses approval: konfirmasi owner sekolah kepada tim bisnis/administrasi,
   dokumentasikan di sini, baru eksekusi.

---

## 5. Lampiran — Hasil Query Smoke Test

```text
users             : school1=8, school2=1
classes           : school1=4
teachers          : school1=2
students          : school1=5
attendance        : school1=37
attendance_logs   : school1=2
attendance_rules  : school1=2
permissions       : school1=2
journals          : school1=1
school_settings   : school1=15
```

Pencacahan tenant-scoped (SELECT di-scope `school_id`) mengembalikan data yang
tepat per sekolah → verifikasi tenant isolation P0.2.