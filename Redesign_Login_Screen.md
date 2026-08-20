# TASK: REDESIGN LOGIN SCREEN APLIKASI ABSENSI DIGITAL

Project:
Hadir-Tadz — Aplikasi Absensi Digital Sekolah

Environment:

- Editor utama: Antigravity
- AI coding agent: OpenCode
- Jangan mengubah backend/authentication logic yang sudah berjalan kecuali memang diperlukan untuk integrasi UI.
- Sebelum melakukan perubahan, WAJIB membaca struktur project, package.json, routing, authentication flow, reusable components, design tokens/theme, dan halaman login yang sudah ada.

==================================================

1. TUJUAN
==================================================

Redesign halaman Login agar terlihat modern, profesional, ringan, responsif, dan cocok untuk aplikasi absensi digital sekolah.

Referensi visual:

- Mobile: login card dengan background putih + hijau gradasi.
- Desktop: layout split-screen:
  LEFT  = branding + ilustrasi aplikasi
  RIGHT = login form.

Tema utama:
WHITE + GREEN GRADIENT

Nuansa:

- clean
- modern
- educational
- trustworthy
- professional
- minimal
- tidak terlalu banyak dekorasi
- cocok untuk sekolah

==================================================
2. WAJIB CEK PROJECT SEBELUM CODING
==================================================

Sebelum mengubah kode:

1. Identifikasi framework yang digunakan.
2. Identifikasi library UI yang digunakan.
3. Identifikasi sistem routing.
4. Identifikasi authentication service.
5. Identifikasi komponen Button, Input, Card, Modal, Toast, Icon, dll.
6. Identifikasi design token/theme.
7. Identifikasi breakpoint responsive yang sudah digunakan.
8. Identifikasi apakah login page sudah memiliki state:
   - loading
   - error
   - validation
   - show/hide password
   - remember session
9. Identifikasi apakah ada role:
   - admin
   - guru
   - siswa

JANGAN membuat architecture baru apabila project sudah memiliki architecture yang dapat digunakan.

Gunakan komponen existing/reusable sebanyak mungkin.

==================================================
3. UI COLOR SYSTEM
==================================================

Gunakan white sebagai warna dasar.

Primary:

- Green 500
- Green 600
- Green 700
- Emerald 500
- Emerald 600

Gradient utama:

linear-gradient(
  135deg,
  #22C55E 0%,
  #16A34A 50%,
  #059669 100%
)

Background:

linear-gradient(
  135deg,
  #F0FDF4 0%,
  #FFFFFF 45%,
  #ECFDF5 100%
)

Gunakan warna hijau secara konsisten.

Jangan menggunakan warna biru pada halaman login baru.

Gunakan:

- heading = dark green / slate
- body = slate
- placeholder = muted gray
- border = light gray/green
- success = green
- error = red

==================================================
4. DESKTOP LOGIN LAYOUT
==================================================

Untuk desktop >= 1024px gunakan:

----------------------------------------------

|                  |                         |
|      BRAND       |       LOGIN FORM        |
|                  |                         |
|   Hadir-Tadz     |    Selamat Datang!      |
|   Illustration   |    Email / Username     |
|   Features       |    Password             |
|                  |    Lupa password?       |
|                  |    [ MASUK ]            |
|                  |                         |
|                  |    belum punya akun?    |
|                  |    [ Daftar Sekarang ]  |
|                  |                         |
----------------------------------------------

Layout:

display: grid

grid-template-columns:
minmax(0, 1fr) minmax(420px, 560px);

Desktop page:

- min-height: 100vh
- width: 100%
- overflow-x: hidden

Left section:

- branding
- logo
- nama aplikasi
- tagline
- ilustrasi dashboard / sekolah
- 3 feature highlights

Right section:

- login card
- centered vertically
- maximum width sekitar 520px

==================================================
5. BRANDING LEFT SECTION
==================================================

Logo:
Hadir-Tadz

Judul:
Hadir-Tadz

Subtitle:
Aplikasi Absensi Digital

Tagline:
Disiplin hari ini, sukses nanti.

Tambahkan ilustrasi sederhana yang menggambarkan:

- sekolah
- laptop/dashboard
- absensi
- monitoring kehadiran

Gunakan ilustrasi yang ringan.

Jangan membuat halaman berat.

Jika project sudah memiliki asset/logo:
WAJIB gunakan asset existing.

Jangan membuat duplicate logo.

==================================================
6. FEATURE HIGHLIGHTS
==================================================

Pada desktop tampilkan 3 feature:

1.

Aman & Terpercaya
Data Anda terlindungi dengan sistem keamanan berlapis.

1.

Mudah Digunakan
Antarmuka sederhana dan responsif di semua perangkat.

1.

Laporan Real-time
Pantau kehadiran secara akurat dan real-time.

Gunakan icon yang sudah tersedia di project.

Jangan install icon library baru jika project sudah mempunyai icon library.

==================================================
7. LOGIN CARD
==================================================

