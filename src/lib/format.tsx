/**
 * Utilitas format untuk tampilan UI (client-safe, tanpa koneksi DB).
 */

/** Waktu Indonesia Barat (UTC+7). */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
export function nowInWIB(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}
/** Tanggal hari ini (YYYY-MM-DD) dalam WIB. */
export function todayStrWIB(): string {
  return nowInWIB().toISOString().slice(0, 10);
}
/** Bulan berjalan (YYYY-MM) dalam WIB. */
export function monthStrWIB(): string {
  return nowInWIB().toISOString().slice(0, 7);
}

export const STATUS_LABELS: Record<string, string> = {
  HADIR: 'Hadir',
  TERLAMBAT: 'Terlambat',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  ALPHA: 'Alpha',
  PULANG_CEPAT: 'Pulang Cepat',
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

export const STATUS_STYLES: Record<string, string> = {
  HADIR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  TERLAMBAT: 'bg-amber-100 text-amber-800 border-amber-300',
  IZIN: 'bg-blue-100 text-blue-800 border-blue-300',
  SAKIT: 'bg-purple-100 text-purple-800 border-purple-300',
  ALPHA: 'bg-rose-100 text-rose-800 border-rose-300',
  PULANG_CEPAT: 'bg-orange-100 text-orange-800 border-orange-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
};

export const STATUS_DOT: Record<string, string> = {
  HADIR: 'bg-emerald-600',
  TERLAMBAT: 'bg-amber-600',
  IZIN: 'bg-blue-600',
  SAKIT: 'bg-purple-600',
  ALPHA: 'bg-rose-600',
  PULANG_CEPAT: 'bg-orange-600',
  PENDING: 'bg-yellow-600',
  APPROVED: 'bg-emerald-600',
  REJECTED: 'bg-rose-600',
};

export function statusBadge(status: string) {
  const s = (status || '').toUpperCase().trim();
  const label = STATUS_LABELS[s] || s || 'Belum Ada';
  const style = STATUS_STYLES[s] || 'bg-gray-100 text-gray-700 border-gray-300';
  const dot = STATUS_DOT[s] || 'bg-gray-600';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
    </span>
  );
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Format tanggal ke format Indonesia: "Senin, 14 Agustus 2026".
 */
export function formatDateIndo(dateStr: string | Date, withDay = true): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  const parts = [
    ...(withDay ? [`${DAYS[d.getDay()]},`] : []),
    `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  ];
  return parts.join(' ');
}

/**
 * Format jam ke HH:mm.
 */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-';
  const t = new Date(`1970-01-01T${timeStr}`);
  if (isNaN(t.getTime())) return timeStr;
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

/**
 * Format tanggal ke versi pendek grafik: "14 Aug".
 */
export function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Format datetime ke "14/08/2026 09:30".
 */
export function formatDateTime(v: string | null | undefined): string {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Netralkan href berbahaya (javascript:, data:, dll). Hanya izinkan http/https
 * (bisa relatif `/...` yang di-resolve ke origin aplikasi sendiri).
 */
export function safeUrl(v: string | null | undefined): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  return '';
}

/**
 * Parse datetime MySQL `YYYY-MM-DD HH:MM:SS` (server UTC) & tampilkan sebagai
 * waktu lokal browser (WIB). Konsisten untuk semua tampilan.
 */
export function formatUtcToLocal(v: string | null | undefined): string {
  if (!v) return '-';
  const d = new Date(v.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return String(v);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Jam WIB (HH:MM:SS) untuk jam dinding di header. */
export function nowClockWIB(): string {
  const d = nowInWIB();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}