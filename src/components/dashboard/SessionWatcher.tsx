'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastError } from '@/components/ui/Toast';
import { beginLogout } from '@/lib/logout-guard';

/**
 * Idle timeout session (DEVELOPMENT_RULES #12).
 * Melacak aktivitas pengguna (mouse/keyboard/scroll/touch); bila tidak ada
 * aktivitas selama IDLE_MS, tampilkan overlay peringatan. Pengguna bisa
 * melanjutkan (perpanjang) atau logout otomatis setelah GRACE_MS.
 */
const IDLE_MS = 30 * 60 * 1000; // 30 menit idle
const GRACE_MS = 60 * 1000; // 1 menit masa tenggang
const WARN_AT = 10 * 60 * 1000; // warning pertama di 10 menit

export default function SessionWatcher() {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const lastActivity = useRef<number>(Date.now());
  const warned = useRef(false);
  const shownAt = useRef<number>(0);

  const doLogout = useRef(async () => {
    if (!beginLogout()) return; // sudah ada sesi logout lain yang berjalan
    await fetchAPI('/api/auth/logout', { method: 'POST', silent: true });
    toastError('Sesi berakhir karena tidak ada aktivitas. Silakan masuk kembali.');
    router.push('/login');
    router.refresh();
  });

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];
    const poke = () => {
      // Saat overlay tenggang tampil, aktivitas TIDAK boleh menutupnya otomatis —
      // hanya tombol "Saya Masih di Sini" yang boleh melanjutkan sesi.
      if (showPrompt) return;
      lastActivity.current = Date.now();
      warned.current = false;
    };
    events.forEach((ev) => window.addEventListener(ev, poke, { passive: true }));

    const timer = setInterval(() => {
      const now = Date.now();
      const since = now - lastActivity.current;
      if (since >= IDLE_MS) {
        if (!showPrompt) {
          setShowPrompt(true);
          shownAt.current = now;
        }
        // Masa tenggang habis => logout otomatis.
        if (shownAt.current && now - shownAt.current >= GRACE_MS) {
          doLogout.current();
        }
      } else if (since >= WARN_AT && !warned.current) {
        warned.current = true;
        toastError('Sesi hampir berakhir. Berinteraksilah dengan aplikasi agar tetap aktif.');
      }
    }, 15_000);

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, poke as EventListener));
    };
  }, [router, showPrompt]);

  const handleExtend = () => {
    lastActivity.current = Date.now();
    shownAt.current = 0;
    warned.current = false;
    setShowPrompt(false);
  };

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Sesi Tidak Aktif</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Anda tidak melakukan aktivitas selama 30 menit. Sesi akan berakhir otomatis dalam 1 menit.
              Lanjutkan aktivitas untuk tetap masuk.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => doLogout.current()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
              >
                Keluar Sekarang
              </button>
              <button
                type="button"
                onClick={handleExtend}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
              >
                Saya Masih di Sini
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}