'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginRegisterCTA() {
  return (
    <div className="pt-2">
      {/* Divider with text */}
      <div className="relative flex items-center justify-center my-3">
        <div className="grow border-t border-slate-200" />
        <span className="shrink mx-3 text-[13px] text-slate-500 font-normal">
          belum punya akun?
        </span>
        <div className="grow border-t border-slate-200" />
      </div>

      {/* Outline Register Button */}
      <Link
        href="/register-school"
        className="w-full inline-flex items-center justify-between h-[48px] px-6 rounded-2xl bg-white text-emerald-700 font-bold text-[15px] border border-emerald-500 hover:bg-emerald-50/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
      >
        <span className="w-full text-center pl-4">Daftar Sekarang</span>
        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}