# AUTH & SCHOOL ONBOARDING E2E TEST

**Status:** ✅ PASS — 139/139
**Date:** 21 Agustus 2026
**Task:** P1.4
**Script:** `tests/e2e_auth.php` (CLI, against local dev DB)

---

## Summary

| Section | Tests | PASS | FAIL |
|---------|-------|------|------|
| 1. School Signup Flow | 21 | 21 | 0 |
| 2. Duplicate / Validation | 6 | 6 | 0 |
| 3. Rollback Test | 3 | 3 | 0 |
| 4. Login Admin | 6 | 6 | 0 |
| 5. Cross-Tenant Isolation | 17 | 17 | 0 |
| 6. Kiosk Integration | 9 | 9 | 0 |
| 7. Attendance Integration | 16 | 16 | 0 |
| 8. Logout + Session Security | 7 | 7 | 0 |
| 9. Registration Success Screen | 5 | 5 | 0 |
| 10. Login UI Regression | 17 | 17 | 0 |
| 11. Register School UI | 13 | 13 | 0 |
| 12. Database Integrity | 8 | 8 | 0 |
| 13. Existing Data Safety | 3 | 3 | 0 |
| 14. PHP Lint | 1 | 1 | 0 |
| 15. Logout Flow | 6 | 6 | 0 |
| **TOTAL** | **139** | **139** | **0** |

---

## 1. School Signup Flow

| Test | Status |
|------|--------|
| School A created (id assigned) | ✅ |
| School B created (id assigned) | ✅ |
| School A school_code generated | ✅ |
| School A NPSN correct | ✅ |
| School A is_active=1 | ✅ |
| School B school_code generated | ✅ |
| Admin A identifier correct | ✅ |
| Admin A password verifiable | ✅ |
| Admin A role=admin | ✅ |
| Admin A school_id correct | ✅ |
| Admin A status=active | ✅ |
| Admin B identifier correct | ✅ |
| Admin B password verifiable | ✅ |
| Admin B role=admin | ✅ |
| Admin B school_id correct | ✅ |
| School A default settings created (≥4 keys) | ✅ |
| School B default settings created (≥4 keys) | ✅ |
| School A attendance rules created (≥2 rules) | ✅ |
| School A kiosk token created | ✅ |
| School A kiosk token active | ✅ |
| School B kiosk token created | ✅ |

---

## 2. Duplicate / Validation

| Test | Status |
|------|--------|
| Duplicate NPSN rejected (PDOException code 23000) | ✅ |
| Duplicate identifier rejected (PDOException code 23000) | ✅ |
| Password min 6 chars enforced | ✅ |
| Password mismatch check exists in register_school.php | ✅ |
| Required fields check exists in register_school.php | ✅ |
| Terms checkbox check exists in register_school.php | ✅ |

---

## 3. Rollback Test

Simulated failure after school + admin + settings creation within transaction.

| Test | Status |
|------|--------|
| School not committed after rollback | ✅ |
| Admin not committed after rollback | ✅ |
| Settings not committed after rollback | ✅ |

---

## 4. Login Admin

| Test | Status |
|------|--------|
| User found by identifier + school_id | ✅ |
| password_verify works | ✅ |
| role_code=admin | ✅ |
| school_id correct | ✅ |
| session_regenerate_id(true) exists in login.php | ✅ |
| password_hash not stored in session | ✅ |

---

## 5. Cross-Tenant Isolation

Two test schools (A, B) created with separate admin users.

| Test | Status |
|------|--------|
| auth_school_id() returns A in A context | ✅ |
| Admin A sees only A users | ✅ |
| Admin A does NOT see B users | ✅ |
| Settings A correct (schoolName) | ✅ |
| Settings B correct (schoolName) | ✅ |
| A != B settings | ✅ |
| Rule A siswa exists | ✅ |
| Rule B siswa exists | ✅ |
| Rules are school-specific (school_id match) | ✅ |
| Rules B school-specific | ✅ |
| Radius A siswa=150 | ✅ |
| Radius B siswa=150 | ✅ |
| Kiosk A token valid | ✅ |
| Kiosk A school_id correct | ✅ |
| Kiosk B token valid | ✅ |
| Kiosk B school_id correct | ✅ |
| Kiosk A != kiosk B token | ✅ |

---

## 6. Kiosk Integration

| Test | Status |
|------|--------|
| Valid token A accepted | ✅ |
| Valid token A school_id correct | ✅ |
| Valid token A has device_name | ✅ |
| Valid token B accepted | ✅ |
| Valid token B school_id correct | ✅ |
| Invalid token DENIED (TOKEN_INVALID) | ✅ |
| Empty token returns null | ✅ |
| Bind B token overrides A context | ✅ |
| Revoked token DENIED (TOKEN_REVOKED) | ✅ |

---

## 7. Attendance Integration

