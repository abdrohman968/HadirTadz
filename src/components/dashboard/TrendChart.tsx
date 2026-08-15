import type { TrendPoint } from '@/lib/dashboard-data';

const SERIES: { key: keyof TrendPoint; label: string; cls: string }[] = [
  { key: 'hadir', label: 'Hadir', cls: 'bg-emerald-500' },
  { key: 'terlambat', label: 'Terlambat', cls: 'bg-amber-500' },
  { key: 'izin', label: 'Izin', cls: 'bg-blue-500' },
  { key: 'sakit', label: 'Sakit', cls: 'bg-purple-500' },
  { key: 'alpha', label: 'Alpha', cls: 'bg-rose-500' },
];

/**
 * Grafik batang bertumpuk (stacked bar) tanpa library eksternal.
 * SERVER-safe (tanpa hooks/hydrasi) untuk dashboard admin.
 */
export default function TrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  const max = Math.max(1, ...data.map((p) => p.hadir + p.terlambat + p.izin + p.sakit + p.alpha));

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 flex-wrap mb-3">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.cls}`}></span>
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-1.5 sm:gap-3" style={{ height }}>
        {data.map((p, i) => {
          const values = [
            { v: p.hadir, c: 'bg-emerald-500' },
            { v: p.terlambat, c: 'bg-amber-500' },
            { v: p.izin, c: 'bg-blue-500' },
            { v: p.sakit, c: 'bg-purple-500' },
            { v: p.alpha, c: 'bg-rose-500' },
          ];
          const total = p.hadir + p.terlambat + p.izin + p.sakit + p.alpha;
          return (
            <div key={i} className="flex-1 min-w-0 group">
              <div
                className="relative flex flex-col justify-end rounded-t-md overflow-hidden bg-slate-100 dark:bg-slate-800"
                style={{ height: `${Math.max((total / max) * 100, total > 0 ? 4 : 2)}%` }}
                title={`${p.label}: ${total} kehadiran`}
              >
                {values.map((seg, j) =>
                  seg.v > 0 ? (
                    <div
                      key={j}
                      className={`w-full ${seg.c}`}
                      style={{ height: `${(seg.v / Math.max(total, 1)) * 100}%` }}
                    ></div>
                  ) : null
                )}
                {total > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {total}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 sm:gap-3 mt-2">
        {data.map((p, i) => (
          <div key={i} className="flex-1 min-w-0 text-center text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}