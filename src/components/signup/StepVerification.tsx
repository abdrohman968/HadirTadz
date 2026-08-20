'use client';

import { useState } from 'react';
import { LEVEL_LABELS, type Step1Data, type Step2Data } from './types';

interface Props {
  step1: Step1Data;
  step2: Step2Data;
  onEditSchool: () => void;
  onEditAdmin: () => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string | null;
}

export default function StepVerification({ step1, step2, onEditSchool, onEditAdmin, onBack, onSubmit, submitting, error }: Props) {
  const [agreed, setAgreed] = useState(false);

  const rows: { label: string; value: string }[] = [
    { label: 'Nama Sekolah', value: step1.school_name },
    { label: 'NPSN', value: step1.npsn || '-' },
    { label: 'Jenjang', value: LEVEL_LABELS[step1.level] || step1.level },
    { label: 'Alamat', value: [step1.address, step1.city, step1.province].filter(Boolean).join(', ') },
    { label: 'Kode Pos', value: step1.postal_code || '-' },
    { label: 'Email Sekolah', value: step1.school_email },
    { label: 'No. Telepon', value: step1.school_phone },
  ];

  const adminRows: { label: string; value: string }[] = [
    { label: 'Nama Admin', value: step2.admin_name },
    { label: 'Email Admin', value: step2.admin_email },
    { label: 'No. WhatsApp', value: step2.admin_phone },
    { label: 'Username', value: step2.username },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Verifikasi Data</h2>
      <p className="text-sm text-slate-500 mt-0.5">Periksa kembali data Anda sebelum mendaftarkan sekolah.</p>

      <div className="mt-5 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Informasi Sekolah</h3>
            <button
              type="button"
              onClick={onEditSchool}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-600 cursor-pointer underline underline-offset-2"
            >
              Edit Data
            </button>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {rows.map((r) => (
              <div key={r.label}>
                <dt className="text-[11px] font-semibold text-slate-400">{r.label}</dt>
                <dd className="text-sm font-semibold text-slate-800 break-words">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Admin Sekolah</h3>
            <button
              type="button"
              onClick={onEditAdmin}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-600 cursor-pointer underline underline-offset-2"
            >
              Edit Data
            </button>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {adminRows.map((r) => (
              <div key={r.label}>
                <dt className="text-[11px] font-semibold text-slate-400">{r.label}</dt>
                <dd className="text-sm font-semibold text-slate-800 break-words">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            Saya menyetujui{' '}
            <button type="button" className="text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer">
              Syarat &amp; Ketentuan
            </button>{' '}
            dan{' '}
            <button type="button" className="text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer">
              Kebijakan Privasi
            </button>{' '}
            Hadir-Tadz.
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-[15px] hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/50 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!agreed || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-2xl text-white font-bold text-[15px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mendaftarkan...
            </>
          ) : (
            <>
              Daftarkan Sekolah
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}