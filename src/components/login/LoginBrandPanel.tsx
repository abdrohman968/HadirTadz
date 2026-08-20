'use client';

import React from 'react';
import Image from 'next/image';


interface LoginBrandPanelProps {
  schoolLogoUrl?: string;
  tagline?: string;
}

const FEATURES = [
  {
    title: 'Aman & Terpercaya',
    description: 'Data Anda terlindungi dengan sistem keamanan berlapis.',
    icon: (
      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: 'Mudah Digunakan',
    description: 'Antarmuka sederhana dan responsif di semua perangkat.',
    icon: (
      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Laporan Real-time',
    description: 'Pantau kehadiran secara akurat dan real-time.',
    icon: (
      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export default function LoginBrandPanel({ schoolLogoUrl, tagline }: LoginBrandPanelProps) {
  return (
    <aside className="hidden lg:flex flex-col justify-center items-center px-4 xl:px-8 py-4 h-full min-h-0 relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A7F3D0 0%, #D1FAE5 50%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #34D399 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-md xl:max-w-lg mx-auto w-full flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-1.5">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolLogoUrl}
              alt="Logo Sekolah"
              className="h-10 xl:h-12 w-auto object-contain mx-auto drop-shadow-md"
            />
          ) : (
            <Image
              src="/logo.png"
              alt="Logo HadirTadz"
              width={948}
              height={996}
              className="h-10 xl:h-12 w-auto object-contain mx-auto drop-shadow-md"
              priority
            />
          )}
        </div>

        {/* Brand Typography */}
        <h1 className="text-xl xl:text-2xl font-extrabold tracking-tight text-emerald-950 leading-tight">
          Hadir-Tadz
        </h1>
        <p className="mt-0.5 text-[11px] xl:text-xs font-semibold text-emerald-800">
          Aplikasi Absensi Digital
        </p>
        <p className="text-[10px] xl:text-[11px] text-slate-500">
          {tagline || 'Disiplin hari ini, sukses nanti.'}
        </p>

        {/* Laptop Workspace Mockup */}
        <div className="mt-3 w-full max-w-[280px] xl:max-w-[340px] relative group">
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_26px_-8px_rgba(5,150,105,0.2)] border border-emerald-100/70 bg-white">
            <Image
              src="/assets/desk_mockup.jpg"
              alt="Hadir-Tadz Dashboard Preview"
              width={760}
              height={570}
              className="w-full h-auto object-contain transform transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
        </div>

        {/* 3 Feature Highlights Card */}
        <div className="mt-2.5 w-full max-w-[340px] xl:max-w-[400px] bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-100/90 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.16)] p-2 xl:p-2.5">
          <div className="grid grid-cols-3 gap-1.5 text-left">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-start p-1 rounded-xl transition hover:bg-emerald-50/60">
                <div className="w-5 h-5 xl:w-6 xl:h-6 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mb-0.5 shrink-0">
                  {f.icon}
                </div>
                <h3 className="font-bold text-emerald-950 text-[10px] xl:text-[10.5px] leading-tight">{f.title}</h3>
                <p className="mt-0.5 text-[8.5px] xl:text-[9px] text-slate-500 leading-tight">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}