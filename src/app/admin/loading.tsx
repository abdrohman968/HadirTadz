/**
 * Skeleton halaman dashboard saat route sedang memuat (DEV RULES #1, #5).
 * Menampilkan kerangka kartu agar tidak "blank flash".
 */
export default function DashboardLoading() {
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`}></div>
  );

  return (
    <div className="space-y-6">
      <Skeleton className="h-32 sm:h-40 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-64" />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}