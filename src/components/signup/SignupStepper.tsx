'use client';

const STEPS = [
  { label: 'Sekolah', mobile: 'Sekolah' },
  { label: 'Admin', mobile: 'Admin' },
  { label: 'Verifikasi', mobile: 'Verifikasi' },
  { label: 'Selesai', mobile: 'Selesai' },
];

export default function SignupStepper({ current }: { current: number }) {
  return (
    <div className="w-full">
      <ol className="flex items-center justify-between w-full">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-0">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0 ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`mt-1.5 text-[10px] font-semibold truncate max-w-full ${
                    done || active ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="sm:hidden">{s.mobile}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-r-full -mt-4 ${i < current ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div
                    className={`h-full rounded-r-full bg-emerald-500 transition-all duration-300 ${
                      i < current ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}