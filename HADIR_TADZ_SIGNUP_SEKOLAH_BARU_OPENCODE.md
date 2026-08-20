# HADIR-TADZ — SIGNUP SEKOLAH BARU
## Prompt Implementasi untuk OpenCode

> **Tujuan:** Implementasikan halaman **Signup / Pendaftaran Sekolah Baru** pada aplikasi Hadir-Tadz tanpa merusak authentication, routing, role system, design system, API, atau komponen existing yang sudah berjalan.

---

# 1. KONTEKS PROYEK

Nama aplikasi:

**Hadir-Tadz — Aplikasi Absensi Digital Sekolah**

Fungsi signup:

> Memungkinkan sekolah baru mendaftarkan institusinya ke platform Hadir-Tadz dan membuat akun admin sekolah.

Environment:

- Editor utama: **Antigravity**
- AI coding agent: **OpenCode**
- Gunakan architecture dan component existing.
- Jangan membuat architecture baru apabila project sudah memiliki pola yang sama.

---

# 2. ATURAN WAJIB SEBELUM CODING

Sebelum melakukan perubahan kode:

1. Inspect seluruh struktur project.
2. Baca `package.json`.
3. Identifikasi framework.
4. Identifikasi routing.
5. Identifikasi authentication flow.
6. Identifikasi auth context/service/store.
7. Identifikasi API client/service.
8. Identifikasi reusable:
   - Button
   - Input
   - Select
   - Card
   - Modal
   - Toast
   - Dialog
   - Stepper
   - Form
   - Validation
   - Icon
9. Identifikasi design token/theme.
10. Cari apakah sudah ada:
   - register page
   - signup page
   - school registration
   - user registration
   - onboarding
11. Cari endpoint/backend yang sudah tersedia untuk registrasi sekolah.

### JANGAN langsung membuat file baru.

Gunakan ulang komponen, service, route, validation schema, dan API yang sudah tersedia apabila relevan.

---

# 3. TUJUAN UX

Signup sekolah **jangan dibuat sebagai satu form panjang**.

Gunakan konsep:

**Multi-Step School Onboarding**

Alur utama:

```text
STEP 1
Informasi Sekolah
        ↓
STEP 2
Admin Sekolah
        ↓
STEP 3
Verifikasi
        ↓
STEP 4
Selesai
```

Tujuannya:

- form lebih mudah dipahami
- beban kognitif lebih kecil
- nyaman di mobile
- mudah divalidasi per tahap
- user mengetahui progres pendaftaran
- lebih profesional seperti SaaS onboarding

---

# 4. DESIGN SYSTEM

Tema utama:

**WHITE + GREEN GRADIENT**

Primary:

```text
Green 500
Green 600
Green 700
Emerald 500
Emerald 600
```

Primary gradient:

```css
linear-gradient(
  135deg,
  #22C55E 0%,
  #16A34A 50%,
  #059669 100%
);
```

Background:

```css
linear-gradient(
  135deg,
  #F0FDF4 0%,
  #FFFFFF 45%,
  #ECFDF5 100%
);
```

Gunakan:

- putih sebagai surface utama
- dark green / slate untuk heading
- muted slate untuk secondary text
- green untuk action
- light green untuk highlight
- merah untuk error
- amber hanya bila memang diperlukan

### Jangan gunakan warna biru sebagai primary color.

---

# 5. DESKTOP LAYOUT

Target:

- 1366 × 768
- 1440 × 900
- 1920 × 1080

Gunakan dua area utama:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   BRANDING / ILLUSTRATION       │      SIGNUP FORM           │
│                                 │                            │
│   Hadir-Tadz                    │    Daftar Sekolah Baru     │
│   Aplikasi Absensi Digital      │                            │
│                                 │    Progress Stepper        │
│   Buat Akun Sekolah Anda        │                            │
│                                 │    Form                   │
│   Penjelasan singkat            │                            │
│                                 │                            │
│   [Ilustrasi Sekolah]           │    [Selanjutnya]           │
│                                 │                            │
│   ✓ Aman                        │    Sudah punya akun?       │
│   ✓ Mudah                       │    Masuk di sini           │
│   ✓ Real-time                   │                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Gunakan:

```css
min-height: 100vh;
width: 100%;
```

Jangan membuat halaman desktop terlalu panjang secara vertikal.

Apabila konten step masih terlalu tinggi:

