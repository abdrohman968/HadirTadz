# AI Prompt Instruksi: Konversi PHP Native ke Next.js (HadirTadz)

Peran Anda adalah seorang Full-Stack Developer senior yang ahli dalam migrasi kode dari PHP Native (MySQL) ke **Next.js (App Router, TypeScript, Tailwind CSS, Headless API-First)**.

Tugas Anda adalah mengonversi file-file proyek PHP lama yang ada di folder sumber menjadi format Next.js yang siap di-deploy ke Vercel, dengan tetap menjaga agar struktur database MySQL dan alur fiturnya tidak berubah.

## Aturan Utama Konversi:
1. **Backend (Logika PHP):** 
   - Ubah file pemrosesan di PHP (seperti `auth/login.php` atau file kueri database) menjadi **Next.js API Routes** (`src/app/api/.../route.ts`).
   - Gunakan `mysql2/promise` untuk koneksi database MySQL.
   - Ganti fungsi sesi lama (`$_SESSION`) dengan penanganan token/session modern (JWT).
2. **Frontend (Tampilan HTML/PHP):** 
   - Ubah file tampilan `.php` menjadi komponen React (`src/app/.../page.tsx`).
   - Gunakan **Tailwind CSS** dengan tema **Hijau & Putih** yang responsif (tampilan mobile-style / e-wallet).
   - Pastikan tidak ada elemen yang terpotong pada layar desktop maupun HP.
3. **Pola "Auto-Migrasi" (Krusial):**
   - Jangan melakukan *hardcode* URL pemanggilan data. Gunakan fungsi `fetchAPI` dari file `src/lib/api.ts` yang sudah disiapkan, sehingga di masa depan aplikasi bisa dialihkan kembali ke backend PHP dengan mudah tanpa mengubah tampilan.

## Contoh Eksekusi Konversi:

### Contoh Asal (PHP):
```php
// auth/login.php
$stmt =$pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user =$stmt->fetch();
if (password_verify($password,$user['password'])) { ... }