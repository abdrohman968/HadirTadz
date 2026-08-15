# Panduan Deployment — HadirTadz

Dokumen ini menjelaskan cara meng-online-kan aplikasi HadirTadz dalam **2 opsi**:

1. **Hosting gratis — Vercel** (disarankan untuk coba-coba / demo)
2. **Hosting custom — Hostinger, Rumahweb, VPS, dsb.** (untuk produksi resmi)

Kedua opsi memakai aplikasi yang sama (monorepo Next.js App Router). Perbedaan utama
ada di **bahan database** dan cara menjalankan Node.js.

---

## Prasyarat Umum (dua-duanya)

- Sudah punya kode aplikasi lengkap (folder `src/`, `package.json`, `.env.example`).
- Database MySQL sudah siap (schema ada di `database/schema.sql`, migrasi di `database/migrate.php`).
- Ganti `JWT_SECRET` dengan nilai acak yang unik untuk produksi:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Variabel Environment yang dipakai aplikasi

| Variabel | Wajib? | Keterangan |
| -------- | ------ | ---------- |
| `DB_HOST` | Ya | Host MySQL (mis. `localhost`, `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`). |
| `DB_PORT` | Ya | Default `3306`. |
| `DB_USER` | Ya | User DB. |
| `DB_PASS` | Ya | Password DB. |
| `DB_NAME` | Ya | Nama database (`hadir_tadz`). |
| `DB_SSL` | Opsional | `true` bila DB cloud (koneksi TLS wajib). Lokal biarkan kosong/`false`. |
| `DB_SSL_VERIFY` | Opsional | Default `true`. `false` hanya untuk sertifikat self-signed. |
| `DB_CONN_LIMIT` | Opsional | Limit koneksi pool. Default 5 di Vercel, 10 di hosting biasa. |
| `JWT_SECRET` | Ya | Rahasia penandatangan session (wajib acak & unik saat produksi). |
| `NEXT_PUBLIC_API_URL` | Tidak | Kosongkan (semua API internal `/api/*`). |

---

## Opsi 1 — Vercel (hosting gratis)

Vercel menyediakan deploy otomatis dari GitHub/GitLab dan domain `*.vercel.app` gratis.
**Vercel tidak menyediakan MySQL gratis** — jadi pasangkan DB cloud yang kompatibel MySQL.

### Langkah