- gunakan internal scroll pada form section jika architecture/design system project memang mengizinkan
- jangan menyebabkan seluruh halaman menjadi awkward
- jangan menggunakan `overflow: hidden` untuk menutupi bug layout

---

# 6. BRANDING PANEL

Desktop menampilkan branding di sisi kiri.

Isi:

### Badge

```text
Sekolah Baru
```

### Heading

```text
Buat Akun Sekolah
Anda
```

### Description

```text
Daftarkan sekolah Anda untuk mengelola
absensi siswa dan guru dengan mudah,
akurat, dan aman.
```

### Brand

```text
Hadir-Tadz
Aplikasi Absensi Digital
```

### Tagline

```text
Disiplin hari ini, sukses nanti.
```

### Illustration

Ilustrasi dapat berupa:

- gedung sekolah
- dashboard absensi
- laptop
- smartphone
- guru/siswa
- monitoring kehadiran

Prioritas:

1. gunakan asset existing jika tersedia
2. gunakan SVG/asset ringan bila memungkinkan
3. jangan menambahkan asset besar tanpa kebutuhan

---

# 7. FEATURE HIGHLIGHTS

Pada desktop tampilkan 3 highlight:

### Aman & Terpercaya

```text
Data sekolah dan pengguna terlindungi
dengan sistem keamanan berlapis.
```

### Kelola Lebih Mudah

```text
Kelola guru, siswa, kelas, dan absensi
dalam satu sistem.
```

### Laporan Real-time

```text
Pantau data kehadiran secara akurat
dan real-time.
```

Gunakan icon existing.

Jangan menambahkan icon package baru apabila project sudah menggunakan library icon.

---

# 8. SIGNUP CARD

Card utama:

- background `white`
- border radius sekitar `20px – 28px`
- soft shadow
- border tipis
- padding responsif
- max-width sekitar `560px – 680px`

Header:

```text
Daftar Sekolah Baru
```

Subheading:

```text
Lengkapi informasi sekolah untuk membuat akun
```

---

# 9. STEPPER

Tampilkan progress:

```text
① ───── ② ───── ③ ───── ④
Sekolah    Admin    Verifikasi    Selesai
```

Step aktif:

- green
- background green
- text green

Step selesai:

- check icon
- green

Step belum aktif:

- gray

Desktop:

```text
1 ───────── 2 ───────── 3 ───────── 4
Sekolah     Admin       Verifikasi   Selesai
```

Mobile:

```text
1 ─── 2 ─── 3 ─── 4
```

Label dapat dipendekkan jika ruang terlalu sempit:

```text
Sekolah | Admin | Verifikasi | Selesai
```

Jangan sampai stepper overflow horizontal.

---

# 10. STEP 1 — INFORMASI SEKOLAH

Judul:

```text
Informasi Sekolah
```

Description:

```text
Masukkan data utama sekolah Anda.
```

Field:

### Nama Sekolah

Required.

Placeholder:

```text
Contoh: SMA Negeri Harapan Bangsa
```

### NPSN

Optional jika proses bisnis existing memang mengizinkan.

Placeholder:

```text
Masukkan NPSN sekolah
```

### Jenjang

Required.

Select:

```text
Pilih jenjang sekolah
```

Options minimal:

```text
SD
SMP
SMA
SMK
MA
MTs
MI
Lainnya
```

Jangan hard-code option apabila project sudah memiliki master data jenjang.

Gunakan master data existing jika tersedia.

### Alamat Sekolah

Required.

Placeholder:

```text
Masukkan alamat lengkap sekolah
```

### Kota / Kabupaten

Required.

Gunakan select/autocomplete jika tersedia.

Placeholder:

```text
Pilih kota atau kabupaten
```

### Provinsi

Required.

Gunakan master data existing.

### Kode Pos

Optional.

Placeholder:

```text
Contoh: 40383
```

### Email Sekolah

Required.

Placeholder:

```text
email@sekolah.sch.id
```

Validasi:

- format email valid
- trim whitespace
- lowercase jika sesuai architecture backend

### No. Telepon Sekolah

Required.

Placeholder:

```text
Contoh: 0812-3456-7890
```

Normalisasi nomor harus mengikuti backend existing.

---

# 11. STEP 1 VALIDATION

Minimal:

```text
Nama Sekolah
- required
- tidak boleh kosong

Jenjang
- required

Alamat
- required

Kota/Kabupaten
- required

Provinsi
- required

Email
- required
- valid email

No. Telepon
- required
- format valid
```

Jika project sudah memiliki validation schema:

