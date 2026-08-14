import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HadirTadz - Presensi Digital Terpadu',
  description: 'Sistem Presensi & Absensi Digital Multi-Tenant Berbasis QR Code dan GPS',
  manifest: '/manifest.json',
  themeColor: '#065f46',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
