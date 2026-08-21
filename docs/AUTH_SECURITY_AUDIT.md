# AUTH SECURITY AUDIT — HADIR-TADZ (P1.1)

**Tipe tugas:** P1 Auth Stabilization — Final Authentication & Session Audit
**Tanggal:** 21 Agustus 2026
**Status:** ✅ Selesai
**Referensi:** P0.1–P0.4 (tenant isolation, attendance source, kiosk context)

---

## 1. AUTH FLOW ( aktual, bukan asumsi )

```
LOGIN (auth/login.php)
  ↓
POST identifier + password
  ↓
Query: SELECT user WHERE (identifier = ? OR email = ?) AND deleted_at IS NULL
  ↓
password_verify($password, $user['password_hash'])
  ↓
Status check: $user['status'] === 'active'
  ↓
Session creation:
  $_SESSION['user_id']    = $user['id']
  $_SESSION['role']       = $user['role_code']   ← dari JOIN roles
  $_SESSION['school_id']  = $user['school_id']
  $_SESSION['user_data']  = $user (TANPA password_hash)
  ↓
session_regenerate_id(true)  ← anti session fixation (P1.1 patch)
  ↓
UPDATE users SET last_login_at = NOW()
  ↓
log_audit('LOGIN', ...)
  ↓
redirect_to_dashboard($user['role_code'])
  ↓
admin → /admin/index.php
guru  → /guru/index.php
siswa → /siswa/index.php
```

**CATATAN:** Login tidak menggunakan `role_id` (numeric) — melainkan `role_code`
dari JOIN `roles` → kompatibel dengan multi-role tanpa hardcode ID.

---

## 2. SESSION SECURITY

### 2a. Session Start & Cookie Flags (P1.1 PATCHED)

| Parameter | Sebelum | Sesudah |
|-----------|---------|---------|
| `session_start()` | `database.php` default | `database.php` dengan `session_set_cookie_params()` |
| `SameSite` | ❌ tidak diset (PHP default = `None` atau `Lax` tergantung versi) | ✅ `Lax` |
| `HttpOnly` | ❌ tidak diset (PHP default = 0) | ✅ `true` |
| `Secure` | ❌ tidak diset | ✅ otomatis berdasarkan `$_SERVER['HTTPS']` |
| `session_regenerate_id` | ❌ tidak ada (session fixation) | ✅ `session_regenerate_id(true)` setelah login sukses |

### 2b. Session Timeout

- ❌ **Tidak ada** session timeout (session tidak expired sampai logout).
- Diterima untuk school attendance system (session lifetime = browser session).
- Risiko rendah: school context = network lokal / WiFi sekolah.
- Rekomendasi P2: tambahkan `last_activity` tracking + idle timeout 30 menit.

### 2c. Logout Flow

```
auth/logout.php
  ↓
auth_user() → ambil user untuk audit log
  ↓
log_audit('LOGOUT', ...)
  ↓
auth_logout():
  $_SESSION = []
  setcookie(session_name(), '', time() - 42000, ...)  ← expire cookie
  session_destroy()
  ↓
header("Location: login.php")
```

✅ Session dihancurkan lengkap + cookie di-expire + redirect ke login.

### 2d. Session Data Hygiene (P1.1 PATCHED)

- `password_hash` **tidak lagi disimpan** di `$_SESSION['user_data']`
  (dihapus via `unset($user['password_hash'])` di `login.php:43` dan
  `auth.php:32`).
- Data yang tersimpan: semua kolom user KECUALI password_hash.

---

## 3. SCHOOL CONTEXT

| Role | School Source | Verifikasi |
|------|--------------|------------|
| Admin | `$_SESSION['school_id']` dari login + `$_SESSION['user_data']['school_id']` | ✅ `auth_school_id()` prioritaskan user_data |
| Guru | Sama | ✅ |
| Siswa | Sama | ✅ |
| Kiosk | `$_SESSION['kiosk_school_id']` dari token validasi (P0.3) | ✅ Cross-school rejection aktif |

`auth_school_id()` resolution order:
1. `$_SESSION['kiosk_school_id']` (kiosk token)
2. `$_SESSION['user_data']['school_id']` (logged-in user)
3. `$_SESSION['active_school_id']` (fallback, if any)
4. Default `1` (legacy compat)

✅ Tidak ada cara bagi user untuk mengubah school_id setelah login (session di-set
oleh server, bukan input user).

---

## 4. ROLE SECURITY

### 4a. Role Resolution

- Login query JOIN `roles` → `role_code` (string, bukan numeric ID).
- Disimpan di `$_SESSION['role']` + `$_SESSION['user_data']['role_code']`.
- `require_auth($allowed_roles)` membandingkan `in_array($user['role_code'], $allowed_roles)`.
- Tidak ada hardcoded `role_id = X` di reader (hanya `register_school.php` yang
  INSERT dengan `role_id = 1` — acceptable karena admin selalu role pertama).