**WAJIB reuse schema tersebut.**

Jangan membuat dua sumber validation.

Tampilkan error inline.

Contoh:

```text
Email Sekolah
[ abc ]

Format email belum valid.
```

---

# 12. BUTTON STEP 1

Primary button:

```text
Selanjutnya
```

Style:

```css
background:
linear-gradient(
  135deg,
  #22C55E,
  #16A34A
);
```

Height:

```text
52–56px
```

Border radius:

```text
12–14px
```

Tambahkan chevron kanan bila tersedia.

Behavior:

1. validate Step 1
2. jika valid → Step 2
3. jika invalid → tetap Step 1
4. scroll/focus ke field error pertama bila memungkinkan

---

# 13. STEP 2 — ADMIN SEKOLAH

Judul:

```text
Admin Sekolah
```

Description:

```text
Buat akun administrator yang akan mengelola sekolah.
```

Field:

### Nama Lengkap Admin

Required.

Placeholder:

```text
Masukkan nama lengkap
```

### NIK / NIP

Optional jika business rule existing mengizinkan.

Placeholder:

```text
Masukkan NIK atau NIP
```

### Email Admin

Required.

Placeholder:

```text
email.admin@sekolah.sch.id
```

### No. WhatsApp

Required.

Placeholder:

```text
0812-3456-7890
```

### Username

Required.

Placeholder:

```text
Masukkan username
```

### Password

Required.

Fitur:

- show/hide password
- strength indicator bila design system mendukung

### Konfirmasi Password

Required.

Validasi:

```text
password === confirmPassword
```

Error:

```text
Konfirmasi password tidak cocok.
```

---

# 14. STEP 2 PASSWORD RULE

Gunakan rule existing backend apabila tersedia.

Jika belum ada rule eksplisit:

minimal:

- 8 karakter
- tidak boleh kosong
- konfirmasi harus sama

Jangan membuat rule frontend yang bertentangan dengan backend.

---

# 15. STEP 2 BUTTONS

Tampilkan:

```text
← Kembali
Selanjutnya →
```

Desktop:

```text
[ ← Kembali ]       [ Selanjutnya → ]
```

Mobile:

```text
[ ← Kembali ] [ Selanjutnya → ]
```

Pastikan tidak overflow.

---

# 16. STEP 3 — VERIFIKASI

Judul:

```text
Verifikasi Data
```

Tujuan:

Memberikan kesempatan kepada pengguna memeriksa data sebelum akun sekolah dibuat.

Tampilkan summary:

```text
Nama Sekolah
SMA Negeri Harapan Bangsa

NPSN
XXXXXXXX

Jenjang
SMA

Alamat
xxxxxxxx

Email Sekolah
email@sekolah.sch.id

Admin
Nama Admin

Email Admin
admin@sekolah.sch.id
```

Sediakan tombol:

```text
Edit Data
```

yang mengembalikan user ke step sebelumnya.

---

# 17. PERSETUJUAN

Sebelum submit final:

```text
[ ] Saya menyetujui Syarat & Ketentuan
    dan Kebijakan Privasi Hadir-Tadz.
```

Checkbox wajib dicentang.

Jangan mengaktifkan submit jika belum menyetujui.

Link:

```text
Syarat & Ketentuan
Kebijakan Privasi
```

Gunakan route/modal existing jika tersedia.

---

# 18. FINAL SUBMIT

Button:

```text
Daftarkan Sekolah
```

Saat request:

```text
Mendaftarkan...
```

atau spinner.

Button harus disabled ketika request berlangsung.

Cegah double submit.

---

# 19. API / BACKEND INTEGRATION

PENTING:

Jangan membuat API baru apabila endpoint registration sudah ada.

Cari terlebih dahulu:

```text
register
signup
school registration
create school
create tenant
onboarding
organization registration
```

Kemungkinan architecture yang digunakan bisa berupa:

```text
School
Organization
Tenant
Institution
```

Ikuti istilah yang digunakan project.

Jangan mengubah database schema hanya untuk kebutuhan UI tanpa alasan dan tanpa membaca backend.

---

# 20. MULTI-TENANT / SCHOOL ISOLATION

Jika Hadir-Tadz sudah menggunakan konsep:

```text
school
tenant
organization
school_id
tenant_id
```

pastikan signup menghasilkan entitas sekolah yang benar.

Setelah signup:

```text
School
   ↓
Admin School
   ↓
User / Account
   ↓
Tenant / School ID
```

