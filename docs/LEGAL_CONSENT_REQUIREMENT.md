# LEGAL CONSENT REQUIREMENT

**Status:** ✅ FULLY IMPLEMENTED (P2.4)
**Date:** 21 Agustus 2026
**Task:** P2.1 (design) → P2.2 (table + persistence) → P2.4 (pages + viewer + versioning)

---

## Implementation Status (P2.4 — COMPLETE)

| Item | Status |
|------|--------|
| `legal_consents` table | ✅ Created (migration executed P2.2) |
| FK to schools + users (CASCADE) | ✅ Verified |
| Consent persistence in `register_school.php` | ✅ Wired inside transaction (P2.2) |
| Version constants (`TERMS_VERSION`, `PRIVACY_VERSION`) | ✅ `config/helpers.php` (P2.4) |
| Terms page (`/terms.php`) | ✅ Public, green/white layout (P2.4) |
| Privacy page (`/privacy.php`) | ✅ Public, green/white layout (P2.4) |
| Two separate checkboxes with page links | ✅ `register_school.php` Step 3 (P2.4) |
| PHP + JS validation (both checkboxes) | ✅ Backend + frontend enforced (P2.4) |
| Consent version from constants (not hardcoded) | ✅ `TERMS_VERSION`/`PRIVACY_VERSION` (P2.4) |
| Admin consent viewer (`admin/consents.php`) | ✅ Tenant-scoped, paginated (P2.4) |
| Sidebar menu entry | ✅ "Legal & Persetujuan" under "Laporan & Sistem" (P2.4) |

**Persistence detail:** `register_school.php` captures `$new_user_id` after admin
insert and writes 2 rows (`terms` + `privacy`, versions from constants, IP + user-agent)
**inside the registration transaction** — if either insert fails, the whole registration
rolls back. No silent workaround.

---

## Current State (P2.4 — COMPLETE)

- `auth/register_school.php:28-29` — two separate checkboxes: `agree_terms` + `agree_privacy`
- Validation: `if (!$agree_terms || !$agree_privacy)` → error
- Backend inserts 2 rows per registration using `TERMS_VERSION` / `PRIVACY_VERSION` constants
- `/terms.php` — public, no auth, green/white layout, version displayed in header
- `/privacy.php` — public, no auth, green/white layout, version displayed in header
- `admin/consents.php` — tenant-scoped table viewer with pagination (20/page)
- Sidebar: "Legal & Persetujuan" under "Laporan & Sistem"
- E2E 139/139 PASS after P2.4 changes

---

## Requirements

### 1. Terms & Privacy Pages

| Page | Route | Content | Status |
|------|-------|---------|--------|
| Syarat & Ketentuan | `/pages/terms.php` | Terms of service | NEEDED |
| Kebijakan Privasi | `/pages/privacy.php` | Privacy policy | NEEDED |

### 2. Legal Consent Table

Create `legal_consents` table to record user agreement:

```sql
CREATE TABLE legal_consents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    consent_type ENUM('terms', 'privacy') NOT NULL,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    ip_address VARCHAR(45),
    user_agent VARCHAR(250),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_legal_consent_school (school_id),
    KEY idx_legal_consent_user (user_id),
    CONSTRAINT fk_consent_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Registration Flow Update

- Checkbox links to terms.php and privacy.php (open in new tab)
- On submit: insert into `legal_consents` for both terms and privacy
- Store: school_id, user_id, consent_type, consent_version, ip_address, user_agent

### 4. Consent Version

- Version constants defined in `config/helpers.php`: `TERMS_VERSION = '2026-08-21-v1'`, `PRIVACY_VERSION = '2026-08-21-v1'`
- Used in consent inserts (no hardcoded strings)
- If terms/privacy change, update constants → new registrations use new version
- Version displayed in page headers for user visibility
- If terms change, users must re-agree on next login (re-consent flow not yet implemented — P3)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | DB table (not session) | Permanent record, audit trail |
| Version tracking | consent_version column | Enable re-consent on update |
| IP/User-Agent | Stored | Legal evidence of consent |
| Pages | Simple PHP files | No CMS needed, static content |
| Links | Open in new tab | Don't lose form data |

---

## Implementation Scope — ALL COMPLETE

1. ✅ `legal_consents` table created (migration, P2.2)
2. ✅ `terms.php` at project root (public, no auth, P2.4)
3. ✅ `privacy.php` at project root (public, no auth, P2.4)
4. ✅ `register_school.php` — two checkboxes with links + backend inserts with version constants (P2.4)
5. ✅ `admin/consents.php` — consent viewer, tenant-scoped, paginated (P2.4)
6. ✅ Sidebar menu entry added (P2.4)

---

## NOT in Scope

- Legal content writing (use placeholder)
- Consent re-agreement flow
- Cookie consent banner
- GDPR compliance (Indonesian context)
