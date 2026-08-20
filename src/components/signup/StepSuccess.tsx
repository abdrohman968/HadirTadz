'use client';

import Link from 'next/link';
import { type SignupResult } from './types';

interface Props {
  result: SignupResult;
}

export default function StepSuccess({ result }: Props) {
  return (
    <div className="animate-fade-in text-center py-4">
      <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="mt-5 text-2xl font-black text-emerald-950">Pendaftaran Berhasil!</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
        Sekolah Anda berhasil didaftarkan di Hadir-Tadz. Gunakan kredensial berikut untuk masuk.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-left space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400">Nama Sekolah</p>
          <p className="text-sm font-bold text-slate-800 break-words">{result.school_name}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">ID Sekolah</p>
          <p className="text-sm font-bold text-emerald-700 select-all">{result.school_code}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">ID Admin</p>
          <p className="text-sm font-bold text-emerald-700 select-all">{result.admin_identifier}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">Admin</p>
          <p className="text-sm font-bold text-slate-800">{result.admin_name}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-2xl text-white font-bold text-[15px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-600/25 cursor-pointer"
        >
          Masuk ke Hadir-Tadz
        </Link>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 h-[48px] px-8 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  );
}