Jangan menghubungkan admin ke sekolah yang salah.

Periksa backend agar:

- school identifier tersimpan
- admin memiliki role yang benar
- session/auth dapat mengenali school
- data sekolah terisolasi dari tenant lain

---

# 21. STEP 4 — SELESAI

Setelah registrasi berhasil:

Tampilkan success screen.

Contoh:

```text
        ✓

Pendaftaran Berhasil!

Sekolah Anda berhasil didaftarkan
di Hadir-Tadz.

Nama Sekolah:
SMA Negeri Harapan Bangsa

ID Sekolah:
HTZ-XXXXXX

Admin:
Nama Admin
```

CTA:

```text
Masuk ke Hadir-Tadz
```

Secondary:

```text
Kembali ke Halaman Utama
```

Jika backend menghasilkan school code / tenant code:

WAJIB tampilkan nilai yang sebenarnya dari response API.

Jangan generate ID palsu di frontend.

---

# 22. MOBILE RESPONSIVE

Breakpoint utama:

```text
< 768px
```

Pada mobile:

- gunakan single column
- branding panel desktop disederhanakan
- tidak menggunakan split screen
- signup card menjadi full width
- padding mengikuti viewport
- stepper tetap terlihat
- field full width
- button full width
- footer setelah content

Urutan:

```text
Logo
Hadir-Tadz
Daftar Sekolah Baru

Stepper

Form Step

Navigation

Login Link
```

---

# 23. MOBILE TARGET

WAJIB test:

```text
360 × 800
375 × 812
390 × 844
412 × 915
```

Pastikan:

- tidak ada horizontal overflow
- input tidak keluar layar
- stepper tidak terpotong
- tombol tidak keluar layar
- text tidak overlap
- modal tidak keluar viewport
- keyboard tidak menutupi tombol utama
- halaman tetap usable

---

# 24. TABLET

Target:

```text
768px – 1023px
```

Gunakan:

- single column atau compact two-column
- max-width form
- horizontal padding cukup
- jangan memaksa layout desktop apabila ruang tidak mencukupi

Prioritas:

**Usability > mempertahankan split-screen.**

---

# 25. DESKTOP RESPONSIVE

Target:

```text
1024px+
```

Gunakan split layout.

Pada desktop besar:

```text
left: 45%
right: 55%
```

atau ratio yang sesuai dengan existing layout.

Jangan membuat branding section terlalu lebar.

---

# 26. ACCESSIBILITY

WAJIB:

- label pada setiap input
- keyboard navigation
- focus ring jelas
- aria-label untuk icon-only button
- error message terkait field
- button memiliki accessible name
- checkbox accessible
- contrast cukup
- modal dapat ditutup dengan keyboard jika modal digunakan

---

# 27. UX DETAILS

Tambahkan:

- autosave form step secara lokal jika architecture/security mengizinkan
- jangan menyimpan password plaintext di localStorage
- jangan menyimpan data sensitif secara permanen di browser

Jika draft saving dilakukan:

Simpan hanya data non-sensitive.

Contoh:

```text
school_name
npsn
jenjang
address
location
school_email
school_phone
```

Jangan simpan:

```text
password
confirm_password
OTP
access_token
refresh_token
```

---

# 28. ERROR HANDLING

Gunakan notification component existing.

Contoh error API:

```text
Pendaftaran sekolah gagal.
Silakan coba kembali.
```

Untuk conflict:

```text
Sekolah dengan NPSN tersebut sudah terdaftar.
```

Untuk email:

```text
Email sekolah sudah digunakan.
```

Untuk network:

```text
Tidak dapat terhubung ke server.
Periksa koneksi internet Anda lalu coba lagi.
```

Gunakan pesan dari backend bila sudah terstandarisasi.

Jangan menampilkan raw stack trace kepada user.

---

# 29. LOADING STATE

Saat submit:

```text
Daftarkan Sekolah
```

berubah menjadi:

```text
Mendaftarkan...
```

Button disabled.

Tidak boleh double submit.

Saat pindah antar step:

- gunakan transition ringan
- jangan menggunakan animation berat

---

# 30. ANIMATION

Gunakan animation sederhana:

- fade
- slide kecil
- scale ringan

Hindari:

- particle
- parallax
- looping animation berat
- video
- background animation terus-menerus

---

# 31. PERFORMANCE

Prioritas:

1. Existing assets
2. Existing icon library
3. SVG
4. Reusable component
5. Lazy loading jika diperlukan

