import { getStudentByUserId } from '@/lib/dashboard-data';
import PrintButton from '@/components/admin/PrintButton';
import DynamicQr from '@/components/siswa/DynamicQr';

export default async function StudentCard({
  user,
  schoolName,
  npsn,
  academicYear,
}: {
  user: { id: number; full_name: string; identifier: string };
  schoolName: string;
  npsn: string;
  academicYear: string;
}) {
  const student = await getStudentByUserId(user.id);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Kartu Pelajar Digital</h1>
        <p className="text-xs text-emerald-600">Tunjukkan QR Code ini ke kamera pemindai gerbang sekolah</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/50 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-emerald-500/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-extrabold text-lg shadow-md">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L21 10l1-0.5L12 3zm-7 8.5L12 7l7 4.5-7 4.5-7-4.5zm10 4.02V14.5a5 5 0 00-3-1.5v2.06c.95.62 2 1.16 3 1.5zm-3-4.02c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight leading-tight">{schoolName}</h2>
              <p className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider">KARTU TANDA PELAJAR DIGITAL</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-300">NPSN: {npsn}</span>
        </div>

        <div className="my-6 flex flex-col items-center text-center space-y-4">
          <div className="bg-white p-3 rounded-2xl shadow-xl ring-4 ring-emerald-500/30">
            <DynamicQr size={140} />
          </div>

          <div>
            <h3 className="text-lg font-black text-white">{user.full_name}</h3>
            <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5">NISN: {student?.nisn || user.identifier}</p>
            <p className="text-xs text-emerald-100 mt-1">
              {student?.class_name || 'Kelas Umum'} {student?.major ? `• ${student.major}` : ''}
            </p>
          </div>
        </div>

        <div className="border-t border-emerald-500/40 pt-3 flex items-center justify-between text-[10px] text-emerald-200 font-mono">
          <span>TA: {academicYear}</span>
          <span className="font-bold text-white uppercase tracking-widest">VALID DIGITAL ID</span>
        </div>

        <div className="absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      <div className="flex justify-center">
        <PrintButton />
      </div>
    </div>
  );
}