### 4b. Page Authorization Matrix

| Halaman | require_auth | Status |
|---------|-------------|--------|
| `admin/*.php` (12 file) | `['admin']` | ✅ |
| `guru/index.php, absen.php, riwayat.php, jurnal.php` | `['guru']` | ✅ |
| `guru/kelas.php` | `['guru', 'admin']` | ✅ (admin bisa akses kelas) |
| `siswa/*.php` (5 file) | `['siswa']` | ✅ |
| `auth/profile.php` | `[]` (any role) | ✅ |
| Root `index.php` | redirect to dashboard | ✅ |

### 4c. Cross-Role Access

- Admin akses halaman guru → `require_auth(['guru'])` → admin not in list →
  redirect ke admin dashboard. ✅
- Guru akses halaman admin → redirect ke guru dashboard. ✅
- Siswa akses halaman admin/guru → redirect ke siswa dashboard. ✅

### 4d. API Authorization

| API | Auth Check | Role Check | Status |
|-----|-----------|------------|--------|
| `api/checkin_self.php` | `auth_check()` | ❌ any logged-in user | ✅ (self check-in, user-scoped) |
| `api/stats.php` | `auth_check()` | ✅ `$role_code !== 'admin'` → Forbidden | ✅ |
| `api/scan_process.php` | token validation (P0.3) | cross-school rejection | ✅ |

---

## 5. REDIRECT SECURITY

| Skenario | Redirect Target | Loop Risk |
|----------|----------------|-----------|
| Login sukses | Dashboard sesuai role | ❌ (role page punya require_auth) |
| Logout | login.php | ❌ |
| Unauthenticated access | login.php | ❌ (login.php render form, tidak check auth) |
| Wrong role | Dashboard sendiri | ❌ (require_auth redirect to own dashboard) |
| Root index.php | Dashboard sesuai role | ❌ |
| Expired session | login.php | ❌ (auth_check false → redirect) |

✅ Tidak ada redirect loop.

---

## 6. PASSWORD SECURITY

| Aspek | Status | Detail |
|-------|--------|--------|
| Hashing | ✅ | `password_hash($password, PASSWORD_BCRYPT)` di `register_school.php:55` |
| Verification | ✅ | `password_verify($password, $user['password_hash'])` di `login.php:35` |
| Storage | ✅ | Hash tersimpan di kolom `password_hash`; tidak ada plaintext |
| Reset | ⚠️ | Tidak ada self-service reset — admin harus reset manual dari DB |
| Trim | ✅ (P1.1 patched) | `trim()` dihapus dari password input (login + register) |
| Min length | ✅ | 6 karakter di `register_school.php:26` |

**Catatan reset password:** Saat ini tidak ada fitur reset password otomatis.
Ini acceptable untuk school system di mana admin bisa akses DB langsung.
Rekomendasi P2: tambahkan admin-initiated reset (admin generate temporary
password → user wajib ganti saat login pertama).

---

## 7. LOGIN FAILURE

| Skenario | Error Message | Info Leakage |
|----------|--------------|-------------|
| Identifier tidak ditemukan | "ID Pengguna / Username atau Kata Sandi salah!" | ❌ tidak leak |
| Password salah | "ID Pengguna / Username atau Kata Sandi salah!" | ❌ tidak leak |
| Akun non-aktif | "Akun Anda sedang dinonaktifkan atau disuspend." | ⚠️ leak status (acceptable) |
| Field kosong | "Silakan masukkan ID Pengguna / Email dan Kata Sandi." | ❌ tidak leak |

✅ Error message **generic** — tidak membedakan "user tidak ada" vs "password
salah." Identical message untuk kedua kasus.

---

## 8. BRUTE FORCE / RATE LIMIT

| Proteksi | Status | Keterangan |
|----------|--------|-----------|
| Rate limiting | ❌ **TIDAK ADA** | Tidak ada pembatasan jumlah percobaan login |
| Account lockout | ❌ **TIDAK ADA** | Tidak ada lockout setelah N percobaan gagal |
| CAPTCHA | ❌ **TIDAK ADA** | Tidak ada CAPTCHA |
| Delay/backoff | ❌ **TIDAK ADA** | Tidak ada delay antar percobaan |

**Rekomendasi P2 (tidak diimplementasi sekarang):**
1. **Minimal:** Server-side rate limiter per IP (session/file-based): max 5
   percobaan per 15 menit. Bisa ditambahkan tanpa DB change (file-based counter).
2. **Medium:** Account lockout sementara (5 gagal → lock 15 menit). Perlu
   kolom `failed_attempts` + `locked_until` di `users`.
3. **Advanced:** CAPTCHA setelah 3 percobaan gagal (Google reCAPTCHA v3).

**Risiko saat ini:** Brute force hanya bisa dilakukan dari IP lokal/VPN sekolah.
Untuk deployment cloud, rate limiting WAJIB ditambahkan di P2.