Jangan menambahkan dependency baru jika tidak diperlukan.

---

# 32. SECURITY

Jangan:

- expose password
- expose token
- expose secret API key
- menyimpan credential di localStorage
- bypass backend validation
- mempercayai role dari frontend
- membuat school_id dari input user tanpa validasi backend

Frontend hanya UI/orchestration.

Authorization harus tetap berada di backend.

---

# 33. ROUTING

Cari route existing untuk:

```text
/login
/register
/signup
/school/register
```

Jika sudah ada registration route:

gunakan route tersebut.

Jangan membuat route duplicate.

Setelah sukses:

gunakan redirect flow existing.

---

# 34. AUTHENTICATION

Jangan mengubah:

- auth provider
- session handling
- token handling
- refresh token
- logout
- middleware
- role authorization

Kecuali hasil inspeksi menunjukkan signup memang belum terintegrasi.

---

# 35. ROLE

Setelah signup sekolah:

role admin yang dibuat harus mengikuti role existing.

Jangan membuat role baru seperti:

```text
school_admin
super_admin_school
```

kecuali role tersebut memang sudah ada di backend.

Cari role existing terlebih dahulu.

---

# 36. COMPONENT ARCHITECTURE

Jika cocok dengan architecture project, struktur dapat berupa:

```text
SchoolSignupPage
├── SignupHeader
├── SignupStepper
├── SchoolInformationStep
├── SchoolAdminStep
├── VerificationStep
├── SignupSuccess
├── SignupNavigation
└── SignupFooter
```

Tetapi:

**WAJIB mengikuti component structure existing project jika berbeda.**

Jangan membuat duplicate component.

---

# 37. FORM STATE

Gunakan form/state management existing.

Contoh konsep:

```text
currentStep
schoolData
adminData
verificationData
isSubmitting
errors
```

Jangan membuat state management baru jika project sudah menggunakan:

- React Hook Form
- Formik
- Zustand
- Redux
- Pinia
- VueUse
- composable
- context
- atau pattern lain

---

# 38. DATA CONTRACT

Pastikan nama field frontend mengikuti backend.

Contoh kemungkinan:

```text
school_name
npsn
education_level
address
province
city
postal_code
school_email
school_phone

admin_name
admin_nik
admin_email
admin_phone
username
password
```

**JANGAN mengasumsikan nama field ini benar.**

Baca DTO/request schema/backend service terlebih dahulu.

Jika backend menggunakan nama lain:

gunakan nama backend yang sebenarnya.

---

# 39. MASTER DATA

Untuk:

- provinsi
- kota/kabupaten
- jenjang

Prioritas:

1. API/master data existing
2. database existing
3. enum existing
4. fallback static data hanya jika memang belum tersedia

Jangan membuat duplicate master data.

---

# 40. DUPLICATE SCHOOL CHECK

Sebelum membuat sekolah baru, backend harus menangani uniqueness.

Minimal berdasarkan field yang sesuai business rule:

```text
NPSN
school email
school code
```

Frontend boleh memberi feedback awal, tetapi backend tetap sumber kebenaran.

---

# 41. RESPONSIVE RULE

Jangan melakukan:

```css
width: 500px;
```

tanpa responsive constraint.

Gunakan pola:

```css
width: 100%;
max-width: 560px;
```

Input:

```css
width: 100%;
min-width: 0;
```

Container:

```css
width: 100%;
max-width: 100%;
```

Hindari fixed height untuk container utama.

---

# 42. VISUAL STYLE

Gunakan:

- rounded input
- rounded card
- subtle border
- soft shadow
- plenty of whitespace
- green action
- minimal decoration

Jangan:

- terlalu banyak gradient
- terlalu banyak shadow
- terlalu banyak icon
- card bertumpuk tanpa alasan
- font terlalu besar
- form terlalu padat

---

# 43. COPYWRITING

Gunakan bahasa Indonesia.

Judul:

```text
Daftar Sekolah Baru
```

Description:

```text
Lengkapi informasi sekolah untuk membuat akun
```

Step:

```text
Informasi Sekolah
Admin Sekolah
Verifikasi
Selesai
```

Primary:

```text
Selanjutnya
```

Final:

```text
Daftarkan Sekolah
```

Login link:

```text
Sudah punya akun sekolah? Masuk di sini
```

Jangan menggunakan copy yang berbeda-beda pada desktop dan mobile.

---

# 44. LOGIN LINK

Pada bagian bawah signup:

