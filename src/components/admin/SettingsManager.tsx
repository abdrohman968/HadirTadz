'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { Field, inputCls, btnPrimary } from '@/components/ui/Modal';

const defaultSettings: Record<string, string> = {
  schoolName: '',
  npsn: '',
  schoolLevel: 'SMA',
  address: '',
  operatorName: '',
  operatorPhone: '',
  latitude: '-6.92720000',
  longitude: '107.72250000',
  radiusMeters: '150',
  waApiKey: '',
  waGatewayNumber: '',
};

export default function SettingsManager() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setSettings((s) => ({ ...s, ...data }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function set(key: string, val: string) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMsg({ type: 'error', text: 'Perangkat Anda tidak mendukung geolokasi.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(8));
        set('longitude', pos.coords.longitude.toFixed(8));
        setMsg({ type: 'success', text: 'Lokasi GPS berhasil diambil dari perangkat Anda!' });
      },
      (err) => setMsg({ type: 'error', text: `Gagal mengambil lokasi: ${err.message}` })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    setBusy(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil disimpan!' });
      toastSuccess(res.message || 'Berhasil');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan pengaturan' });
    }
  }

  if (!loaded) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
        <p>Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pengaturan Sekolah &amp; Lokasi GPS</h1>
        <p className="text-xs sm:text-sm text-slate-500">Konfigurasi profil institusi, koordinat Geofencing absensi mobile, dan integrasi WhatsApp.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11l18-7v2l-18 7V11zM3 15l18-7v2l-18 7v-2zM3 19l9-3.5V18L3 21v-2z" /></svg>
            <span>Identitas Sekolah / Madrasah</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nama Resmi Sekolah">
                <input type="text" required className={inputCls} value={settings.schoolName} onChange={(e) => set('schoolName', e.target.value)} />
              </Field>
            </div>
            <Field label="NPSN">
              <input type="text" required className={`${inputCls} font-mono`} value={settings.npsn} onChange={(e) => set('npsn', e.target.value)} />
            </Field>
          </div>

          <Field label="Alamat Lengkap">
            <textarea rows={2} className={inputCls} value={settings.address} onChange={(e) => set('address', e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Petugas / Operator">
              <input type="text" className={inputCls} value={settings.operatorName} onChange={(e) => set('operatorName', e.target.value)} />
            </Field>
            <Field label="No. Kontak Operator">
              <input type="text" className={`${inputCls} font-mono`} value={settings.operatorPhone} onChange={(e) => set('operatorPhone', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Titik Koordinat GPS &amp; Geofencing</span>
            </h3>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              <span>Gunakan Lokasi Saat Ini</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Titik koordinat ini digunakan sebagai acuan validasi jarak (radius) saat siswa atau guru melakukan absen mandiri dari HP masing-masing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Latitude">
              <input type="text" required className={`${inputCls} font-mono`} value={settings.latitude} onChange={(e) => set('latitude', e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input type="text" required className={`${inputCls} font-mono`} value={settings.longitude} onChange={(e) => set('longitude', e.target.value)} />
            </Field>
            <Field label="Batas Radius (Meter)">
              <input type="number" required className={`${inputCls} font-mono`} value={settings.radiusMeters} onChange={(e) => set('radiusMeters', e.target.value)} />
            </Field>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>
              Koordinat saat ini:{' '}
              <a
                href={`https://maps.google.com/?q=${settings.latitude},${settings.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-700 underline"
              >
                Buka di Google Maps &rarr;
              </a>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.55 0 1-.45 1-1 0-.26-.1-.5-.27-.68-.16-.18-.27-.42-.27-.69 0-.55.45-1 1-1h2c3.31 0 6-2.69 6-6 0-4.96-4.48-9-10-9zm-4 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
            <span>Integrasi WhatsApp Gateway</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="API Key / Token WA Gateway">
              <input type="password" placeholder="Token API penyedia WA..." className={`${inputCls} font-mono`} value={settings.waApiKey} onChange={(e) => set('waApiKey', e.target.value)} />
            </Field>
            <Field label="Nomor Pengirim (Gateway)">
              <input type="text" placeholder="08xxxxxxxx" className={`${inputCls} font-mono`} value={settings.waGatewayNumber} onChange={(e) => set('waGatewayNumber', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50 px-6 py-3 font-bold shadow-lg shadow-emerald-900/20`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            <span>{busy ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}