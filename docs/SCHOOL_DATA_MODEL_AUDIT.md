# SCHOOL DATA MODEL AUDIT

**Status:** ✅ MIGRATION EXECUTED (P2.2) — 21 Agustus 2026
**Date:** 21 Agustus 2026
**Task:** P2.1 (audit) → P2.2 (migration executed)

**P2.2 result:** All 4 missing columns added (nullable), `legal_consents`
table created with FKs, consent persistence wired in signup transaction.
Idempotency verified (2x run). E2E regression 139/139 PASS.
Signup UI for new fields = follow-up P2.3/P2.4.

---

## Requirement Gap Analysis

### 1. Kota/Kabupaten

| Requirement | Existing Field | Table | Usage | Action |
|-------------|----------------|-------|-------|--------|
| Kota/Kabupaten | — | — | — | **ADD** `city` varchar(100) ke `schools` |

Tidak ada field kota/kabupaten di mana pun.

### 2. Provinsi

| Requirement | Existing Field | Table | Usage | Action |
|-------------|----------------|-------|-------|--------|
| Provinsi | — | — | — | **ADD** `province` varchar(100) ke `schools` |

Tidak ada field provinsi di mana pun.

### 3. Kode Pos

| Requirement | Existing Field | Table | Usage | Action |
|-------------|----------------|-------|-------|--------|
| Kode Pos | — | — | — | **ADD** `postal_code` varchar(10) ke `schools` |

Tidak ada field kode pos di mana pun.

### 4. NIK/NIP Admin

| Requirement | Existing Field | Table | Usage | Action |
|-------------|----------------|-------|-------|--------|
| NIK Admin | — | — | — | **ADD** `nik` varchar(30) ke `users` |
| NIP Guru | `nip` | `teachers` | Teacher NIP | **KEEP** |

- `teachers.nip` ada tapi khusus guru. Admin belum tentu guru.
- `users.identifier` dipakai login (bukan NIK/NIP).
- **Lokasi terbaik:** `users.nik` (nullable) — admin adalah `users` record.

### 5. Email Sekolah

| Requirement | Existing Field | Table | Usage | Action |
|-------------|----------------|-------|-------|--------|
| Email sekolah | `email` | `schools` | Insert saat signup | **KEEP** |
| Email admin | `email` | `users` | Insert saat signup | **KEEP** |

`schools.email` SUDAH ADA — varchar(100), nullable. Tidak perlu kolom baru.

### 6. Terms & Privacy

| Requirement | Existing | Status | Action |
|-------------|----------|--------|--------|
| Terms page | — | Tidak ada | **CREATE** page |
| Privacy page | — | Tidak ada | **CREATE** page |
| Legal consent table | — | Tidak ada | **CREATE** `legal_consents` |
| Registration consent | checkbox only | Tidak disimpan | **STORE** di `legal_consents` |
| Agreement timestamp | — | Tidak ada | **STORE** di `legal_consents` |

- `register_school.php:21` punya `$agree_terms` checkbox.
- **TIDAK DISIMPAN ke database** — hanya client-side validation.
- Lihat: `docs/LEGAL_CONSENT_REQUIREMENT.md`

### 7. Data Normalization

#### 7a. Email — No duplication
`school_settings` tidak punya email. Hanya di `schools.email` dan `users.email`.

#### 7b. Address — DUPLICATE
`schools.address` + `school_settings.address`. Canonical: `schools.address`.

#### 7c. Location — DUPLICATE
`schools.latitude/longitude` + `school_settings.latitude/longitude`. Canonical: `schools`.

#### 7d. Radius — Resolved (P0.4)
3-level: `attendance_rules.radius_limit` > `school_settings.radiusMeters` > `schools.radius_meters`.

#### 7e. Phone — Different concepts
`schools.phone` = school phone. `school_settings.operatorPhone` = operator phone. No conflict.

### 8. Province/City Master Data

Tidak ada master data. Decision: gunakan varchar biasa (bukan lookup table).

---

## Canonical Source Summary

| Concept | Canonical Source | Fallback | Writer |
|---------|-----------------|----------|--------|
| School name | `schools.name` | `school_settings.schoolName` | admin/settings.php |
| NPSN | `schools.npsn` | `school_settings.npsn` | admin/settings.php |
| Level | `schools.level` | `school_settings.schoolLevel` | admin/settings.php |
| Address | `schools.address` | `school_settings.address` | admin/settings.php |
| Email | `schools.email` | — | register_school.php |
| Phone | `schools.phone` | — | register_school.php |
| Latitude | `schools.latitude` | `school_settings.latitude` | admin/settings.php |
| Longitude | `schools.longitude` | `school_settings.longitude` | admin/settings.php |
| Radius | attendance_rules > school_settings > schools | 3-level | rules.php, settings.php |
| Logo | `schools.logo_url` | — | admin/settings.php |
| **City** | `schools.city` (NEW) | — | register_school.php |
| **Province** | `schools.province` (NEW) | — | register_school.php |
| **Postal code** | `schools.postal_code` (NEW) | — | register_school.php |
| **Admin NIK** | `users.nik` (NEW) | — | register_school.php |

---

## Signup Field Mapping

### Step 1: Informasi Sekolah

| Current Field | DB Column | After Migration |
|---------------|-----------|-----------------|
| school_name | `schools.name` | KEEP |
| npsn | `schools.npsn` | KEEP |
| level | `schools.level` | KEEP |
| address | `schools.address` | KEEP |
| email_sekolah | `schools.email` | KEEP |
| phone_sekolah | `schools.phone` | KEEP |
| — | `schools.city` | ADD input |
| — | `schools.province` | ADD input |
| — | `schools.postal_code` | ADD input |

### Step 2: Admin Sekolah

| Current Field | DB Column | After Migration |
|---------------|-----------|-----------------|
| admin_name | `users.full_name` | KEEP |
| identifier | `users.identifier` | KEEP |
| email | `users.email` | KEEP |
| phone | `users.phone` | KEEP |
| password | `users.password_hash` | KEEP |
| — | `users.nik` | ADD input |

---

## Existing Data Impact

| Field | Default | Existing Data | Safe? |
|-------|---------|---------------|-------|
| `schools.city` | NULL | Empty for all schools | YES |
| `schools.province` | NULL | Empty for all schools | YES |
| `schools.postal_code` | NULL | Empty for all schools | YES |
| `users.nik` | NULL | Empty for all users | YES |

All new columns are nullable. No data loss. Backward compatible.

---

## FINAL STATUS

**Existing fields reusable:** 12 (schools.name, npsn, level, address, email, phone, latitude, longitude, radius_meters, logo_url, users.email, users.phone)

**Fields truly missing:** 4 (schools.city, schools.province, schools.postal_code, users.nik)

**Migration required:** YES (4 ALTER TABLE statements)

**Risk:** LOW (all nullable, no data loss, backward compatible)
