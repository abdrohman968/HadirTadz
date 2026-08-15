'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface RecentScan {
  full_name: string;
  class_name: string | null;
  role_name: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
}

interface ScanUser {
  name: string;
  identifier: string;
  role: string;
  class: string;
  time: string;
  status: string;
  action: string;
}

interface ScanResult {
  success: boolean;
  already?: boolean;
  message: string;
  sound: 'success' | 'info' | 'warning' | 'error';
  user?: ScanUser;
}

export default function ScanKiosk({ schoolName, schoolId, recentScans }: { schoolName: string; schoolId?: number; recentScans: RecentScan[] }) {
  const [recent, setRecent] = useState<RecentScan[]>(recentScans);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraState, setCameraState] = useState<'active' | 'error' | 'starting'>('starting');
  const [clock, setClock] = useState('');
  const [busy, setBusy] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef({ code: '', time: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    async function start() {
      if (!readerRef.current) return;
      setCameraState('starting');
      try {
        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            const now = Date.now();
            if (decodedText === lastScannedRef.current.code && now - lastScannedRef.current.time < 3000) return;
            lastScannedRef.current = { code: decodedText, time: now };
            processScan(decodedText, 'qr');
          },
          () => {}
        );
        setCameraState('active');
      } catch (e) {
        setCameraState('error');
      }
    }
    start();
    return () => {
      const s = scannerRef.current;
      if (s) {
        try {
          s.stop().then(() => s.clear());
        } catch (e) {}
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function processScan(identifier: string, method: string) {
    if (busy || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, method, school_id: schoolId }),
      });
      const data: ScanResult = await res.json();
      if (!mountedRef.current) return;
      setResult(data);
      if (data.success && data.user) {
        prependRecent(data.user);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setResult({ success: false, message: 'Gagal memproses absensi: ' + String((e as any)?.message || ''), sound: 'error' });
    } finally {
      setTimeout(() => {
        inFlightRef.current = false;
        if (mountedRef.current) {
          setBusy(false);
          inputRef.current?.focus();
        }
      }, 1200);
    }
  }

  function prependRecent(u: ScanUser) {
    const entry: RecentScan = {
      full_name: u.name,
      class_name: u.class,
      role_name: u.role,
      time_in: u.action === 'CHECK_IN' ? u.time : null,
      time_out: u.action === 'CHECK_OUT' ? u.time : null,
      status: u.status,
    };
    setRecent((prev) => [entry, ...prev].slice(0, 8));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  const resultOk = result?.success;
  const statusColor = !result
    ? 'bg-slate-800 text-slate-400'
    : resultOk && result.user?.status === 'TERLAMBAT'
    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    : resultOk
    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30';

  return (
    <div id="main-content" className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased overflow-x-hidden">
      <header className="bg-slate-900/90 border-b border-emerald-900/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <a href="/admin" className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md transition" title="Kembali ke Dashboard" aria-label="Kembali ke dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </a>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2">
              <span className="font-black">
                <span className="text-white">Hadir</span>
                <span className="text-emerald-400">Tadz</span>
              </span>
              <span className="text-slate-400 font-normal hidden sm:inline">&bull;</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-200">{schoolName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">Kiosk</span>
            </h1>
            <p className="text-xs text-emerald-400/80">Pemindai QR Code &amp; Barcode Presensi Otomatis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/80 border border-emerald-800/60 px-4 py-1.5 rounded-xl flex items-center gap-2.5 text-emerald-300 font-mono text-sm sm:text-base font-bold shadow-inner">
            <span className="text-emerald-400 animate-pulse">{clock || '--:--:--'}</span>
          </div>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm transition" title="Layar Penuh" aria-label="Alihkan layar penuh">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                  {cameraState === 'active' ? 'Kamera Pemindai Aktif' : cameraState === 'error' ? 'Kamera Nonaktif (Gunakan Barcode Scanner)' : 'Memulai Kamera...'}
                </h2>
              </div>
            </div>

            <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
              <div id="qr-reader" className="w-full h-full" />
              <div className="scanner-laser pointer-events-none" />
              {cameraState === 'error' && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="font-bold text-sm text-white">Kamera Belum Aktif / Tidak Terdeteksi</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Pastikan Anda telah mengizinkan izin kamera di browser, atau gunakan <strong>Barcode Scanner USB</strong> / input NISN manual pada kolom di bawah.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <form
                className="relative flex items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = inputRef.current?.value.trim();
                  if (val) {
                    processScan(val, 'barcode');
                    if (inputRef.current) inputRef.current.value = '';
                  }
                  inputRef.current?.focus();
                }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h3v3H5V5zm11 0h3v3h-3V5zM5 16h3v3H5v-3zm11 0h3v3h-3v-3zm-5-9h2v2h-2V7zm4 2h2v2h-2V9zm-4 6h2v2h-2v-2z" /></svg>
                </div>
                <input
                  ref={inputRef}
                  autoFocus
                  autoComplete="off"
                  placeholder="Arahkan barcode scanner / ketik NISN lalu tekan ENTER..."
                  className="w-full pl-11 pr-24 py-3 bg-slate-950 border border-emerald-800/60 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-mono"
                />
                <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition">
                  Proses
                </button>
              </form>
              <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                Mendukung Barcode Scanner USB, Kamera HP, Webcam Laptop, &amp; Input Manual NISN.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div aria-live="polite" className="bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-emerald-700/50 rounded-3xl p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Status Pemindaian Terakhir</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>
                {result ? (resultOk ? (result.user?.status || 'Sukses') : 'Gagal') : 'Menunggu Scan...'}
              </span>
            </div>

            {!result ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500 text-2xl animate-pulse">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <p className="text-sm font-semibold text-slate-300">Dekatkan QR Code atau Kartu Pelajar</p>
                <p className="text-xs text-slate-500 mt-1">Sistem akan otomatis mengenali dan mencatat presensi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.user ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30">
                      <span>{result.user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-white truncate">{result.user.name}</h4>
                      <p className="text-xs font-mono text-emerald-400">ID: {result.user.identifier}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{result.user.role} • {result.user.class}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-rose-300">{result.message}</p>
                )}

                {result.user && (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block">Waktu Tercatat:</span>
                        <span className="text-base font-bold text-white">{result.user.time} WIB</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Tipe Presensi:</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {result.user.action === 'CHECK_IN' ? 'MASUK (CHECK-IN)' : 'PULANG (CHECK-OUT)'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        resultOk && result.user.status === 'TERLAMBAT'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                          : resultOk
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <span>{resultOk ? 'Berhasil' : 'Gagal'}</span>
                      <span className="flex-1">{result.message}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Riwayat Terkini Hari Ini</h3>
              <span className="text-[11px] text-emerald-400 font-medium">{recent.length} Terakhir</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {recent.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Belum ada aktivitas presensi hari ini.</div>
              ) : (
                recent.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {item.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{item.full_name}</div>
                        <div className="text-[10px] text-slate-400">{item.class_name || item.role_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">{fmt(item.time_out || item.time_in)}</div>
                      <div className={`text-[10px] font-semibold ${item.status === 'TERLAMBAT' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <style>{`
        .scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          animation: scan-move 2s ease-in-out infinite;
        }
        @keyframes scan-move {
          0%, 100% { top: 15%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}

function fmt(v: string | null): string {
  if (!v) return '-';
  return v.slice(0, 5);
}