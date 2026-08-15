'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { fetchAPI } from '@/lib/api';

const TICKET_TTL_S = 120;

/**
 * QR dinamis (DEVELOPMENT_RULES #13): QR berputar dengan masa berlaku singkat.
 * Memuat ticket dari server, render QR, refresh sebelum kedaluwarsa.
 */
export default function DynamicQr({ size = 140 }: { size?: number }) {
  const [qr, setQr] = useState<string>('');
  const [seconds, setSeconds] = useState(TICKET_TTL_S);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const res = await fetchAPI<{ ticket: string }>('/api/qr/ticket', { silent: true });
      if (!res.success || !res.data?.ticket) {
        setError('Gagal memperbarui QR. Coba segarkan halaman.');
        return;
      }
      const dataUrl = await QRCode.toDataURL(res.data.ticket, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#064e3b', light: '#ffffff' },
      });
      setQr(dataUrl);
      setSeconds(TICKET_TTL_S);
      setError('');
    } catch {
      setError('Gagal memperbarui QR. Coba segarkan halaman.');
    }
  }

  useEffect(() => {
    refresh();
    const refreshTimer = setInterval(refresh, (TICKET_TTL_S - 25) * 1000);
    const tick = setInterval(() => setSeconds((s) => Math.max(1, s - 1)), 1000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="text-center">
      {qr ? (
        <>
          <img src={qr} alt="QR Code dinamis (auto-refresh)" style={{ width: size, height: size }} />
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            QR Dinamis — berlaku: {mmss}
          </div>
          {error && <div className="text-[11px] text-rose-600 font-semibold">{error}</div>}
        </>
      ) : (
        <>
          <div style={{ width: size, height: size }} className="bg-slate-200 animate-pulse rounded-lg mx-auto" />
          {error && <div className="text-[11px] text-rose-600 font-semibold">{error}</div>}
        </>
      )}
    </div>
  );
}