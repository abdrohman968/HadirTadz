# SCHOOL DATA MIGRATION PLAN

**Status:** ✅ EXECUTED (P2.2) — 21 Agustus 2026
**Date:** 21 Agustus 2026
**Task:** P2.1 (plan) → P2.2 (execution)

---

## Execution Result

| Item | Status |
|------|--------|
| `schools.city` varchar(100) NULL | ✅ Added |
| `schools.province` varchar(100) NULL | ✅ Added |
| `schools.postal_code` varchar(10) NULL | ✅ Added |
| `users.nik` varchar(30) NULL | ✅ Added |
| `legal_consents` table + 2 FKs | ✅ Created |
| Idempotency (run 2x) | ✅ PASS — no duplicate errors |
| Existing data intact | ✅ schools=2, users=9 unchanged |
| PHP lint | ✅ 41 files, 0 errors |
| E2E regression (P1.4) | ✅ 139/139 PASS |
| Functional consent test | ✅ 9/9 PASS |

Migration mechanism: existing `ensure_column()` in `database/migrate.php`
(checks `SHOW COLUMNS` before ALTER) + `CREATE TABLE IF NOT EXISTS`.
No new migration framework introduced.

---

## 1. Current Schema (schools)

```sql
schools:
  id, school_code, npsn, name, level, address, phone, email,
  logo_url, latitude, longitude, radius_meters, is_active,
  created_at, updated_at, deleted_at
```

## 2. Current Schema (users)

```sql
users:
  id, school_id, role_id, identifier, full_name, password_hash,
  email, phone, avatar_url, status, last_login_at,
  created_at, updated_at, deleted_at
```

## 3. Target Schema

### schools — ADD 3 columns

| Column | Type | Nullable | Default | After |
|--------|------|----------|---------|-------|
| `city` | varchar(100) | YES | NULL | `address` |
| `province` | varchar(100) | YES | NULL | `city` |
| `postal_code` | varchar(10) | YES | NULL | `province` |

### users — ADD 1 column

| Column | Type | Nullable | Default | After |
|--------|------|----------|---------|-------|
| `nik` | varchar(30) | YES | NULL | `phone` |

### legal_consents — NEW table

```sql
CREATE TABLE IF NOT EXISTS `legal_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `consent_type` enum('terms','privacy') NOT NULL,
  `consent_version` varchar(20) NOT NULL DEFAULT '1.0',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(250) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consent_school` (`school_id`),
  KEY `idx_consent_user` (`user_id`),
  CONSTRAINT `fk_consent_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Migration SQL

```sql
-- P2.1: School Data Model Enhancement
-- Safe: all columns nullable, no data loss

-- Add city/province/postal_code to schools
ALTER TABLE `schools`
  ADD COLUMN `city` varchar(100) DEFAULT NULL AFTER `address`,
  ADD COLUMN `province` varchar(100) DEFAULT NULL AFTER `city`,
  ADD COLUMN `postal_code` varchar(10) DEFAULT NULL AFTER `province`;

-- Add nik to users
ALTER TABLE `users`
  ADD COLUMN `nik` varchar(30) DEFAULT NULL AFTER `phone`;

-- Create legal_consents table
CREATE TABLE IF NOT EXISTS `legal_consents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `consent_type` enum('terms','privacy') NOT NULL,
  `consent_version` varchar(20) NOT NULL DEFAULT '1.0',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(250) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consent_school` (`school_id`),
  KEY `idx_consent_user` (`user_id`),
  CONSTRAINT `fk_consent_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. Existing Data Impact

| Change | Impact | Risk |
|--------|--------|------|
| `schools.city` ADD | NULL for all existing schools | NONE |
| `schools.province` ADD | NULL for all existing schools | NONE |
| `schools.postal_code` ADD | NULL for all existing schools | NONE |
| `users.nik` ADD | NULL for all existing users | NONE |
| `legal_consents` CREATE | Empty table | NONE |

