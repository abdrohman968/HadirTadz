# SCHOOL SIGNUP MULTI-STEP — HADIR-TADZ (P1.2)

**Tipe tugas:** P1 UI — School Signup Multi-Step
**Tanggal:** 21 Agustus 2026
**Status:** ✅ Selesai
**Referensi:** `auth/register_school.php`, `auth/login.php`

---

## 1. Ringkasan

Signup sekolah existing di-upgrade dari form tunggal menjadi UX multi-step
modern (4 langkah) tanpa mengubah backend business logic yang sudah terbukti.

**Yang TIDAK berubah:**
- Transaction (BEGIN → create school → admin → settings → rules → kiosk → COMMIT)
- Password hashing (bcrypt via `password_hash`)
- Role assignment (role_id=1, admin)
- School creation (schools table)
- Admin creation (users table)
- Default school settings (12 keys)
- Default attendance rules (2 rows: siswa + guru)
- Kiosk token generation (try/catch resilient)
- NPSN uniqueness check
- Error handling + rollback

**Yang BERUBAH:**
- UI: single form → 3-step wizard (Step 1: Sekolah, Step 2: Admin, Step 3: Review)
- Success: flash message → Step 4 success screen (on login.php via session)
- Design: dark theme → white + green gradient modern
- Layout: single column → desktop split layout + mobile single column
- Validation: frontend per-step + backend final submit

---

## 2. Flow

```
Step 1: Informasi Sekolah
  ↓ (Next → validasi frontend: school_name + npsn wajib)
Step 2: Admin Sekolah
  ↓ (Next → validasi frontend: admin_name + password wajib, min 6, match)
Step 3: Review & Persetujuan
  ↓ (Submit → validasi frontend: checkbox agreed)
POST to same endpoint (register_school.php)
  ↓
Backend validation (same as before):
  - required fields check
  - password match + min length
  - terms agreement
  - NPSN uniqueness
  ↓
Transaction (same as before):
  1. schools row
  2. users row (admin)
  3. school_settings (12 keys)
  4. attendance_rules (2 rows)
  5. kiosk_tokens (1 token)
  ↓
$_SESSION['registration_success'] = data
  ↓
Redirect → login.php?registered=1
  ↓
Step 4: Success Screen (on login.php)
  Shows: school name, school code, jenjang, admin name, username
  CTA: "Masuk ke HadirTadz"
```

---

## 3. Field Mapping

### Step 1 — Informasi Sekolah

| Field | Name Attribute | Required | Backend Reads | Notes |
|-------|---------------|----------|---------------|-------|
| Nama Sekolah | `school_name` | ✅ | ✅ | Maps to `schools.name` |
| NPSN | `npsn` | ✅ | ✅ | Maps to `schools.npsn`, unique check |
| Jenjang | `level` | — | ✅ | Default 'SMA', enum |
| Alamat | `address` | — | ✅ | Maps to `schools.address` |
| Email Sekolah | `email_sekolah` | — | ❌ | Visual only, not in backend |
| No. Telepon | `phone_sekolah` | — | ❌ | Visual only, not in backend |

### Step 2 — Admin Sekolah

| Field | Name Attribute | Required | Backend Reads | Notes |
|-------|---------------|----------|---------------|-------|
| Nama Admin | `admin_name` | ✅ | ✅ | Maps to `users.full_name` |
| Username | `identifier` | — | ✅ | Auto-generate 'ADM-XXX' if empty |
| Email Admin | `email` | — | ✅ | Maps to `users.email` |
| No. WhatsApp | `phone` | — | ✅ | Maps to `users.phone` |
| Password | `password` | ✅ | ✅ | Min 6 chars, bcrypt |
| Konfirmasi | `confirm_password` | ✅ | ✅ | Must match password |

### Step 3 — Review

- Read-only summary of all entered fields
- Password shown as `••••••••`
- Checkbox: "Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi"

### Step 4 — Success (on login.php)

- Nama Sekolah, Kode Sekolah, Jenjang
- Nama Admin, Username/Identifier
- CTA: Masuk ke HadirTadz

---

## 4. Requirements Gap (belum diimplementasi)

| Field | Target | Current | Status |
|-------|--------|---------|--------|
| Kota/Kabupaten | form field | ❌ tidak ada di schema | Gap — perlu ALTER TABLE schools ADD COLUMN city |
| Provinsi | form field | ❌ tidak ada di schema | Gap — perlu ALTER TABLE schools ADD COLUMN province |
| Kode Pos | form field | ❌ tidak ada di schema | Gap — perlu ALTER TABLE schools ADD COLUMN postal_code |
| NIK/NIP Admin | form field | ❌ tidak ada di schema | Gap — perlu ALTER TABLE users ADD COLUMN nik_nip |
| Terms/Privacy page | link target | ❌ placeholder `#` | Gap — perlu buat halaman Syarat & Ketentuan |

Field `email_sekolah` dan `phone_sekolah` saat ini visual-only (tidak disimpan
ke database karena schema `schools` sudah punya kolom `email` dan `phone`).
Jika diperlukan email/phone sekolah yang terpisah dari admin, perlu schema change.

---

## 5. File Changes

| File | Change |
|------|--------|
| `auth/register_school.php` | Multi-step UI (3 steps), backend logic preserved, success → session + redirect |
| `auth/login.php` | Step 4 success screen (rendered when `$_SESSION['registration_success']` exists) |
| `docs/SCHOOL_SIGNUP.md` | **Baru** — dokumentasi ini |

---

## 6. UI Design

- **Theme:** White + Green Gradient (brand: #22C55E, #16A34A, #059669)
- **Font:** Plus Jakarta Sans
- **Desktop:** Split layout — left branding panel (green gradient, feature cards), right form card
- **Mobile:** Single column — compact logo, full-width form card
- **Step indicator:** Circular steps with connecting lines
  - Active: green fill + shadow ring
  - Completed: green fill + checkmark
  - Inactive: gray border
- **Card:** White, soft shadow, rounded-2xl, border gray-100
- **Inputs:** Gray-50 bg, border gray-200, rounded-xl, focus ring green
- **Responsive:** Tested at 360px–1440px width

---

## 7. Validation

### Frontend (per-step)
- Step 1: `school_name` and `npsn` non-empty
- Step 2: `admin_name` non-empty, `password` min 6, `password === confirm_password`
- Step 3: `agree_terms` checked

### Backend (final submit, unchanged)
- Required fields: school_name, npsn, admin_name, password
- Password match + min 6
- NPSN uniqueness check (DB query)
- Transaction with rollback on failure

---

## 8. Tests

- `php -l` seluruh project: 0 errors
- Backend logic: identical to previous version (transaction, settings, rules, kiosk)
- Frontend: multi-step navigation, validation per step, loading state on submit
- Success screen: displays on login.php after registration
- Regression: existing login, kiosk, attendance unaffected
