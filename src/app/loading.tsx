/**
 * Loading state global (skeleton) saat segment sedang di-render.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 animate-pulse"></div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Memuat HadirTadz...
        </div>
      </div>
    </div>
  );
}