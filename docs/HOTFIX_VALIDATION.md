# HOTFIX PHASE 1 — CRITICAL FINDINGS VALIDATION & REPAIR

**Date:** 2026-08-22
**Previous Status:** RELEASE CANDIDATE — READY
**Action:** Full audit validation of 6 critical findings

---

## Validation Results

| ID | Finding | Status | Evidence | Action |
|----|---------|--------|----------|--------|
| C1 | profile.php password_verify on null | **CONFIRMED** | `config/auth.php:32` does `unset($user['password_hash'])`. `login.php:44` same. `profile.php:38` calls `password_verify($pass, $user['password_hash'])` where key is undefined → always false. | **FIXED** — Query hash from DB via `SELECT password_hash FROM users WHERE id = ?` |
| C2 | consents.php LIMIT/OFFSET PDO crash | **CONFIRMED** | `database.php:27` sets `PDO::ATTR_EMULATE_PREPARES => false`. `consents.php:24` uses `LIMIT ? OFFSET ?` with `execute([...])`. MySQL native prepares require `PDO::PARAM_INT` for LIMIT/OFFSET. | **FIXED** — Changed to string interpolation: `LIMIT $per_page OFFSET $offset` (safe: both are int-cast from PHP) |
| C3 | permissions.php tenant scope missing | **CONFIRMED** | `permissions.php:84` main listing query: `WHERE p.deleted_at IS NULL` — no `school_id` filter. Leaks all tenants' permission data. Approve/reject ops (lines 20-31) DO use `$school_id`, but listing does not. | **FIXED** — Added `AND p.school_id = ?` to main query, converted to prepared statement |
| C4 | scan_process.php kiosk auth bypass | **STALE** | `scan_process.php:25` calls `kiosk_validate_token()`. Token validated when provided (lines 27-44). Empty token falls back to `auth_school_id()` (line 49) — intentional backward compat per P0.3. Cross-school rejection at lines 78-90. | **NO ACTION** — P0.3 kiosk token system working as designed |
| C5 | migrate.php public HTTP access | **CONFIRMED** | `migrate.php:8-12` detects CLI via `php_sapi_name()` but only renders HTML when NOT CLI — does NOT block execution. Script runs fully via HTTP with full DB access. | **FIXED** — HTTP access now returns 403 + exits. CLI-only. |
| C6 | Dead links from <?= ?> in PHP strings | **CONFIRMED** | 4 admin pages embed `<?= $base_url ?>` inside PHP single-quoted strings passed to `ds_page_header()`. Short echo tags are NOT parsed inside PHP strings → rendered as literal text. | **FIXED** — Replaced with PHP concatenation (`' . $base_url . '`) in all 4 files |

---

## Files Changed

| File | Change |
|------|--------|
| `auth/profile.php` | C1: Query `password_hash` from DB instead of undefined session key |
| `admin/consents.php` | C2: LIMIT/OFFSET string interpolation instead of `?` placeholders |
| `admin/permissions.php` | C3: Added `AND p.school_id = ?` filter + converted to prepared statement |
| `database/migrate.php` | C5: HTTP access blocked with `http_response_code(403)` + `exit(1)` |
| `admin/attendance.php` | C6: Fixed export link `<?= $base_url ?>` → `' . $base_url . '` |
| `admin/students.php` | C6: Fixed "Cetak Kartu" link `<?= $base_url ?>` → `' . $base_url . '` |
| `admin/kiosk.php` | C6: Fixed "Kembali" link `<?= $base_url ?>` → `' . $base_url . '` |
| `admin/reports.php` | C6: Fixed CSV export link `<?= urlencode(...) ?>` → `' . urlencode(...) . '` |

---

## Verification

| Test | Result |
|------|--------|
| `php -l` entire project (all .php files) | **0 errors** |
| `tests/e2e_auth.php` | **139/139 PASS** |
| Cross-tenant isolation | **PASS** (e2e section 5) |
| Kiosk token validation | **PASS** (e2e section 6) |
| Session security | **PASS** (e2e section 8) |

---

## Security Regression Check

| Check | Status |
|-------|--------|
| Tenant isolation (school_id scoping) | **PASS** — permissions now scoped, e2e confirms |
| Role authorization | **PASS** — all pages require correct role |
| Session security (httponly, SameSite, regenerate) | **PASS** |
| Kiosk token validation | **PASS** — e2e section 6 confirms |
| DB credential leakage | **Known** — `database.php:39,42` still leaks in error messages (not in scope for this hotfix) |

---

## Release Status

**READY** — 5 confirmed critical findings fixed, 1 stale finding dismissed. All tests pass. No architecture changes. No new features.
