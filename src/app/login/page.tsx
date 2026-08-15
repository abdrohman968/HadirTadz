'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';

interface School {
  id: number;
  school_code: string;
  npsn: string;
  name: string;
  level: string;
  logo_url?: string;
  address?: string;
  phone?: string;
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
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  // Fetch registered schools from API
  useEffect(() => {
    async function loadSchools() {
      const res = await fetchAPI<School[]>('/api/schools', { silent: true });
      if (res.success && res.data && res.data.length > 0) {
        setSchools(res.data);
      }
    }
    loadSchools();
  }, []);

  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

  const adminWhatsApp = (() => {
    const raw = currentSchool?.phone || '';
    let digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    return digits;
  })();
  const waUrl =
    adminWhatsApp &&
    `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent('Assalamualaikum/Selamat pagi, saya lupa kata sandi akun HadirTadz. Mohon bantuan untuk me-reset kata sandi saya. Terima kasih.')}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!identifier.trim()) {
      setError('ID Pengguna / Nomor Induk wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          school_id: selectedSchoolId,
          remember,
        }),
      });

      if (response.success) {
        setSuccessMsg(response.message || 'Login berhasil! Mengalihkan...');
        toastSuccess(response.message || 'Login berhasil');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      <div id="main-content" className="w-full max-w-md my-auto">
        
        {/* App Branding & Dynamic School Header */}
        <div className="text-center mb-3">
          {/* Dynamic Logo Emblem */}
          <div className="text-center mb-2">
            {currentSchool?.logo_url ? (
              <img
                src={currentSchool.logo_url}
                alt="Logo Sekolah"
                className="h-14 w-auto object-contain mx-auto"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="Logo HadirTadz"
                width={948}
                height={996}
                className="h-14 w-auto object-contain mx-auto hover:scale-105 transition-transform duration-300"
                priority
              />
            )}
          </div>

          {/* Two-Color App Name: Hadir (Dark Green) + Tadz (Bright Green) */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-300">
              Hadir
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-400">
              Tadz
            </span>
          </div>

          <p className="text-[11px] text-emerald-300/80 font-medium">
            Sistem Presensi & Absensi Digital Multi-Tenant
          </p>
        </div>

        {/* Login Card Component */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          
          {/* Header Card */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
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
            <div role="alert" className="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className="mb-5 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Multi-School Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                <span>Pilihan Sekolah / Institusi</span>
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
                  className="w-full pl-10 pr-8 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none cursor-pointer"
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-24 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-600 bg-slate-900/60 text-emerald-500 focus:ring-emerald-500 focus:ring-2"
                />
                <span>Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                aria-expanded={showForgot}
                aria-controls="forgot-password-panel"
              >
                Lupa Password?
              </button>
            </div>

            {/* Forgot Password Panel */}
            {showForgot && (
              <div id="forgot-password-panel" className="p-4 rounded-2xl bg-slate-900/50 border border-emerald-500/25 text-left">
                <div className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">Lupa Kata Sandi?</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Hubungi administrator sekolah <span className="font-semibold text-white">{currentSchool?.name}</span> melalui WhatsApp untuk me-reset kata sandi Anda.
                    </p>
                    <div className="mt-3">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <span>Hubungi Admin</span>
                        </a>
                      ) : (
                        <p className="text-[11px] text-amber-300/90">Nomor WhatsApp admin sekolah belum tersedia. Silakan hubungi pihak sekolah secara langsung.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {/* Register New School Link */}
          <div className="mt-3 text-center">
            <Link
              href="/register-school"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition"
            >
              <span>+ Daftarkan Sekolah Baru</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-slate-400 font-medium">
          <span className="font-bold text-emerald-400">HadirTadz v.1.0</span> - &copy; 2026
        </div>
      </div>
    </div>
  );
}