1. **Siapkan database MySQL cloud gratis (TiDB Cloud — direkomendasikan):**
   - Daftar di [tidbcloud.com](https://tidbcloud.com) (paket Serverless **free**).
   - Buat cluster Serverless → note **host, port, user, password**.
   - Impor schema: `database/schema.sql` (bisa lewat UI → "Import Data").
2. **Push kode ke GitHub/GitLab:**

   ```bash
   git init && git add -A && git commit -m "init"
   git remote add origin <URL-repo> && git push -u origin main
   ```

   > Pastikan `.env.local` **tidak** di-push (sudah ada di `.gitignore`).

3. **Buat project baru di [vercel.com](https://vercel.com)** → *Add New Project* → import repo.
   - Framework dikenali otomatis: **Next.js**.
   - Build command: biarkan default (`next build`). Output `standalone` diabaikan Vercel.
4. **Isi Environment Variables** di tab *Settings → Environment Variables* (Production):

   ```text
   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
   DB_SSL=true          # wajib untuk TiDB/Aiven/Clever Cloud
   DB_CONN_LIMIT=3      # TiDB free tier membatasi koneksi
   ```

5. **Deploy.** Selesai → buka domain `https://<nama>.vercel.app`.
   - Login pakai akun percobaan (admin `ADM-001` / `hadir123`) untuk verifikasi.
6. *(Opsional)* **Domain kustom**: tambahkan domain di *Settings → Domains*.

### Catatan penting Vercel

- App ini memakai **Node.js runtime** di route API (connecting DB via `mysql2`) — sudah
  kompatibel serverless; tidak memakai Edge runtime untuk koneksi DB.
- Ganti `JWT_SECRET` di Vercel; jangan pakai secret lokal.
- Kalau nanti perlu `scan` kiosk via kamera, pastikan deploy memakai HTTPS (Vercel selalu).

---

## Opsi 2 — Hosting custom (Hostinger, Rumahweb, VPS)

Hosting custom meng-hosting **Node.js self-hosting** hasil build Next.js (`standalone`).
Database MySQL memakai MySQL yang tersedia di paket hosting (bisa dipindah dari lokal/Laragon).

### A. MySQL di hosting

1. Buat database MySQL di panel hosting (mis. cPanel → *MySQL Databases* pada Hostinger, atau
   *Database* pada Rumahweb). Catat host/port/user/pass/name.
2. Impor schema dari `database/schema.sql`.
   - Memakai phpMyAdmin? Impor langsung.
   - Via CLI dari komputer Anda:

     ```bash
     mysql -h <host> -P <port> -u <user> -p <name> < database/schema.sql
     ```

3. Pastikan koneksi dari aplikasi diizinkan (*Allow remote access*, atau aplikasikan ke
   server/hosting yang sama sehingga host = `localhost`).

### B. Menyiapkan build

1. Di komputer lokal, install dependensi lalu build (menghasilkan folder `.next/standalone`):

   ```bash
   npm install
   npm run build
   ```

2. Hasil build siap pakai ada di **`.next/standalone`**:
   - `server.js` + dependensi runtime (`node_modules/`) + `public/` sudah ada di sana.
   - Next.js 14 **tidak** otomatis menyalin `.next/static` (asset JS/CSS ter-hash) ke dalam
     standalone — itu bagian Anda. Jadi buat folder deploy seperti ini:

   ```text
   /deploy/                  <- isi dari .next/standalone, plus satu folder tambahan
   |- server.js
   |- .env                    <- variabel di bagian C
   |- node_modules/
   |- public/                 <- sudah ikut terbawa dari .next/standalone
   `- .next/
      |- server/ ...          <- dari .next/standalone/.next/
      `- static/              <- DITAMBAHKAN: salin seluruh isi .next/static dari hasil build
   ```

   Perintah copy-nya (PowerShell, dari root proyek):

   ```powershell
   $target = "C:\deploy"
   Copy-Item .next\standalone\* $target -Recurse        # server.js, .next, public, node_modules
   New-Item -ItemType Directory $target\.next -Force | Out-Null
   Copy-Item .next\static $target\.next\static -Recurse # asset statis Build
   ```

   Di server, jalankan `node server.js` dari dalam `$target`.

3. (*Alternatif sederhana*) Kalau hosting mendukung **Node.js app** (Hostinger *Node.js* paket,
   Rumahweb *Node.js Hosting*), upload **seluruh folder proyek** (tanpa `node_modules`) lalu di
   server jalankan `npm install && npm run build && npm run start`. Next.js menyalin statiknya
   sendiri saat `next start` — tidak perlu copy manual.

### C. Environment (.env di server)

Buat file `.env` di root app server:

```text
DB_HOST=localhost            # atau host MySQL hosting Anda
DB_PORT=3306
DB_USER=<user_database>
DB_PASS=<password_database>
DB_NAME=hadir_tadz
DB_SSL=false                 # true hanya bila MySQL hosting mengharuskan TLS
JWT_SECRET=<secret_acak_unik>
```

### D. Menjalankan Node.js

- **Paket Node.js hosting** (Hostinger/Rumahweb): pilih versi Node 18/20, buat aplikasi Node,
  set *entry point*:
  - Build dulu di server: jalankan `npm install && npm run build`, entry `npm run start`.
  - atau upload hasil `standalone` (struktur di atas), entry point `server.js`.
- **VPS**: jalankan sebagai service (misal PM2):

  ```bash
  npm install
  npm run build
  pm2 start .next/standalone/server.js --name hadirtadz --env production
  pm2 save && pm2 startup
  ```

### E. Domain & SSL

- Arahkan domain ke server/hosting (A record / nameserver).
- Paket Hostinger/Rumahweb umumnya sudah menyediakan **free SSL** (Let's Encrypt) +
  HTTP/2. Aktifkan di panel.

---

## Peta Keputusan: mana yang dipilih?

| Kebutuhan | Vercel (gratis) | Hosting custom |
| --------- | --------------- | -------------- |
| Biaya | Gratis (kuota terbatas) | Mulai ~Rp30–100rb/bln |
| MySQL | Perlu DB cloud eksternal (TiDB free) | MySQL resmi dari hosting |
| Performa & koneksi DB | Serverless (cold start tiap fungsi) | Persistent Node.js, lebih stabil |
| Kontrol server/panel | Sedikit (bukan akses server penuh) | Full access (cPanel/terminal) |
| Cocok untuk | Demo, trial, traffic ringan | Sekolah/produksi, banyak user |
| Scan kamera kiosk | OK (HTTPS) | OK (HTTPS wajib untuk kamera) |

**Rekomendasi:** mulai dengan **Vercel + TiDB** untuk uji coba; pindah ke **hosting custom**
saat aplikasi benar-benar dipakai (butuh koneksi DB yang stabil untuk presensi real-time).

---

## Verifikasi setelah deploy

1. Buka `/login` → login admin `ADM-001`/`hadir123`, lalu cek halaman `/admin`.
2. Arahkan ke `https://<domain>/api/stats` (butuh cookie session) atau halaman dashboard
   untuk memastikan DB tersambung (bila error "Gagal terhubung ke server", cek env DB_*).
3. Uji `https://<domain>/logo.png` termuat (gambar, bukan text/html).
4. *(Custom hosting)* Pastikan semua page route API berjalan: `/api/auth/login` mengembalikan JSON.
