'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';

export default function RegisterSchoolPage() {
  const [form, setForm] = useState({
    school_name: '',
    npsn: '',
    level: 'SMA',
    address: '',
    admin_name: '',
    identifier: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const inputCls =
    'w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition';

  interface PwFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    required?: boolean;
    visible: boolean;
    onToggle: () => void;
  }

  function PwField({ id, label, value, onChange, placeholder, required, visible, onToggle }: PwFieldProps) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            required={required}
            placeholder={placeholder}
            className={`${inputCls} w-full pl-10 pr-11`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            onClick={onToggle}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            {visible ? (
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
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/register-school', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Pendaftaran berhasil!' });
      setTimeout(() => {
        window.location.href = '/login?registered=1';
      }, 1800);
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal mendaftarkan sekolah' });
    }
  }

  return (
    <div id="main-content" className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-2xl">
        {/* App Branding — samakan dengan halaman login */}
        <div className="text-center mb-5">
          <Link href="/login" className="inline-block group">
            <Image
              src="/logo.png"
              alt="Logo HadirTadz"
              width={948}
              height={996}
              className="h-14 w-auto object-contain mx-auto hover:scale-105 transition-transform duration-300"
              priority
            />
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-300">
                Hadir
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-emerald-400">
                Tadz
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-medium mt-1">
              Sistem Presensi & Absensi Digital Multi-Tenant
            </p>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl">
          <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Daftarkan Institusi Sekolah Baru</h2>
              <p className="text-xs text-slate-300 mt-0.5">Satu sistem presensi terpadu untuk sekolah &amp; madrasah Anda</p>
            </div>
            <Link href="/login" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span>Kembali Login</span>
            </Link>
          </div>

          {msg && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${msg.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200' : 'bg-rose-500/20 border border-rose-500/40 text-rose-200'}`}>
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span>1. Informasi Sekolah / Lembaga</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Sekolah / Madrasah *</label>
                  <input type="text" required placeholder="Contoh: SMA Negeri 1 Teladan / Pesantren Al-Hikmah" className={inputCls} value={form.school_name} onChange={(e) => set('school_name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">NPSN / Nomor Statistik *</label>
                  <input type="text" required placeholder="Contoh: 20227912" className={inputCls} value={form.npsn} onChange={(e) => set('npsn', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenjang Pendidikan *</label>
                  <select className={inputCls} value={form.level} onChange={(e) => set('level', e.target.value)}>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                    <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                    <option value="MA">MA (Madrasah Aliyah)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="MTS">MTs (Madrasah Tsanawiyah)</option>
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                    <option value="PESANTREN">Pondok Pesantren</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekolah</label>
                  <input type="text" placeholder="Jl. Raya Pendidikan No. 10..." className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span>2. Akun Administrator Utama</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Admin / PIC *</label>
                  <input type="text" required placeholder="Contoh: Muhammad Syukri, S.Pd" className={inputCls} value={form.admin_name} onChange={(e) => set('admin_name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username / ID Admin (Opsional)</label>
                  <input type="text" placeholder="Contoh: ADM-TELADAN (Otomatis jika kosong)" className={inputCls} value={form.identifier} onChange={(e) => set('identifier', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Resmi Sekolah / Admin</label>
                  <input type="email" placeholder="admin@sekolah.sch.id" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / Telepon</label>
                  <input type="text" placeholder="0812xxxxxxxx" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <PwField
                  id="reg-password"
                  label="Kata Sandi (Password) *"
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  placeholder="Minimal 6 karakter"
                  required
                  visible={showPw}
                  onToggle={() => setShowPw(!showPw)}
                />
                <PwField
                  id="reg-confirm-password"
                  label="Konfirmasi Kata Sandi *"
                  value={form.confirm_password}
                  onChange={(v) => set('confirm_password', v)}
                  placeholder="Ulangi kata sandi"
                  required
                  visible={showConfirmPw}
                  onToggle={() => setShowConfirmPw(!showConfirmPw)}
                />
              </div>
            </div>

            <div className="pt-3">
              <button type="submit" disabled={busy} className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{busy ? 'Mendaftarkan...' : 'Daftarkan Sekolah & Buat Sistem Absensi'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <span className="font-bold text-emerald-400">HadirTadz v.1.0</span> &bull; &copy; 2026 Hak Cipta Dilindungi Undang-Undang
        </div>
      </div>
    </div>
  );
}