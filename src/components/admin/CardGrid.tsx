import { qrDataUrl } from '@/lib/qr';
import { formatDateIndo } from '@/lib/dashboard-data';
import { todayStr } from '@/lib/queries';
import PrintButton from './PrintButton';

export interface StudentCard {
  id: number;
  user_id: number;
  full_name: string;
  nisn: string;
  class_id: number | null;
  class_name: string | null;
  major: string | null;
  identifier: string;
}

export interface ClassRow {
  id: number;
  class_name: string;
}

export default async function CardGrid({
  students,
  classes,
  filterClass,
  schoolName,
  address,
  npsn,
  academicYear,
}: {
  students: StudentCard[];
  classes: ClassRow[];
  filterClass: string;
  schoolName: string;
  address: string;
  npsn: string;
  academicYear: string;
}) {
  const cardRows = await Promise.all(
    students.map(async (s) => ({
      ...s,
      qr: await qrDataUrl(s.identifier, { width: 56, dark: '#064e3b', light: '#ffffff' }),
    }))
  );

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cetak Kartu Pelajar Digital</h1>
          <p className="text-xs sm:text-sm text-slate-500">Generate kartu tanda pengenal dengan QR Code untuk scan otomatis di gerbang sekolah.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <form method="GET" action="/admin/cards" className="flex items-center gap-2">
            <select name="class_id" defaultValue={filterClass} className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
              <option value="">-- Semua Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
            <button type="submit" className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
              Filter
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      <div className="card-print-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:gap-4">
        {cardRows.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
            Tidak ada data siswa yang ditemukan untuk dicetak.
          </div>
        ) : (
          cardRows.map((s) => (
            <div
              key={s.id}
              className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-600 relative overflow-hidden flex flex-col justify-between aspect-[1.58/1] print:break-inside-avoid"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L21 10l1-0.5L12 3zm-7 8.5L12 7l7 4.5-7 4.5-7-4.5zm10 4.02V14.5a5 5 0 00-3-1.5v2.06c.95.62 2 1.16 3 1.5zm-3-4.02c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold tracking-tight leading-tight">{schoolName}</h4>
                    <p className="text-[9px] text-emerald-200">KARTU TANDA PELAJAR</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-300">NPSN: {npsn}</span>
              </div>

              <div className="flex items-center gap-4 my-auto py-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-xl font-black text-white shadow-inner flex-shrink-0">
                  {String(s.full_name || '?').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">{s.full_name}</h3>
                  <p className="text-[11px] font-mono font-bold text-emerald-300">NISN: {s.nisn}</p>
                  <p className="text-[10px] text-emerald-100 mt-0.5">{s.class_name || 'Umum'}</p>
                  <p className="text-[9px] text-emerald-200/80">{s.major || ''}</p>
                </div>

                <div className="w-16 h-16 bg-white p-1 rounded-xl shadow flex items-center justify-center flex-shrink-0">
                  <img src={s.qr} alt="QR" className="w-full h-full" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-emerald-500/40 pt-2 text-[9px] text-emerald-200">
                <span>Tahun Ajaran: {academicYear}</span>
                <span className="font-bold text-white tracking-widest uppercase">ID DIGITAL</span>
              </div>

              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none"></div>
            </div>
          ))
        )}
      </div>

      <p className="no-print text-[11px] text-slate-400 text-center">
        {address} &bull; Dicetak {formatDateIndo(todayStr())}
      </p>
    </div>
  );
}