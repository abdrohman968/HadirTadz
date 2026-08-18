# HadirTadz Mobile (Expo Go / WebView)

Wrapper ringan berbasis **React Native + Expo (SDK 57)** yang menampilkan aplikasi web HadirTadz di dalam **WebView**. Bisa dijalankan langsung lewat **Expo Go** tanpa build native.

Fitur:
- Tab target **Lokal** dan **Online** (tap untuk pindah server).
- Indikator loading, halaman error + tombol "Coba Lagi".
- Tautan eksternal (`wa.me`, dll.) dibuka di aplikasi luar, halaman internal tetap di WebView (session login bertahan).

## Menjalankan (Expo Go)

1. Instal **Expo Go** di HP dari Play Store / App Store (versi terbaru mendukung **Expo SDK 57**).
2. (HP & PC harus satu WiFi) Jalankan dev server:
   ```
   npm install
   npx expo start
   ```
3. Scan QR code yang muncul dengan kamera HP (Android) atau kamera Expo Go (iOS).

## Target URL

Buka `App.js`, bagian `TARGETS`:

| key | label   | uri (default)                          |
|-----|---------|----------------------------------------|
| local | Lokal  | `http://<IP-LAN-PC>/absensi_digital/auth/login.php` |
| online | Online | `https://hadirtadz.vercel.app/login`  |

Catatan:
- IP LAN PC **diambil otomatis** dari alamat Metro (`Constants.expoConfig.hostUri`) yang dihubungi Expo Go — tidak perlu edit manual. Saat `npx expo start` menampilkan IP seperti `exp://192.168.1.10:8081`, target Lokal memakai `192.168.1.10`.
- Syarat "Gagal Terhubung" hilang: **HP & PC satu WiFi**, server Laragon **Apache aktif**, dan tidak memakai `10.0.2.2` (itu khusus Android Emulator).
- Verifikasi manual dari browser HP: buka `http://<IP-LAN-PC>/absensi_digital/auth/login.php` — wajib tampil halaman login sebelum mencoba di Expo Go.

## Kredensial Login Uji (seed)

- Admin: `ADM-001` / `hadir123`
- Guru: `198503152010011002` / `hadir123`
- Siswa: `12009101` / `hadir123`

## Build Produksi (opsional)

```
npx expo run:android   # APK lokal (Perlu Android Studio)
eas build --platform android   # Build cloud via EAS
```

> Catatan keamanan: versi lokal memakai HTTP (cleartext). Saat build produksi, gunakan HTTPS (Vercel) dan pertimbangkan menambah config `android.usesCleartextTraffic=false`.