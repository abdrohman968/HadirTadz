/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone untuk deployment Node.js di hosting custom (Hostinger,
  // Rumahweb, VPS) — hasil build siap jalankan `node server.js` tanpa node_modules
  // penuh. Di Vercel output ini diabaikan (Vercel punya builder sendiri).
  output: 'standalone',

  // Allow connections to localhost MySQL and external services
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs', 'jsonwebtoken'],
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;