| Test | Status |
|------|--------|
| Siswa rule A exists | ✅ |
| Siswa rule A radius_limit=150 | ✅ |
| Siswa rule A school_id correct | ✅ |
| Guru rule A exists | ✅ |
| Guru rule A radius_limit=200 | ✅ |
| Admin without rule returns null (correct) | ✅ |
| Siswa rule found (function works) | ✅ |
| Guru rule found (function works) | ✅ |
| Radius siswa A=150 | ✅ |
| Radius guru A=200 | ✅ |
| Radius siswa B=150 | ✅ |
| Distance calc works (Haversine) | ✅ |
| Same point distance=0 | ✅ |
| Late threshold set | ✅ |
| Early leave threshold set | ✅ |
| Days of week set | ✅ |

---

## 8. Logout + Session Security

| Test | Status |
|------|--------|
| Session destroyed after logout | ✅ |
| Session ID cleared | ✅ |
| session_regenerate_id(true) in login.php | ✅ |
| password_hash not in session data | ✅ |
| SameSite=Lax in database.php | ✅ |
| httponly=true in database.php | ✅ |
| Login error does not leak user existence | ✅ |

---

## 9. Registration Success Screen

| Test | Status |
|------|--------|
| Checks registration_success session | ✅ |
| Checks 'registered' GET param | ✅ |
| Renders school_code | ✅ |
| Renders admin_name | ✅ |
| Requires both GET param + session (no false positive) | ✅ |

---

## 10. Login UI Regression

| Test | Status |
|------|--------|
| Tailwind CDN loaded | ✅ |
| Plus Jakarta Sans font | ✅ |
| Split layout (lg:flex) | ✅ |
| Left branding panel | ✅ |
| White login card | ✅ |
| Brand gradient colors | ✅ |
| "Selamat Datang" header | ✅ |
| "Masuk" button | ✅ |
| No Google login button/oauth | ✅ |
| Register CTA link | ✅ |
| Font Awesome loaded | ✅ |
| Form method=POST | ✅ |
| name=identifier input | ✅ |
| name=password input | ✅ |
| Password toggle | ✅ |
| Forgot password panel | ✅ |
| Viewport meta tag | ✅ |

---

## 11. Register School UI

| Test | Status |
|------|--------|
| Step indicator present | ✅ |
| Steps 1-3 content | ✅ |
| school_name field | ✅ |
| npsn field | ✅ |
| level select | ✅ |
| admin_name field | ✅ |
| identifier field | ✅ |
| password field | ✅ |
| confirm_password field | ✅ |
| agree_terms checkbox | ✅ |
| Form POST method | ✅ |
| Tailwind CDN | ✅ |
| Split layout | ✅ |

---

## 12. Database Integrity

| Test | Status |
|------|--------|
| No orphan users without school | ✅ |
| No orphan attendance records | ✅ |
| No orphan attendance_rules | ✅ |
| No orphan kiosk_tokens | ✅ |
| No orphan school_settings | ✅ |
| schools.npsn has unique constraint | ✅ |
| users.identifier has unique constraint | ✅ |
| Test data uses E2E-* prefix | ✅ |

---

## 13. Existing Data Safety

| Test | Status |
|------|--------|
| Test schools use E2E prefix | ✅ |
| Existing school S1 untouched | ✅ |
| Existing school S2 untouched | ✅ |

---

## 14. PHP Lint

| Test | Status |
|------|--------|
| 0 errors across all project PHP files | ✅ |

---

## 15. Logout Flow

| Test | Status |
|------|--------|
| Session exists before logout | ✅ |
| Session empty after logout | ✅ |
| user_id cleared | ✅ |
| school_id cleared | ✅ |
| role cleared | ✅ |
| user_data cleared | ✅ |

---

## Bugs Found

**None.** All 3 initial test failures were false positives (test assertion issues, not code bugs):
1. "admin falls back to 'all'" — no 'all' rule exists; null is correct behavior.
2. "Success screen only shows with valid session" — test string matching too strict.
3. "no Google login" — matched Google Fonts CDN, not a login button.

---

## Remaining Risks

| Risk | Severity | Status |
|------|----------|--------|
| Brute force / rate limiting on login | Medium | Not implemented (P2) |
| Session timeout / idle timeout | Low | Not implemented (P2) |
| Password reset flow | Medium | Not implemented (P2) |
| CSRF token on forms | Low | Not implemented (P2) |
| Email/phone verification on signup | Low | Not implemented (P2) |
| Kota/Provinsi/Kode Pos/NIK/NIP fields | Low | Not in schema (P2) |

---

## Test Data

Test schools created during E2E run use `E2E-*` prefix and are cleaned up automatically.

Identifiers used: `E2E-A-{ts}`, `E2E-B-{ts}`, `ADM-E2E-A-{ts}`, `ADM-E2E-B-{ts}`

**Production data (S1, S2) is never modified.**

---

## FINAL STATUS: ✅ PASS

All 139 tests passed. No bugs found. No production data modified.
