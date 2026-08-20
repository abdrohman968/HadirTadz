# Panduan Distribusi & Build Mobile App: HadirTadz (v.1.0)
### Web to Native App (Android .apk / .aab & iOS .ipa) via Capacitor JS

Dokumen ini menjelaskan langkah-langkah untuk mengemas aplikasi web **HadirTadz** menjadi aplikasi *native mobile* siap rilis di **Google Play Store** dan **Apple App Store**.

---

## 1. Prasyarat Sistem
Pastikan perangkat pengembang telah terinstall:
- **Node.js** (v18+ atau v20+) & NPM
- **Android Studio** (untuk build APK/AAB Android)
- **Xcode** & macOS (untuk build iOS IPA)

---

## 2. Inisialisasi & Instalasi Capacitor JS
Di folder root proyek `absensi_digital`, jalankan perintah terminal berikut:

```bash
# 1. Inisialisasi package.json (jika belum ada)
npm init -y

# 2. Install Capacitor Core & CLI
npm install @capacitor/core @capacitor/cli --save

# 3. Install Plugin Kamera, Lokasi (GPS), & Status Bar
npm install @capacitor/camera @capacitor/geolocation @capacitor/status-bar @capacitor/splash-screen @capacitor/app --save

# 4. Install Platform Android & iOS
npm install @capacitor/android @capacitor/ios --save
```

---

## 3. Tambahkan Platform Native

```bash
# Tambahkan platform Android
npx cap add android

# Tambahkan platform iOS
npx cap add ios
```

---

## 4. Konfigurasi Izin Hardware (Kamera & GPS Presensi)

### A. Izin Android (`android/app/src/main/AndroidManifest.xml`)
Buka file `AndroidManifest.xml` dan pastikan baris izin berikut terpasang:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Izin Kamera untuk Scan QR & Foto Selfie Presensi -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Izin Geolocation GPS Presensi Mandiri -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <!-- Izin Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

### B. Izin iOS (`ios/App/App/Info.plist`)
Tambahkan kunci privasi kamera dan lokasi:

```xml
<key>NSCameraUsageDescription</key>
<string>HadirTadz membutuhkan akses kamera untuk memindai QR Code dan verifikasi presensi.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>HadirTadz membutuhkan lokasi GPS untuk memvalidasi radius kehadiran di sekolah.</string>
```

---

## 5. Sinkronisasi & Build Aplikasi

### A. Build Android (APK / AAB)
```bash
# Sinkronisasi konfigurasi ke project Android
npx cap sync android

# Buka Android Studio untuk build APK / Bundle (AAB)
npx cap open android
```
Di Android Studio:
1. Pilih **Build** > **Generate Signed Bundle / APK**.
2. Pilih **Android App Bundle (.aab)** untuk unggah ke **Google Play Console**.
3. Masukkan Keystore & password, lalu klik **Build**.

### B. Build iOS (IPA)
```bash
# Sinkronisasi konfigurasi ke project iOS
npx cap sync ios

# Buka project di Xcode
npx cap open ios
```
Di Xcode:
1. Atur **Signing & Capabilities** dengan Apple Developer Team Anda.
2. Pilih **Product** > **Archive**.
3. Klik **Distribute App** untuk upload ke **App Store Connect / TestFlight**.

---

## 6. Fitur PWA (Progressive Web App - Tanpa Install Toko Aplikasi)
Selain rilis toko aplikasi, pengguna di HP juga dapat langsung memasang aplikasi:
1. Buka URL HadirTadz di Chrome / Safari (HP).
2. Klik banner pop-up **"Pasang Aplikasi HadirTadz"** atau menu browser **"Tambahkan ke Layar Utama" (Add to Home Screen)**.
3. Aplikasi akan langsung muncul di *app drawer* HP seperti aplikasi native.