**No existing data is modified. No columns are dropped. No rows are deleted.**

---

## 6. Rollback Strategy (MANUAL PROCEDURE — not automated)

**JANGAN jalankan otomatis di production.** Rollback bersifat manual dan
harus dievaluasi terhadap data yang sudah terkumpul setelah go-live.

### Pre-conditions check (WAJIB sebelum rollback)

```sql
-- 1. Apakah ada signup baru yang mengisi kolom baru?
SELECT COUNT(*) FROM schools WHERE city IS NOT NULL OR province IS NOT NULL OR postal_code IS NOT NULL;
SELECT COUNT(*) FROM users WHERE nik IS NOT NULL;

-- 2. Apakah ada consent records?
SELECT COUNT(*) FROM legal_consents;
```

### Skenario A — Belum ada data baru (semua NULL, consents = 0)

Aman untuk rollback penuh:

```sql
ALTER TABLE `schools` DROP COLUMN `city`;
ALTER TABLE `schools` DROP COLUMN `province`;
ALTER TABLE `schools` DROP COLUMN `postal_code`;
ALTER TABLE `users` DROP COLUMN `nik`;
DROP TABLE IF EXISTS `legal_consents`;
```

Lalu hapus blok P2.2 dari `database/migrate.php` + `database/schema.sql`
agar migrasi berikutnya tidak menambahkan kembali.

### Skenario B — Sudah ada data baru (signup post-migration)

1. **Export dulu** data yang akan hilang:
   ```sql
   CREATE TABLE backup_schools_geo AS
     SELECT id, city, province, postal_code FROM schools
     WHERE city IS NOT NULL OR province IS NOT NULL OR postal_code IS NOT NULL;
   CREATE TABLE backup_users_nik AS
     SELECT id, nik FROM users WHERE nik IS NOT NULL;
   CREATE TABLE backup_legal_consents AS SELECT * FROM legal_consents;
   ```
2. Simpan dump tabel backup (`mysqldump`).
3. Baru jalankan DROP seperti Skenario A.
4. Restore data ke sistem lain/laporan bila diperlukan.

### Skenario C — Rollback kode saja (kolom dipertahankan)

Jika hanya ingin menonaktifkan fitur tanpa kehilangan data:
biarkan kolom/tabel tetap ada; cukup revert perubahan aplikasi
(`register_school.php`, form admin). Kolom NULL tidak mengganggu flow existing.

---

## 7. Test Strategy

1. Run migration on dev database
2. Verify new columns exist: `SHOW COLUMNS FROM schools LIKE 'city'`
3. Verify new columns are nullable: `SELECT city FROM schools LIMIT 1`
4. Verify legal_consents table: `SHOW TABLES LIKE 'legal_consents'`
5. Run E2E test: `php tests/e2e_auth.php` — should pass unchanged
6. Test signup flow: register new school, verify city/province/postal_code stored
7. Test admin settings: verify city/province/postal_code editable
8. Verify existing schools unaffected
9. Rollback and re-run to verify reversibility

---

## 8. Files Changed (P2.2 — actual)

| File | Change | Status |
|------|--------|--------|
| `database/schema.sql` | 3 columns in schools, `nik` in users, `legal_consents` table (section 15) | ✅ |
| `database/migrate.php` | CREATE TABLE updated + `ensure_column()` calls + legal_consents CREATE IF NOT EXISTS | ✅ |
| `auth/register_school.php` | Capture `$new_user_id`; insert 2 consent rows (terms+privacy) inside transaction | ✅ |
| Signup UI (city/province/postal/nik inputs) | NOT added — follow-up P2.3/P2.4 per task scope | ⏳ Follow-up |

**Signup UI note:** backend consent persistence is live (checkbox already existed
and was validated). New profile fields are stored in DB but not yet exposed in
the signup form — documented as follow-up, no hidden workaround added.
