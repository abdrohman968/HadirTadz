'use client';

/**
 * Global error boundary (client). Ditampilkan bila terjadi error saat
 * render, sehingga user tidak melihat stack trace mentah.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Terjadi Kesalahan</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Maaf, terjadi kesalahan tak terduga pada sistem. Silakan coba lagi.
            </p>
            {process.env.NODE_ENV === 'development' && error?.message && (
              <p className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono text-rose-600 break-words">
                {error.message}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => reset()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition"
              >
                Coba Lagi
              </button>
              <a
                href="/login"
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition text-center"
              >
                Kembali ke Login
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}