```text
Sudah punya akun sekolah?

Masuk di sini
```

Teks `Masuk di sini` harus clickable.

Arahkan ke route login existing.

---

# 45. QA CHECKLIST

Setelah implementasi, lakukan pengujian:

### UI

- [ ] Desktop layout
- [ ] Tablet layout
- [ ] Mobile layout
- [ ] Green gradient
- [ ] Typography
- [ ] Card
- [ ] Stepper
- [ ] Input
- [ ] Button
- [ ] Footer

### FUNCTION

- [ ] Step 1 validation
- [ ] Step 2 validation
- [ ] Step 3 verification
- [ ] Edit data
- [ ] Final submit
- [ ] Loading
- [ ] API success
- [ ] API error
- [ ] Login redirect
- [ ] Duplicate school handling

### RESPONSIVE

- [ ] 360×800
- [ ] 375×812
- [ ] 390×844
- [ ] 412×915
- [ ] 768px
- [ ] 1024px
- [ ] 1366×768
- [ ] 1440×900
- [ ] 1920×1080

### QUALITY

- [ ] No horizontal overflow
- [ ] No clipped content
- [ ] No duplicated component
- [ ] No duplicate API
- [ ] No duplicate route
- [ ] No authentication regression
- [ ] No console error
- [ ] No TypeScript error
- [ ] No lint error
- [ ] Build successful

---

# 46. TESTING COMMAND

Gunakan command yang memang tersedia di project.

Contoh:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Jika project menggunakan package manager atau command berbeda:

**ikuti project existing.**

Jangan menjalankan command yang tidak tersedia.

---

# 47. IMPORTANT — JANGAN MERUSAK SISTEM EXISTING

Jangan mengubah secara sembarangan:

- authentication
- login
- logout
- role
- permission
- school tenant isolation
- dashboard
- API existing
- database migration
- navigation
- design system global

Signup harus menjadi fitur baru yang terintegrasi dengan architecture existing.

---

# 48. IMPLEMENTATION ORDER

Kerjakan dalam urutan:

## PHASE 1 — INSPECTION

- inspect project
- identify architecture
- identify auth
- identify routes
- identify API
- identify reusable components

## PHASE 2 — UI

Implement:

- layout desktop
- layout mobile
- signup card
- stepper
- step 1
- step 2
- step 3
- step 4

## PHASE 3 — VALIDATION

Implement/reuse:

- field validation
- error state
- password validation
- checkbox agreement

## PHASE 4 — BACKEND INTEGRATION

Integrasikan ke endpoint existing.

## PHASE 5 — QA

Test:

- functional
- responsive
- accessibility
- build
- lint
- typecheck

---

# 49. EXPECTED FINAL EXPERIENCE

## DESKTOP

```text
Branding / Illustration
              +
Daftar Sekolah Baru
              +
Stepper
              +
Form
              +
Navigation
```

## MOBILE

```text
Hadir-Tadz
     ↓
Daftar Sekolah Baru
     ↓
Stepper
     ↓
Form
     ↓
Navigation
     ↓
Sudah punya akun?
Masuk di sini
```

---

# 50. FINAL REPORT WAJIB

Setelah implementasi selesai, jangan hanya mengatakan:

```text
Done.
```

Berikan laporan:

```text
IMPLEMENTATION SUMMARY

1. Framework:
2. Route:
3. Files Changed:
4. Components Added:
5. Components Reused:
6. API Endpoint Used:
7. Validation:
8. Authentication Integration:
9. Responsive Breakpoints:
10. Tests Run:
11. Build Result:
12. Issues Fixed:
13. Remaining Issues:
```

Jika ada asumsi karena backend belum menyediakan endpoint tertentu, tuliskan secara eksplisit.

---

# 51. DEFINITION OF DONE

Fitur dianggap selesai hanya jika:

- Signup sekolah tersedia
- Multi-step berjalan
- Step 1 valid
- Step 2 valid
- Step 3 dapat review data
- Final submit berjalan
- Backend terintegrasi
- Success state berjalan
- Login redirect berjalan
- Desktop responsive
- Mobile responsive
- Tidak ada horizontal overflow
- Tidak ada authentication regression
- Lint berhasil
- Typecheck berhasil
- Build berhasil
- Tidak ada console error kritis

---

# END OF TASK

Mulai dengan **INSPECTION**, bukan langsung coding.

Setelah memahami architecture existing, implementasikan Signup Sekolah Baru secara incremental dan aman.