Card:

- background white
- border radius 20-28px
- subtle shadow
- border 1px solid rgba(...)
- padding responsif
- tidak boleh terlalu besar

Heading:

Selamat Datang!

Subheading:

Silakan masuk untuk melanjutkan.

==================================================
8. INPUT EMAIL / USERNAME
==================================================

Label:

Email / Username

Placeholder:

Masukkan email atau username

Input:

- rounded 12-14px
- height sekitar 52-56px
- icon user
- focus ring hijau
- border berubah menjadi green saat focus

Gunakan reusable Input component bila tersedia.

==================================================
9. PASSWORD
==================================================

Label:

Password

Placeholder:

Masukkan password

Fitur:

- show/hide password
- icon lock
- eye icon
- keyboard type password
- autocomplete sesuai standar

Jangan menghilangkan fitur existing.

==================================================
10. FORGOT PASSWORD
==================================================

Posisi:
right aligned

Text:

Lupa password?

Gunakan warna primary green.

Pastikan click behavior tetap mengikuti flow existing.

==================================================
11. BUTTON LOGIN
==================================================

Text:

Masuk

Style:

background:
linear-gradient(
  135deg,
  #22C55E,
  #16A34A
)

Tinggi:
52-56px

Border radius:
12-14px

Font:
semi-bold / bold

Hover:
gradient sedikit lebih gelap

Active:
scale kecil / pressed state

Focus:
accessible focus ring

Loading:
tampilkan spinner existing jika tersedia.

==================================================
12. REGISTER CTA
==================================================

HAPUS bagian:

"atau masuk dengan"

dan

"Masuk dengan Google"

Jangan tampilkan Google login.

GANTI menjadi:

belum punya akun?

[ Daftar Sekarang ]

Layout:

-----------------------------
      belum punya akun?
-----------------------------

[      Daftar Sekarang     ]

Button register:

- white background
- green border
- green text
- arrow/right-chevron optional
- hover:
  background green sangat muda

Penting:

Text harus persis:

belum punya akun?

Daftar Sekarang

Jangan menggunakan:
"Belum memiliki akun?"
"Sign Up"
"Register"

Gunakan bahasa Indonesia seperti di atas.

==================================================
13. REGISTER FUNCTIONALITY
==================================================

Button:

Daftar Sekarang

harus diarahkan ke registration flow existing.

Sebelum membuat route baru:
cek apakah project sudah mempunyai:

- /register
- /daftar
- registration page
- modal registration

Gunakan route existing jika tersedia.

Jangan membuat route duplicate.

Jika registration belum tersedia:
buat placeholder route/page hanya apabila architecture project memang mendukungnya.

==================================================
14. FOOTER
==================================================

Tambahkan:

© 2026 Hadir-Tadz. All rights reserved.

Desktop:
footer berada pada area bawah login section.

Mobile:
footer berada setelah konten.

==================================================
15. MOBILE RESPONSIVE
==================================================

Untuk mobile:
<= 767px

UBAH layout desktop menjadi single-column.

Jangan menggunakan split screen.

Urutan:

Logo
Hadir-Tadz
Aplikasi Absensi Digital
Tagline

Login Card

Selamat Datang!

Email / Username

Password

Lupa password?

Masuk

belum punya akun?

Daftar Sekarang

Illustration optional

Footer

==================================================
16. TABLET
==================================================

Breakpoint tablet:
768px - 1023px

Gunakan layout single-column atau compact two-column jika ruang memungkinkan.

Prioritas utama:
NO HORIZONTAL OVERFLOW.

==================================================
17. RESPONSIVE REQUIREMENT
==================================================

WAJIB memastikan:

- tidak ada horizontal scroll
- tidak ada komponen terpotong
- tidak ada text overflow
- tidak ada button keluar layar
- card tidak overflow
- input tidak terlalu panjang
- logo tidak terlalu besar
- illustration tidak menyebabkan halaman terlalu tinggi
- padding mengikuti ukuran viewport
- semua komponen tetap readable

Gunakan:

max-width
width: 100%
min-width: 0
overflow-x: hidden

secara tepat.

JANGAN menggunakan overflow-hidden sebagai solusi untuk menyembunyikan layout yang rusak.

==================================================
18. ACCESSIBILITY
==================================================

Pastikan:

- semua input memiliki label
- button mempunyai accessible name
- focus state terlihat
- keyboard navigation berfungsi
- contrast ratio baik
- error message terbaca
- aria-label digunakan apabila icon-only button
- password visibility button accessible

==================================================
19. AUTHENTICATION BEHAVIOR
==================================================

PENTING:

Jangan mengubah authentication architecture.

Pertahankan:

- login API
- session management
- token handling
- auth context
- middleware
- role detection
- redirect setelah login
- logout
- error handling

Setelah login berhasil:

ADMIN -> dashboard/admin yang sudah digunakan

GURU -> dashboard guru

SISWA -> dashboard siswa

