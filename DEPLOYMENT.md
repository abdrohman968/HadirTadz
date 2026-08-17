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

## Opsi 2 — Vercel (menjalankan aplikasi Next.js cadangan)

Vercel dipakai untuk menjalankan **versi Next.js** yang tersimpan sebagai cadangan di repo
(`src/`), bukan versi PHP Native. Ini berguna untuk preview/praktek dan percobaan GitHub
Actions — bukan untuk produksi PHP.

> Kenapa bukan PHP di Vercel? `vercel-php` (community runtime) hanya memetakan file `api/*.php`
> menjadi serverless function; aplikasi PHP Native ini berbasis **banyak file + session PHP**
> (`config/`, `helpers/`, `includes/`) sehingga tidak bisa berjalan penuh di platform serverless.
> Jika dicoba, build akan gagal dengan error "pattern doesn't match any Serverless Functions".

### Opsi 2 — Langkah

1. **Push kode ke GitHub/GitLab:**

   ```bash
   git add -A && git commit -m "init" && git push -u origin main
   ```

   > Jangan push secret lokal (`.env`, `.env.local` sudah di-`.gitignore`).

2. **Import di vercel.com** → *Add New Project* → pilih repo. Next.js terdeteksi otomatis,
   `vercel.json` sudah minimal `{ "version": 2 }`. Deploy.

3. **Database (untuk versi Next.js):** Vercel tidak punya MySQL — pasangkan DB cloud kompatibel
   MySQL (mis. TiDB Cloud Serverless free) lalu set Environment Variables di
   *Settings → Environment Variables*:

   ```text
   DB_HOST=<host_tidb>
   DB_PORT=4000
   DB_USER=<user_tidb>
   DB_PASS=<password_tidb>
   DB_NAME=hadir_tadz
   DB_SSL=true
   JWT_SECRET=<secret_acak_unik>
   ```

4. **Keterbatasan:** versi Next.js adalah cadangan — pastikan untuk go-live PHP Native memakai
   Opsi 1 (Hostinger/Rumahweb).

---

## Peta Keputusan

| Kebutuhan | Hosting PHP (Hostinger/Rumahweb) | Vercel (Next.js cadangan) |
| --------- | -------------------------------- | ------------------------- |
| Format aktif | PHP Native (produksi) | Next.js (preview/praktek) |
| Biaya | Mulai ~Rp20–100rb/bln | Gratis (kuota terbatas) |
| MySQL | MySQL resmi dari hosting | Butuh DB cloud eksternal (TiDB free) |
| Kinerja | Persisten, stabil | Cold start tiap request |
| Cocok untuk | Produksi, sekolah | Demo / uji coba |

**Rekomendasi:** pakai **hosting custom PHP** (Hostinger/Rumahweb) untuk produksi resmi.
Vercel hanya untuk preview aplikasi Next.js cadangan.

---

## Opsi 3 — Aplikasi Android (Expo Go / WebView)

Folder `mobile/` berisi wrapper **React Native + Expo** yang memuat aplikasi web HadirTadz di dalam
**WebView** — bisa dijalankan di HP langsung lewat **Expo Go** (tanpa build native).

- `npm install` → `npx expo start` → scan QR dengan Expo Go (HP & PC satu WiFi).
- Tab **Lokal** (default `http://10.0.2.2/...`, ganti ke IP PC bila pakai HP fisik) dan
  **Online** (`https://hadirtadz.vercel.app/login`).
- Detil & kredensial uji: lihat `mobile/README.md`.
- Untuk produksi (APK): `npx expo run:android` atau `eas build`, dan **wajib HTTPS** (cleartext HTTP
  diblokir di WebView Android setelah API 28 untuk build produksi).

---

## Verifikasi setelah deploy

1. Buka `https://domainanda/` → login dengan admin `ADM-001` / `hadir123`.
2. Cek dashboard `/admin/index.php` menampilkan data (koneksi DB OK).
3. Uji `/scan.php` (kiosk) terbuka.
4. Pastikan `manifest.json` termuat (PWA) dan logo tidak error.
