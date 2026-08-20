'use client';

import { useState } from 'react';
import { validateForm, validateField, hasErrors, type Rule } from '@/lib/validation';
import { LEVELS, LEVEL_LABELS, type Step1Data } from './types';
import { inputFieldCls, FieldError } from '@/components/ui/Modal';

const PROVINCES = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Gorontalo',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Barat Daya',
];

const RULES: Rule<Step1Data>[] = [
  { field: 'school_name', label: 'Nama Sekolah', required: true, min: 3 },
  { field: 'level', label: 'Jenjang', required: true },
  { field: 'address', label: 'Alamat Sekolah', required: true },
  { field: 'city', label: 'Kota / Kabupaten', required: true },
  { field: 'province', label: 'Provinsi', required: true },
  { field: 'school_email', label: 'Email Sekolah', required: true, email: true },
  { field: 'school_phone', label: 'No. Telepon Sekolah', required: true, phone: true },
];

interface Props {
  data: Step1Data;
  onChange: (patch: Partial<Step1Data>) => void;
  onNext: () => void;
}

export default function StepSchoolInfo({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: keyof Step1Data) => (value: string) => {
    onChange({ [key]: value });
    if (errors[key]) {
      const next = { ...data, [key]: value };
      const err = validateField(next, key as string, RULES);
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  const handleNext = () => {
    const errs = validateForm(data, RULES);
    if (hasErrors(errs)) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) document.getElementById(`s1-${first}`)?.focus();
      return;
    }
    setErrors({});
    onNext();
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Informasi Sekolah</h2>
      <p className="text-sm text-slate-500 mt-0.5">Masukkan data utama sekolah Anda.</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="s1-school_name" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Nama Sekolah <span className="text-rose-500">*</span>
          </label>
          <input
            id="s1-school_name"
            type="text"
            placeholder="Contoh: SMA Negeri Harapan Bangsa"
            className={inputFieldCls(errors.school_name)}
            value={data.school_name}
            onChange={(e) => handleChange('school_name')(e.target.value)}
          />
          <FieldError error={errors.school_name} />
        </div>

        <div>
          <label htmlFor="s1-npsn" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            NPSN
          </label>
          <input
            id="s1-npsn"
            type="text"
            placeholder="Masukkan NPSN sekolah"
            className={inputFieldCls(errors.npsn)}
            value={data.npsn}
            onChange={(e) => handleChange('npsn')(e.target.value)}
          />
          <FieldError error={errors.npsn} />
        </div>

        <div>
          <label htmlFor="s1-level" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Jenjang <span className="text-rose-500">*</span>
          </label>
          <select
            id="s1-level"
            className={inputFieldCls(errors.level)}
            value={data.level}
            onChange={(e) => handleChange('level')(e.target.value)}
          >
            <option value="">Pilih jenjang sekolah</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <FieldError error={errors.level} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="s1-address" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Alamat Sekolah <span className="text-rose-500">*</span>
          </label>
          <input
            id="s1-address"
            type="text"
            placeholder="Masukkan alamat lengkap sekolah"
            className={inputFieldCls(errors.address)}
            value={data.address}
            onChange={(e) => handleChange('address')(e.target.value)}
          />
          <FieldError error={errors.address} />
        </div>

        <div>
          <label htmlFor="s1-city" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Kota / Kabupaten <span className="text-rose-500">*</span>
          </label>
          <input
            id="s1-city"
            type="text"
            placeholder="Contoh: Bandung"
            className={inputFieldCls(errors.city)}
            value={data.city}
            onChange={(e) => handleChange('city')(e.target.value)}
          />
          <FieldError error={errors.city} />
        </div>

        <div>
          <label htmlFor="s1-province" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Provinsi <span className="text-rose-500">*</span>
          </label>
          <select
            id="s1-province"
            className={inputFieldCls(errors.province)}
            value={data.province}
            onChange={(e) => handleChange('province')(e.target.value)}
          >
            <option value="">Pilih provinsi</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError error={errors.province} />
        </div>

        <div>
          <label htmlFor="s1-postal_code" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Kode Pos
          </label>
          <input
            id="s1-postal_code"
            type="text"
            placeholder="Contoh: 40383"
            className={inputFieldCls(errors.postal_code)}
            value={data.postal_code}
            onChange={(e) => handleChange('postal_code')(e.target.value)}
          />
          <FieldError error={errors.postal_code} />
        </div>

        <div>
          <label htmlFor="s1-school_email" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            Email Sekolah <span className="text-rose-500">*</span>
          </label>
          <input
            id="s1-school_email"
            type="email"
            placeholder="email@sekolah.sch.id"
            className={inputFieldCls(errors.school_email)}
            value={data.school_email}
            onChange={(e) => handleChange('school_email')(e.target.value)}
          />
          <FieldError error={errors.school_email} />
        </div>

        <div>
          <label htmlFor="s1-school_phone" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
            No. Telepon Sekolah <span className="text-rose-500">*</span>
          </label>
          <input
            id="s1-school_phone"
            type="tel"
            placeholder="Contoh: 0812-3456-7890"
            className={inputFieldCls(errors.school_phone)}
            value={data.school_phone}
            onChange={(e) => handleChange('school_phone')(e.target.value)}
          />
          <FieldError error={errors.school_phone} />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-2xl text-white font-bold text-[15px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-600/25 cursor-pointer"
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