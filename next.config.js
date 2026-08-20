/** @type {import('next').NextConfig} */

// Kumpulan origin (hostname) yang diizinkan akses ke dev server selain localhost.
// IP LAN dideteksi otomatis dari antarmuka jaringan aktif supaya tetap jalan
// saat PC berpindah WiFi (IP bisa berubah). Expo Go / browser HP butuh ini agar
// asset /_next/* tidak diblokir (cross-origin).
const { networkInterfaces } = require('os');
function localOrigins() {
  const origins = ['localhost', '127.0.0.1'];
  const ifaces = networkInterfaces();
  for (const list of Object.values(ifaces) || []) {
    for (const iface of list || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        origins.push(iface.address);
      }
    }
  }
  return origins;
}

const nextConfig = {
  // Output standalone untuk deployment Node.js di hosting custom (Hostinger,
  // Rumahweb, VPS) — hasil build siap jalankan `node server.js` tanpa node_modules
  // penuh. Di Vercel output ini diabaikan (Vercel punya builder sendiri).
  output: 'standalone',

  // Allow connections to localhost MySQL and external services
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs', 'jsonwebtoken'],
  },

  // Allow dev-server access from localhost + LAN IP (Expo Go / phone browser)
  // without triggering cross-origin blocks for /_next/* assets.
  allowedDevOrigins: localOrigins(),

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;
