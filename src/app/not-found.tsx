import Link from 'next/link';

/**
 * Halaman 404 global yang ramah, tanpa stack trace.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-5xl font-black text-slate-800 tracking-tight">404</p>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex w-full justify-center py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}