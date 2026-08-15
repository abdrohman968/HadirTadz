'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { statusBadge, formatTime } from '@/lib/format';

interface TodayAtt {
  id: number;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string;
}

export default function SelfCheckinForm({
  schoolLat,
  schoolLon,
  radiusLimit,
  todayAtt,
  redirectUrl,
}: {
  schoolLat: number;
  schoolLon: number;
  radiusLimit: number;
  todayAtt: TodayAtt | null;
  redirectUrl: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsState, setGpsState] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
  const [gpsMsg, setGpsMsg] = useState('Mendeteksi Lokasi GPS Anda...');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [cameraError, setCameraError] = useState('');

  const action = todayAtt ? (todayAtt.time_out ? 'done' : 'CHECK_OUT') : 'CHECK_IN';

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e: any) {
        setCameraError('Kamera tidak dapat diakses: ' + (e?.message || ''));
      }
    }
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState('error');
      setGpsMsg('Perangkat Anda tidak mendukung geolokasi.');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLon(lon);
        const dist = getDistance(lat, lon, schoolLat, schoolLon);
        setDistance(dist);
        if (dist <= radiusLimit) {
          setGpsState('valid');
          setGpsMsg(`Lokasi Valid: jarak Anda ${dist}m (di bawah batas ${radiusLimit}m)`);
        } else {
          setGpsState('invalid');
          setGpsMsg(`Di luar jangkauan: jarak Anda ${dist}m melebihi batas ${radiusLimit}m`);
        }
      },
      (err) => {
        setGpsState('error');
        setGpsMsg('Gagal mengambil lokasi: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [schoolLat, schoolLon, radiusLimit]);

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  async function submitAttendance(a: 'CHECK_IN' | 'CHECK_OUT') {
    if (currentLat === null || currentLon === null) {
      setMsg({ type: 'error', text: 'Lokasi GPS belum terdeteksi.' });
      return;
    }
    setBusy(true);
    setMsg(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    let photoBase64 = '';
    if (video && canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoBase64 = canvas.toDataURL('image/jpeg', 0.7);
      }
    }

    const res = await fetchAPI('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({
        latitude: currentLat,
        longitude: currentLon,
        photo_base64: photoBase64,
        action: a,
      }),
    });
    setBusy(false);
    setMsg({ type: res.success ? 'success' : 'error', text: res.message || (res.success ? 'Berhasil' : 'Gagal') });
    if (res.success) {
      toastSuccess(res.message || 'Presensi berhasil dicatat');
      setTimeout(() => router.refresh(), 1500);
    }
  }

  const gpsCard =
    gpsState === 'valid'
      ? 'bg-emerald-50 border-emerald-300'
      : gpsState === 'invalid'
      ? 'bg-rose-50 border-rose-300'
      : 'bg-slate-50 border-slate-200';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Presensi Mandiri (GPS &amp; Kamera)</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Lakukan absensi masuk atau pulang menggunakan validasi lokasi GPS sekolah dan foto selfie.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${gpsCard}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                gpsState === 'valid'
                  ? 'bg-emerald-600 text-white'
                  : gpsState === 'invalid'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {gpsState === 'loading' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">
                {gpsState === 'valid' ? 'Lokasi Valid (Di Lingkungan Sekolah)' : gpsState === 'invalid' ? 'Di Luar Jangkauan Sekolah' : 'Mendeteksi Lokasi GPS Anda...'}
              </h4>
              <p className="text-[11px] text-slate-500">{gpsMsg}</p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="font-bold text-slate-700">{distance !== null ? `${distance} Meter` : '-'}</span>
            <span className="block text-[10px] text-slate-400">Radius: {radiusLimit}m</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kamera Selfie (Verifikasi Wajah)</label>
          <div className="relative w-full aspect-video sm:aspect-[4/3] max-w-md mx-auto rounded-3xl overflow-hidden bg-black border-2 border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <canvas ref={canvasRef} className="hidden" />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="text-white/80 text-xs">{cameraError}</p>
              </div>
            )}
          </div>
          {cameraError && (
            <p className="text-center text-[11px] text-amber-600">
              Catatan: presensi tetap dapat dilakukan tanpa foto selfie.
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-center">
          {action === 'CHECK_IN' && (
            <button
              onClick={() => submitAttendance('CHECK_IN')}
              disabled={gpsState !== 'valid' || busy}
              className="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              <span>{busy ? 'Memproses...' : 'Presensi Masuk (Check-In)'}</span>
            </button>
          )}
          {action === 'CHECK_OUT' && (
            <button
              onClick={() => submitAttendance('CHECK_OUT')}
              disabled={gpsState !== 'valid' || busy}
              className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-amber-900/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>{busy ? 'Memproses...' : 'Presensi Pulang (Check-Out)'}</span>
            </button>
          )}
          {action === 'done' && (
            <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold w-full">
              Anda telah menyelesaikan presensi masuk ({todayAtt ? formatTime(todayAtt.time_in) : '-'}) dan pulang ({todayAtt ? formatTime(todayAtt.time_out) : '-'}) hari ini. {todayAtt ? statusBadge(todayAtt.status) : ''}
            </div>
          )}
        </div>

        {todayAtt && !todayAtt.time_out && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Presensi masuk tercatat pukul {formatTime(todayAtt.time_in)}</span>
            <span className="font-bold text-emerald-700">{action === 'CHECK_OUT' ? 'Silakan lakukan presensi pulang.' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}