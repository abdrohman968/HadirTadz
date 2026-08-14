'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

interface School {
  id: number;
  school_code: string;
  npsn: string;
  name: string;
  level: string;
  logo_url?: string;
  address?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([
    {
      id: 1,
      school_code: 'SCH-001',
      npsn: '20227912',
      name: "SMA Terpadu Al-Mu'min",
      level: 'SMA',
    },
    {
      id: 2,
      school_code: 'SCH-002',
      npsn: '20227913',
      name: 'SMK Informatika Mandiri',
      level: 'SMK',
    },
  ]);

  const [selectedSchoolId, setSelectedSchoolId] = useState<number>(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch registered schools from API
  useEffect(() => {
    async function loadSchools() {
      const res = await fetchAPI<School[]>('/api/schools');
      if (res.success && res.data && res.data.length > 0) {
        setSchools(res.data);
      }
    }
    loadSchools();
  }, []);

  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          school_id: selectedSchoolId,
        }),
      });

      if (response.success) {
        setSuccessMsg(response.message || 'Login berhasil! Mengalihkan...');
        const dest = response.redirectUrl || '/admin';
        setTimeout(() => {
          router.push(dest);
        }, 600);
      } else {
        setError(response.message || 'Gagal login. Periksa kembali ID dan Password Anda.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md my-auto">
        
        {/* App Branding & Dynamic School Header */}
        <div className="text-center mb-6">
          {/* Dynamic Logo Emblem */}
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-emerald-900/40 border border-emerald-500/30 backdrop-blur-xl shadow-2xl mb-3 hover:scale-105 transition-transform duration-300">
            {currentSchool?.logo_url ? (
              <img
                src={currentSchool.logo_url}
                alt="Logo Sekolah"
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 text-white flex items-center justify-center text-3xl shadow-lg">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Two-Color App Name: Hadir (Dark Green) + Tadz (Bright Green) */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm text-emerald-300">
              Hadir
            </span>
            <span className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm text-emerald-400">
              Tadz
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider font-mono">
              v.1.0
            </span>
          </div>

          {/* Dynamic School Title */}
          <h2 className="text-base font-bold text-slate-200 mt-1.5 truncate max-w-sm mx-auto">
            {currentSchool?.name}
          </h2>
          <p className="text-xs text-emerald-300/80 font-medium">
            Sistem Presensi & Absensi Digital Multi-Tenant
          </p>
        </div>

        {/* Login Card Component */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          
          {/* Header Card */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white">Masuk ke Portal</h2>
              <p className="text-xs text-slate-300">Gunakan akun Admin, Guru, atau Siswa</p>
            </div>
            <Link
              href="/scan"
              title="Buka Mode Kiosk Scanner Gerbang"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/70 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition group"
            >
              <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Kiosk</span>
            </Link>
          </div>

          {/* Success / Error Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Multi-School Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Pilihan Sekolah / Institusi</span>
                <Link href="/register-school" className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold lowercase tracking-normal">
                  + daftar baru
                </Link>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(Number(e.target.value))}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id} className="bg-slate-900 text-white">
                      {sch.name} (NPSN: {sch.npsn})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                ID Pengguna / NIP / NISN / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: ADM-001 / NISN / Email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Kata Sandi (Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk ke HadirTadz</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                Atau
              </span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              onClick={() => handleFillDemo('admin@sekolah.sch.id', 'hadir123')}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 shadow-md transition flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Masuk dengan Google (SSO Admin)</span>
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Akun Demo (Klik untuk Isi Otomatis)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('ADM-001', 'hadir123')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group"
              >
                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-white">Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">ADM-001</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('198503152010011002', 'hadir123')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group"
              >
                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-white">Guru</div>
                <div className="text-[10px] text-slate-400 font-mono">Pak Budi</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('12009101', 'hadir123')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-800/60 border border-slate-700 text-left transition group"
              >
                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-white">Siswa</div>
                <div className="text-[10px] text-slate-400 font-mono">Rizky</div>
              </button>
            </div>
          </div>

          {/* Register New School Link */}
          <div className="mt-4 text-center">
            <Link
              href="/register-school"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition"
            >
              <span>+ Daftarkan Sekolah Baru ke HadirTadz &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          <span className="font-bold text-emerald-400">HadirTadz v.1.0</span> - &copy; 2026
        </div>
      </div>
    </div>
  );
}
