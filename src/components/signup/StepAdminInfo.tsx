'use client';

import { useState } from 'react';
import { validateForm, validateField, hasErrors, type Rule } from '@/lib/validation';
import type { Step2Data } from './types';
import { inputFieldCls, FieldError } from '@/components/ui/Modal';

const RULES: Rule<Step2Data>[] = [
  { field: 'admin_name', label: 'Nama Lengkap Admin', required: true, min: 3 },
  { field: 'admin_email', label: 'Email Admin', required: true, email: true },
  { field: 'admin_phone', label: 'No. WhatsApp', required: true, phone: true },
  { field: 'username', label: 'Username', required: true, min: 3, max: 50, pattern: /^[a-zA-Z0-9_.-]+$/, patternMsg: 'Username hanya boleh huruf, angka, titik, garis bawah, atau strip' },
  { field: 'password', label: 'Password', required: true, min: 8 },
];

interface Props {
  data: Step2Data;
  onChange: (patch: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAdminInfo({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleChange = (key: keyof Step2Data) => (value: string) => {
    onChange({ [key]: value });
    if (errors[key]) {
      const next = { ...data, [key]: value };
      const err = validateField(next, key as string, RULES);
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  // Konfirmasi password dicek langsung.
  const handleConfirmChange = (value: string) => {
    onChange({ confirm_password: value });
    if (value !== data.password) {
      setErrors((prev) => ({ ...prev, confirm_password: 'Konfirmasi password tidak cocok.' }));
    } else {
      setErrors((prev) => ({ ...prev, confirm_password: '' }));
    }
  };

  const strength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..5
  };

  const pwScore = strength(data.password);
  const strengthLabel = ['Lemah', 'Lemah', 'Cukup', 'Baik', 'Kuat', 'Sangat Kuat'][data.password ? pwScore : 0];
  const strengthColor =
    pwScore <= 1 ? 'bg-rose-500' : pwScore <= 2 ? 'bg-amber-500' : pwScore <= 3 ? 'bg-yellow-400' : pwScore <= 4 ? 'bg-emerald-500' : 'bg-emerald-600';

  const handleNext = () => {
    if (!data.password || !data.confirm_password) {
      setErrors((prev) => ({
        ...prev,
        password: data.password ? prev.password : 'Password wajib diisi',
        confirm_password: data.confirm_password ? prev.confirm_password : 'Konfirmasi password wajib diisi',
      }));
      return;
    }
    if (data.password !== data.confirm_password) {
      setErrors((prev) => ({ ...prev, confirm_password: 'Konfirmasi password tidak cocok.' }));
      return;
    }
    const errs = validateForm(data, RULES);
    if (hasErrors(errs)) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) document.getElementById(`s2-${first}`)?.focus();
      return;
    }
    setErrors({});
    onNext();
  };

  const pwBtnIcon = (visible: boolean) =>
    visible ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );

  const PwField = ({ id, label, value, onChange, placeholder, visible, onToggle }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    visible: boolean;
    onToggle: () => void;
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className={`${inputFieldCls('')} pr-11`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-600 hover:text-emerald-500 cursor-pointer"
        >
          {pwBtnIcon(visible)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Admin Sekolah</h2>
      <p className="text-sm text-slate-500 mt-0.5">Buat akun administrator yang akan mengelola sekolah.</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="s2-admin_name" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Nama Lengkap Admin <span className="text-rose-500">*</span>
          </label>
          <input
            id="s2-admin_name"
            type="text"
            placeholder="Masukkan nama lengkap"
            className={inputFieldCls(errors.admin_name)}
            value={data.admin_name}
            onChange={(e) => handleChange('admin_name')(e.target.value)}
          />
          <FieldError error={errors.admin_name} />
        </div>

        <div>
          <label htmlFor="s2-admin_nik" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            NIK / NIP
          </label>
          <input
            id="s2-admin_nik"
            type="text"
            placeholder="Masukkan NIK atau NIP"
            className={inputFieldCls(errors.admin_nik)}
            value={data.admin_nik}
            onChange={(e) => handleChange('admin_nik')(e.target.value)}
          />
          <FieldError error={errors.admin_nik} />
        </div>

        <div>
          <label htmlFor="s2-admin_email" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Email Admin <span className="text-rose-500">*</span>
          </label>
          <input
            id="s2-admin_email"
            type="email"
            placeholder="email.admin@sekolah.sch.id"
            className={inputFieldCls(errors.admin_email)}
            value={data.admin_email}
            onChange={(e) => handleChange('admin_email')(e.target.value)}
          />
          <FieldError error={errors.admin_email} />
        </div>

        <div>
          <label htmlFor="s2-admin_phone" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            No. WhatsApp <span className="text-rose-500">*</span>
          </label>
          <input
            id="s2-admin_phone"
            type="tel"
            placeholder="0812-3456-7890"
            className={inputFieldCls(errors.admin_phone)}
            value={data.admin_phone}
            onChange={(e) => handleChange('admin_phone')(e.target.value)}
          />
          <FieldError error={errors.admin_phone} />
        </div>

        <div>
          <label htmlFor="s2-username" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Username <span className="text-rose-500">*</span>
          </label>
          <input
            id="s2-username"
            type="text"
            placeholder="Masukkan username"
            className={inputFieldCls(errors.username)}
            value={data.username}
            onChange={(e) => handleChange('username')(e.target.value)}
          />
          <FieldError error={errors.username} />
        </div>

        <div>
          <PwField
            id="s2-password"
            label="Password"
            value={data.password}
            onChange={(v) => handleChange('password')(v)}
            placeholder="Minimal 8 karakter"
            visible={showPw}
            onToggle={() => setShowPw((v) => !v)}
          />
          {data.password && (
            <div className="mt-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pwScore ? strengthColor : 'bg-slate-200'}`} />
                ))}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">Kekuatan: {strengthLabel}</p>
            </div>
          )}
          <FieldError error={errors.password} />
        </div>

        <div>
          <PwField
            id="s2-confirm_password"
            label="Konfirmasi Password"
            value={data.confirm_password}
            onChange={handleConfirmChange}
            placeholder="Ulangi password"
            visible={showConfirmPw}
            onToggle={() => setShowConfirmPw((v) => !v)}
          />
          <FieldError error={errors.confirm_password} />
        </div>
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
          onClick={handleNext}
          className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-2xl text-white font-bold text-[15px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-600/25 cursor-pointer"
        >
          Selanjutnya
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}