Gunakan routing existing.

==================================================
20. FORM VALIDATION
==================================================

Pertahankan validation existing.

Minimal:

username/email:
required

password:
required

Jika project sudah mempunyai validation schema:
gunakan kembali.

Jangan membuat validation duplicate.

==================================================
21. LOADING STATE
==================================================

Ketika user klik "Masuk":

button berubah menjadi:

Memproses...

atau gunakan loading spinner.

Button tidak boleh dapat diklik berkali-kali selama request berlangsung.

==================================================
22. ERROR STATE
==================================================

Jika login gagal:

Tampilkan error message yang jelas.

Contoh:

Username atau password tidak valid.

Jangan menggunakan browser alert apabila project sudah memiliki Toast/Snackbar component.

Gunakan component notification existing.

==================================================
23. ANIMATION
==================================================

Gunakan animation ringan:

- card fade-in
- logo fade/scale
- button hover
- input focus

Hindari animation berat.

Hindari:

- parallax
- background particle
- animation terus-menerus
- video background

==================================================
24. PERFORMANCE
==================================================

Login page harus ringan.

Prioritas:

- existing assets
- SVG
- optimized images
- lazy loading jika diperlukan
- jangan install dependency baru tanpa alasan

Jangan menambahkan library UI baru hanya untuk halaman login.

==================================================
25. CODE QUALITY
==================================================

Ikuti style project existing.

Jangan:

- membuat file duplicate
- membuat component duplicate
- membuat CSS global yang merusak halaman lain
- mengubah authentication service
- mengubah database
- mengubah API
- mengubah role system

Pisahkan component apabila memang project menggunakan component architecture.

Contoh struktur jika cocok dengan project:

LoginPage
├── LoginBrandPanel
├── LoginForm
├── LoginInput
├── LoginRegisterCTA
└── LoginFooter

Tetapi gunakan struktur existing apabila berbeda.

==================================================
26. DESIGN DETAIL
==================================================

Border radius:
12-28px

Shadow:
soft, subtle

Spacing:
8px system

Typography:
gunakan font existing project.

Jika project tidak memiliki font khusus:
gunakan system font.

Jangan menambahkan Google Font external hanya untuk login page.

==================================================
27. DESKTOP QUALITY TARGET
==================================================

Pada resolusi:

1366 x 768
1440 x 900
1920 x 1080

layout harus tetap proporsional.

Login card tidak boleh terlalu besar.

Brand illustration tidak boleh mendominasi layar.

==================================================
28. MOBILE QUALITY TARGET
==================================================

WAJIB test:

360 x 800
375 x 812
390 x 844
412 x 915

Pastikan seluruh halaman dapat digunakan tanpa horizontal scrolling.

==================================================
29. BROWSER TESTING
==================================================

Test minimal:

Chrome desktop
Chrome mobile responsive
Firefox
Edge

Pastikan:

- form submit
- password visibility
- forgot password
- daftar sekarang
- validation
- login error
- login success
- redirect role
- loading state

==================================================
30. IMPLEMENTATION WORKFLOW
==================================================

STEP 1
Inspect project.

STEP 2
Temukan Login Page existing.

STEP 3
Temukan authentication logic.

STEP 4
Temukan reusable UI components.

STEP 5
Implement redesign.

STEP 6
Run lint/typecheck.

STEP 7
Run existing tests jika tersedia.

STEP 8
Run application.

STEP 9
Test responsive desktop/mobile.

STEP 10
Perbaiki semua:

- overflow
- alignment
- spacing
- typography
- responsive issue

==================================================
31. IMPORTANT RULE
==================================================

JANGAN langsung melakukan rewrite besar.

Lakukan perubahan secara incremental.

Prioritaskan:

1. Existing architecture
2. Existing auth logic
3. Existing components
4. Existing design system
5. New visual design

==================================================
32. EXPECTED RESULT
==================================================

Hasil akhir:

DESKTOP:
Hadir-Tadz branding di kiri
+
Login form di kanan

MOBILE:
Branding di atas
+
Login form di bawah

CTA:

Masuk

belum punya akun?

Daftar Sekarang

Color:
WHITE + GREEN GRADIENT

Tidak ada:

Google Login
"atau masuk dengan"

Tidak ada:

Blue primary color

Tidak ada:

horizontal overflow

Tidak ada:

layout terpotong

==================================================
33. OUTPUT YANG WAJIB DIBERIKAN SETELAH IMPLEMENTASI
==================================================

Setelah selesai coding, berikan laporan:

1. File yang diubah
2. Component yang dibuat
3. Component yang digunakan kembali
4. Route yang digunakan
5. Authentication flow yang dipertahankan
6. Responsive breakpoint
7. Dependency baru jika ada
8. Test yang dijalankan
9. Masalah yang ditemukan
10. Masalah yang masih tersisa

Jangan hanya mengatakan "selesai".

Tampilkan perubahan secara ringkas tetapi teknis.