---

## 9. REGISTER SCHOOL INTEGRATION

Flow `auth/register_school.php` (dalam transaction):

1. Validasi input (nama sekolah, NPSN, admin name, password match, min length)
2. Cek NPSN duplikat → reject jika sudah ada
3. `BEGIN TRANSACTION`
4. Insert `schools` (school_code auto-generate, NPSN, name, level, address, phone, email)
5. Insert `users` (school_id, role_id=1, identifier, full_name, password_hash, email, phone, status='active')
6. Insert `school_settings` (16 keys: schoolName, npsn, level, address, GPS, radius, times, operator)
7. Insert `attendance_rules` (2 rows: siswa + guru, termasuk radius_limit)
8. Insert `kiosk_tokens` (1 token, resilient jika tabel belum ada)
9. `COMMIT`
10. Flash success + redirect ke login

**Temuan:**
- ✅ Transaction aman (rollback on exception)
- ✅ password_hash di-hash sebelum insert
- ✅ role_id hardcoded = 1 (admin) — acceptable karena admin selalu role pertama
- ⚠️ **Identifier admin tidak dicek unik** — jika dua sekolah daftar dengan
  identifier sama, login akan ambigu (query LIMIT 1). Risiko rendah karena
  identifier auto-generate (`ADM-XXX`) jika kosong.
- ✅ Default settings/rules lengkap saat sekolah baru dibuat

---

## 10. PERUBAHAN FILE (P1.1)

| File | Perubahan | Severity |
|------|-----------|----------|
| `config/database.php` | `session_set_cookie_params()` — tambah SameSite=Lax, HttpOnly=true, Secure otomatis | MEDIUM |
| `auth/login.php` | `session_regenerate_id(true)` setelah login sukses | CRITICAL |
| `auth/login.php` | `unset($user['password_hash'])` sebelum simpan ke session | LOW |
| `auth/login.php` | Hapus `trim()` dari password input | LOW |
| `config/auth.php` | `unset($user['password_hash'])` di `auth_user()` saat refresh dari DB | LOW |
| `auth/register_school.php` | Hapus `trim()` dari password + confirm_password | LOW |

**TIDAK diubah:**
- `auth/logout.php` — sudah benar (audit log → destroy → redirect)
- `includes/sidebar.php` — menu visibility berbasis role_code ✓
- `includes/bottom_nav.php` — role-based navigation ✓
- `admin/*` / `guru/*` / `siswa/*` — semua sudah `require_auth([role])` ✓
- `api/checkin_self.php` — `auth_check()` saja (self-scoped) ✓
- `api/stats.php` — sudah cek admin role ✓

---

## 11. TEST

### 11a. PHP Lint

Semua file yang diubah → `php -l` → 0 errors.

### 11b. Session Fixation

- Login sukses → `session_regenerate_id(true)` → session ID berubah.
- Session lama tidak valid setelah login baru.
- ✅ Session fixation termitigasi.

### 11c. Cookie Flags

- `session_set_cookie_params` sebelum `session_start()` → setiap session
  cookie baru akan punya flag SameSite=Lax, HttpOnly=true.
- ✅ Cookie flags aktif.

### 11d. Password Hash in Session

- Login → `$_SESSION['user_data']` tidak mengandung `password_hash`.
- `auth_user()` → refresh dari DB → `password_hash` di-unset.
- ✅ Password hash tidak ada di session.

### 11e. Login Error Message

- Identifier tidak ditemukan → "ID Pengguna / Username atau Kata Sandi salah!"
- Password salah → "ID Pengguna / Username atau Kata Sandi salah!"
- ✅ Identik → tidak ada info leakage.

### 11f. Redirect Flow

- Login admin → admin/index.php ✓
- Login guru → guru/index.php ✓
- Login siswa → siswa/index.php ✓
- Admin akses guru page → redirect admin dashboard ✓
- Guru akses admin page → redirect guru dashboard ✓
- Logout → login.php ✓
- Root index.php → dashboard sesuai role ✓

---

## 12. RISIKO TERSISA

1. **Brute force / rate limiting** — TIDAK ADA. Rekomendasi P2: minimal
   rate limiter per IP (file-based, tanpa DB change). Risiko rendah untuk
   school network lokal, TINGGI untuk cloud deployment.

2. **Session timeout** — Tidak ada idle timeout. Rekomendasi P2: tracking
   `last_activity` di session + auto-logout 30 menit.

3. **Password reset** — Tidak ada self-service reset. Rekomendasi P2:
   admin-initiated temporary password.

4. **Identifier collision** — `register_school.php` tidak cek uniknya
   admin identifier. Risiko rendah karena auto-generate (`ADM-XXX`).

5. **Session storage** — Menggunakan PHP default session (file-based).
   Untuk multi-server deployment, perlu Redis/DB session store (P3).
