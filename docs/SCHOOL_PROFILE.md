# SCHOOL PROFILE — P2.3 DATA COMPLETION

**Status:** ✅ SELESAI — 21 Agustus 2026
**Task:** P2.3

---

## Fields Integrated

### schools table

| Field | Type | Nullable | Signup | Admin Settings | Canonical |
|-------|------|----------|--------|----------------|-----------|
| `name` | varchar(150) | NO | Step 1 | Profil Sekolah | `schools.name` |
| `npsn` | varchar(20) | NO | Step 1 | Profil Sekolah | `schools.npsn` |
| `level` | enum | NO | Step 1 (select) | Profil Sekolah (select) | `schools.level` |
| `address` | text | YES | Step 1 | Profil Sekolah | `schools.address` |
| `city` | varchar(100) | YES | Step 1 **NEW** | Profil Sekolah **NEW** | `schools.city` |
| `province` | varchar(100) | YES | Step 1 **NEW** | Profil Sekolah **NEW** | `schools.province` |
| `postal_code` | varchar(10) | YES | Step 1 **NEW** | Profil Sekolah **NEW** | `schools.postal_code` |
| `email` | varchar(100) | YES | Step 1 (email_sekolah) | Profil Sekolah (schoolEmail) | `schools.email` |
| `phone` | varchar(30) | YES | Step 1 (phone_sekolah) | Profil Sekolah (schoolPhone) | `schools.phone` |
| `logo_url` | varchar(255) | YES | — | Profil Sekolah (text input) | `schools.logo_url` |

### users table

| Field | Type | Nullable | Signup | Admin Settings | Canonical |
|-------|------|----------|--------|----------------|-----------|
| `nik` | varchar(30) | YES | Step 2 **NEW** | — | `users.nik` |
| `email` | varchar(100) | YES | Step 2 (admin) | — | `users.email` |

---

## Signup Changes (register_school.php)

### Step 1 — Informasi Sekolah

| Input | POST key | DB column |
|-------|----------|-----------|
| Nama Sekolah | `school_name` | `schools.name` |
| NPSN | `npsn` | `schools.npsn` |
| Jenjang | `level` | `schools.level` |
| Alamat | `address` | `schools.address` |
| **Kota/Kabupaten** | `city` | `schools.city` |
| **Provinsi** | `province` | `schools.province` |
| **Kode Pos** | `postal_code` | `schools.postal_code` |
| Email Sekolah | `email_sekolah` | `schools.email` |
| No. Telepon Sekolah | `phone_sekolah` | `schools.phone` |

### Step 2 — Admin Sekolah

| Input | POST key | DB column |
|-------|----------|-----------|
| Nama Lengkap Admin | `admin_name` | `users.full_name` |
| **NIK / NIP Admin** | `nik` | `users.nik` |
| Username / ID Admin | `identifier` | `users.identifier` |
| Email Admin | `email` | `users.email` |
| No. WhatsApp | `phone` | `users.phone` |
| Kata Sandi | `password` | `users.password_hash` |

### Bug Fixed

Previously `schools.email` stored admin's email and `schools.phone` stored admin's phone.
Now `schools.email/phone` = institusi (email_sekolah/phone_sekolah from UI),
`users.email/phone` = admin's personal contact.

### Server-side Validation

| Field | Rule | Error |
|-------|------|-------|
| city | max 100 chars | Kota/Kabupaten maksimal 100 karakter |
| province | max 100 chars | Provinsi maksimal 100 karakter |
| postal_code | max 10 chars | Kode Pos maksimal 10 karakter |
| nik | max 30 chars | NIK/NIP Admin maksimal 30 karakter |
| email_sekolah | max 100 chars | Email Sekolah maksimal 100 karakter |
| phone_sekolah | max 30 chars | No. Telepon Sekolah maksimal 30 karakter |

---

## Admin Settings (admin/settings.php)

### Profile Section

Reads directly from `schools` table (canonical source).
NOT from `school_settings` (legacy location only).

```php
$school_id = auth_school_id(); // session-derived, NOT $_POST
$school_row = $pdo->query("SELECT * FROM schools WHERE id = $school_id")->fetch();
```

### Write-through Sync

On save, profile fields go to `schools` table AND legacy setting keys
(`schoolName`, `npsn`, `schoolLevel`, `address`) are synced via `set_setting()`
to keep existing readers (cards.php, scan.php, header.php, etc.) consistent.
GPS/WhatsApp keys remain in `school_settings` as before.

### Tenant Isolation

`auth_school_id()` from session used for both SELECT and UPDATE.
No `$_POST['school_id']` accepted for profile operations.

---

## Existing Data Impact

- S1/S2: city, province, postal_code remain NULL until admin edits profile.
- No data deleted or mass-updated.
- All new columns already nullable (from P2.2 migration).

---

## Tests

| Test | Result |
|------|--------|
| P2.3 profile test (49 checks) | ✅ 49/49 PASS |
| P1.4 E2E regression | ✅ 139/139 PASS |
| PHP lint | ✅ 41 files, 0 errors |
