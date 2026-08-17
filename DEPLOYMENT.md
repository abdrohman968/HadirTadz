# Panduan Deployment — HadirTadz (PHP Native)

Dokumen ini menjelaskan cara meng-online-kan aplikasi HadirTadz **format PHP Native**
(versi aktif utama). Terdapat **2 opsi hosting**:

1. **Hosting custom PHP (Hostinger, Rumahweb, dsb.)** — paling disarankan untuk produksi.
2. **Vercel** — hosting gratis dengan dukungan runtime PHP (`vercel-php`).

> Catatan: aplikasi **Next.js** (`src/`) adalah format cadangan yang disimpan di repo,
> bukan format aktif. Panduan di dokumen ini khusus untuk versi PHP Native.

---

## Prasyarat

- Kode aplikasi PHP Native lengkap: folder `admin/ api/ assets/ auth/ config/ database/
  guru/ includes/ siswa/` + `index.php scan.php` di root.
- Database MySQL (`hadir_tadz`) sudah siap — schema di `database/schema.sql`, migrasi
  otomatis di `database/migrate.php`.

### Konfigurasi Database

Koneksi DB dikonfigurasi di `config/database.php`. Secara default memakai MySQL lokal
(`localhost` / `root` / tanpa password / db `hadir_tadz`), dan otomatis memakai **environment
variables** bila tersedia:

| Variabel | Default | Keterangan |
| -------- | ------- | ---------- |
| `DB_HOST` | `localhost` | Host MySQL. |
| `DB_PORT` | `3306` | Port MySQL. |
| `DB_USER` | `root` | User DB. |
| `DB_PASS` | `""` | Password DB. |
| `DB_NAME` | `hadir_tadz` | Nama database (fallback `absensi_sekolah`). |

---

## Opsi 1 — Hosting custom PHP (Hostinger, Rumahweb, dsb.)

### Opsi 1 — Langkah

1. **Siapkan database di hosting:**
   - Buat database MySQL di panel (cPanel → *MySQL Databases* di Hostinger, atau
     menu *Database* di Rumahweb). Catat host/port/user/pass/name.
   - Impor `database/schema.sql` (via phpMyAdmin, atau CLI):

     ```bash
     mysql -h <host> -P <port> -u <user> -p <dbname> < database/schema.sql
     ```

2. **Upload seluruh folder proyek** (kecuali `.git`, `node_modules`, `.next`, `src/`
   bila tidak dipakai) ke `public_html` (Hostinger) atau `web` (Rumahweb) via File Manager
   atau FTP/FileZilla.

3. **Sesuaikan konfigurasi database** di `config/database.php` — atau lebih aman set
   environment variables di panel hosting (*PHP Configuration* / *Environment Variables*)
   agar tidak perlu mengubah kode:

   ```text
   DB_HOST=<host_database>
   DB_PORT=3306
   DB_USER=<user_database>
   DB_PASS=<password_database>
   DB_NAME=hadir_tadz
   ```

4. **Migrasi otomatis:** kunjungi `https://domainanda.com/database/migrate.php` sekali —
   skrip akan membuat tabel & data awal (akun demo) bila belum ada. Setelah itu boleh dihapus.

5. **PWA:** pastikan folder root berisi `manifest.json`, `service-worker.js`, `assets/`
   (logo & ikon) ikut ter-upload. Jika domain subfolder, cek `get_base_url()` di
   `config/helpers.php` (otomatis mendeteksi `/absensi_digital`).

6. **SSL:** aktifkan free SSL (Let's Encrypt) di panel — wajib agar kamera kiosk scan berfungsi.

### Catatan

- Aplikasi ini **stateless per request + session PHP** — tidak butuh Node.js.
- Pastikan versi PHP di hosting **>= 8.1** (dipakai fitur `match` dll.).
- Folder uploads (foto selfie) butuh izin tulis; periksa perizinan `assets/uploads/`.

---

## Opsi 2 — Vercel (runtime PHP, gratis)

Vercel mendukung PHP via runtime `vercel-php`. File `vercel.json` di repo sudah dikonfigurasi
untuk menjalankan `**/*.php` sebagai serverless function.

### Opsi 2 — Langkah

1. **Push kode ke GitHub/GitLab:**

   ```bash
   git add -A && git commit -m "init" && git push -u origin main
   ```

   > Jangan push secret lokal (`.env`, `.env.local` sudah di-`.gitignore`).

2. **Import di vercel.com** → *Add New Project* → pilih repo. Build command dikenali otomatis
   (bisa kosong / `vercel build`). Deploy.

3. **Database:** Vercel tidak punya MySQL — pasangkan DB cloud kompatibel MySQL
   (mis. TiDB Cloud Serverless free) lalu set Environment Variables di
   *Settings → Environment Variables*:

   ```text
   DB_HOST=<host_tidb>
   DB_PORT=4000
   DB_USER=<user_tidb>
   DB_PASS=<password_tidb>
   DB_NAME=hadir_tadz
   ```

   > PHP di Vercel berjalan sebagai serverless function — koneksi PDO dibuat per-request,
   > jadi pastikan kuota koneksi DB cukup untuk jumlah request.

4. **Migrasi:** jalankan `migrate.php` lewat URL deployment (`/database/migrate.php`)
   setelah env diset.

### Keterbatasan Vercel + PHP

- Session PHP bersifat stateless antar fungsi — bisa bermasalah untuk login memakai session.
  Solusi: pastikan auth di `config/auth.php` memakai cookie + DB, atau uji dulu.
- Koneksi DB serverless butuh DB eksternal yang mengizinkan koneksi dari cloud.
- **Rekomendasi**: pakai Opsi 1 (hosting PHP) untuk produksi; Vercel hanya untuk demo.

---

## Peta Keputusan

| Kebutuhan | Hosting PHP (Hostinger/Rumahweb) | Vercel (PHP) |
| --------- | -------------------------------- | ------------ |
| Biaya | Mulai ~Rp20–100rb/bln | Gratis (kuota terbatas) |
| MySQL | MySQL resmi dari hosting | Butuh DB cloud eksternal |
| Kesesuaian PHP Native | Sempurna (dirancang untuk ini) | Terbatas (serverless, session stateless) |
| Kinerja | Persisten, stabil | Cold start tiap request |
| Cocok untuk | Produksi, sekolah | Demo / uji coba |

**Rekomendasi:** pakai **hosting custom PHP** (Hostinger/Rumahweb) untuk produksi resmi.
Vercel PHP bisa untuk percobaan.

---

## Verifikasi setelah deploy

1. Buka `https://domainanda/` → login dengan admin `ADM-001` / `hadir123`.
2. Cek dashboard `/admin/index.php` menampilkan data (koneksi DB OK).
3. Uji `/scan.php` (kiosk) terbuka.
4. Pastikan `manifest.json` termuat (PWA) dan logo tidak error.
