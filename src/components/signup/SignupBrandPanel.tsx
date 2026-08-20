'use client';

import React from 'react';
import Image from 'next/image';

const FEATURES = [
  {
    title: 'Aman & Terpercaya',
    description: 'Data sekolah dan pengguna terlindungi dengan sistem keamanan berlapis.',
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
    title: 'Kelola Lebih Mudah',
    description: 'Kelola guru, siswa, kelas, dan absensi dalam satu sistem.',
    icon: (
      <svg className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
  },
  {
    title: 'Laporan Real-time',
    description: 'Pantau data kehadiran secara akurat dan real-time.',
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

export default function SignupBrandPanel() {
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
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Sekolah Baru
        </span>

        {/* Heading */}
        <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-emerald-950 leading-tight">
          Buat Akun Sekolah
          <br />
          Anda
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-500 max-w-sm">
          Daftarkan sekolah Anda untuk mengelola absensi siswa dan guru dengan mudah, akurat, dan aman.
        </p>

        {/* Laptop Workspace Mockup */}
        <div className="mt-6 w-full max-w-[320px] xl:max-w-[360px] relative group">
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
        <div className="mt-4 w-full max-w-[360px] xl:max-w-[410px] bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-100/90 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.16)] p-2 xl:p-2.5">
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

        {/* Brand */}
        <div className="mt-4">
          <p className="text-lg font-extrabold tracking-tight text-emerald-950 leading-tight">
            Hadir-<span className="text-emerald-600">Tadz</span>
          </p>
          <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">Aplikasi Absensi Digital</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Disiplin hari ini, sukses nanti.</p>
        </div>
      </div>
    </aside>
  );
}