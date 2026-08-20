'use client';

import React, { FormEvent, ReactNode } from 'react';

export interface SchoolOption {
  id: number;
  school_code: string;
  npsn: string;
  name: string;
  level: string;
  logo_url?: string;
  address?: string;
  phone?: string;
}

interface LoginFormProps {
  schools?: SchoolOption[];
  selectedSchoolId: number;
  onSchoolChange?: (id: number) => void;
  identifier: string;
  onIdentifierChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  remember: boolean;
  onRememberChange: (b: boolean) => void;
  showForgot: boolean;
  onToggleForgot: () => void;
  currentSchool?: SchoolOption;
  waUrl: string | null;
  error: string | null;
  successMsg: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  children?: ReactNode;
}

const inputBase =
  'w-full h-[48px] px-4 pl-11 rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 text-[15px] ' +
  'bg-white focus:outline-none transition duration-150 ' +
  'focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ' +
  'disabled:bg-slate-50 disabled:cursor-not-allowed';

const labelBase = 'block text-sm font-semibold text-slate-800 mb-1.5';

export default function LoginForm({
  identifier,
  onIdentifierChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  showForgot,
  onToggleForgot,
  currentSchool,
  waUrl,
  error,
  successMsg,
  loading,
  onSubmit,
  children,
}: LoginFormProps) {
  return (
    <div className="bg-white rounded-3xl border border-emerald-100/80 p-5 sm:p-6 shadow-[0_12px_45px_-12px_rgba(16,185,129,0.18)] relative">
      <header className="mb-4 text-center">
        <h2 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-emerald-950">
          Selamat Datang!
        </h2>
        <p className="mt-0.5 text-[13px] sm:text-[13px] text-slate-500">
          Silakan masuk untuk melanjutkan
        </p>
      </header>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 text-[13px] leading-relaxed animate-fade-in"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-[13px] leading-relaxed animate-fade-in"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Email / Username */}
        <div className="text-left">
          <label htmlFor="login-identifier" className={labelBase}>
            Email / Username
          </label>
          <div className="relative">
            <div className="w-5 h-5 absolute inset-y-0 left-3.5 my-auto text-slate-400 pointer-events-none flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => onIdentifierChange(e.target.value)}
              placeholder="Masukkan email atau username"
              disabled={loading}
              className={inputBase}
            />
          </div>
        </div>

        {/* Password */}
        <div className="text-left">
          <label htmlFor="login-password" className={labelBase}>
            Password
          </label>
          <div className="relative">
            <div className="w-5 h-5 absolute inset-y-0 left-3.5 my-auto text-slate-400 pointer-events-none flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Masukkan password"
              disabled={loading}
              className={`${inputBase} pr-11`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showPassword}
              onClick={onTogglePassword}
              disabled={loading}
              className="absolute inset-y-0 right-0 pr-3.5 my-auto flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Lupa password right-aligned */}
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={onToggleForgot}
            aria-expanded={showForgot}
            aria-controls="forgot-password-panel"
            className="text-[13px] sm:text-[13px] text-emerald-600 hover:text-emerald-700 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md transition cursor-pointer"
          >
            Lupa password?
          </button>
        </div>

        {/* Forgot password floating toast */}
        {showForgot && (
          <div
            id="forgot-password-panel"
            className="fixed inset-x-0 bottom-0 z-50 p-4 pb-6 sm:p-6 sm:pb-8 animate-slide-in lg:absolute lg:inset-x-auto lg:bottom-auto lg:top-0 lg:right-0 lg:mt-2 lg:p-0 lg:w-80"
            role="dialog"
            aria-label="Bantuan Reset Password"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 relative">
              <button
                type="button"
                onClick={() => onToggleForgot()}
                className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-[13px] font-bold text-emerald-950">Bantuan Reset Password</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                    Hubungi administrator <span className="font-semibold text-emerald-800">{currentSchool?.name || 'sekolah'}</span> untuk mereset kata sandi Anda.
                  </p>
                  <div className="mt-2.5">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp Admin</span>
                      </a>
                    ) : (
                      <p className="text-[12px] text-slate-500">
                        Hubungi tata usaha / admin sekolah.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[48px] px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-[15px] tracking-wide shadow-md shadow-emerald-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <span
                className="w-5 h-5 border-2 border-white/70 border-t-white rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Masuk</span>
          )}
        </button>
      </form>

      {/* Children: Divider + Register CTA */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}