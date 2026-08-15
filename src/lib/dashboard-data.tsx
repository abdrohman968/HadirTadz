import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { nowInWIB } from '@/lib/queries';

export interface AttendanceStats {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
}

export interface RecentAttendanceRow {
  full_name: string;
  identifier: string;
  class_name: string | null;
  role_name: string;
  status: string;
  time_in: string | null;
  time_out: string | null;
  updated_at: string | null;
}

export interface PendingPermissionRow {
  full_name: string;
  identifier: string;
  type: string;
  reason: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface TrendPoint {
  label: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpha: number;
}

type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

function emptyTrend(n: number): TrendPoint[] {
  return Array.from({ length: n }, () => ({ label: '', hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0 }));
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Tren absensi (jumlah hadir/terlambat/izin/sakit/alpha) per rentang waktu.
 * daily   -> N hari terakhir
 * weekly  -> N minggu terakhir (ISO, Senin awal pekan)
 * monthly -> N bulan terakhir
 * yearly  -> N tahun terakhir
 */
export async function getAttendanceTrend(gran: Granularity, n = 7, schoolId?: number): Promise<TrendPoint[]> {
  const schoolFilter = schoolId ? ' AND a.school_id = ?' : '';
  const args: any[] = [];
  const base =
    `FROM attendance a
     JOIN users u ON a.user_id = u.id
     WHERE a.deleted_at IS NULL AND u.deleted_at IS NULL` + schoolFilter;

  if (gran === 'daily') {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(a.date) AS day,
              SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
              SUM(CASE WHEN a.status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
              SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
              SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
              SUM(CASE WHEN a.status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
       ${base}
       GROUP BY DATE(a.date)
       ORDER BY day DESC
       LIMIT ?`,
      [...(schoolId ? [schoolId] : []), n]
    );
    const out = emptyTrend(n);
    const today = nowInWIB();
    for (const r of rows) {
      const d = new Date(r.day instanceof Date ? r.day : String(r.day));
      const idx = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (idx >= 0 && idx < n) {
        out[n - 1 - idx] = {
          label: MONTH_SHORT[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0'),
          hadir: Number(r.hadir) || 0,
          terlambat: Number(r.terlambat) || 0,
          izin: Number(r.izin) || 0,
          sakit: Number(r.sakit) || 0,
          alpha: Number(r.alpha) || 0,
        };
      }
    }
    // Label hari-hari kosong yang tidak terisi
    for (let i = 0; i < n; i++) {
      if (!out[i].label) {
        const d = new Date(today.getTime() - (n - 1 - i) * 86400000);
        out[i].label = MONTH_SHORT[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0');
      }
    }
    return out;
  }

  if (gran === 'weekly') {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT YEARWEEK(a.date, 3) AS wk,
              SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
              SUM(CASE WHEN a.status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
              SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
              SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
              SUM(CASE WHEN a.status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
       ${base}
       GROUP BY wk
       ORDER BY wk DESC
       LIMIT ?`,
      [...(schoolId ? [schoolId] : []), n]
    );
    const out = emptyTrend(n);
    const today = nowInWIB();
    const mondayOffset = (today.getDay() + 6) % 7; // Mon=0
    for (const r of rows) {
      const y = Math.floor(Number(r.wk) / 100);
      const w = Number(r.wk) % 100;
      const wkStart = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
      // mundur ke Senin pada ISO week
      const dow = (wkStart.getUTCDay() + 6) % 7;
      wkStart.setUTCDate(wkStart.getUTCDate() - dow);
      const weeksBack = Math.round((today.getTime() - wkStart.getTime()) / 604800000);
      if (weeksBack >= 0 && weeksBack < n) {
        out[n - 1 - weeksBack] = {
          label: MONTH_SHORT[wkStart.getMonth()] + Math.floor((wkStart.getDate() - 1) / 7 + 1) + 'w',
          hadir: Number(r.hadir) || 0,
          terlambat: Number(r.terlambat) || 0,
          izin: Number(r.izin) || 0,
          sakit: Number(r.sakit) || 0,
          alpha: Number(r.alpha) || 0,
        };
      }
    }
    for (let i = 0; i < n; i++) {
      if (!out[i].label) {
        const wkStart = new Date(today.getTime() - (n - 1 - i) * 604800000);
        const mdow = (wkStart.getDay() + 6) % 7;
        wkStart.setDate(wkStart.getDate() - mdow);
        out[i].label = MONTH_SHORT[wkStart.getMonth()] + 'M' + String(i + 1);
      }
    }
    return out;
  }

  if (gran === 'monthly') {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(a.date, '%Y-%m') AS ym,
              SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
              SUM(CASE WHEN a.status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
              SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
              SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
              SUM(CASE WHEN a.status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
       ${base}
       GROUP BY ym
       ORDER BY ym DESC
       LIMIT ?`,
      [...(schoolId ? [schoolId] : []), n]
    );
    const out = emptyTrend(n);
    const today = nowInWIB();
    for (const r of rows) {
      const ym = String(r.ym);
      const [yy, mm] = ym.split('-').map(Number);
      const monthsBack = (today.getFullYear() - yy) * 12 + (today.getMonth() - (mm - 1));
      if (monthsBack >= 0 && monthsBack < n) {
        const label = MONTH_SHORT[mm - 1] + " '" + String(yy).slice(2);
        out[n - 1 - monthsBack] = {
          label,
          hadir: Number(r.hadir) || 0,
          terlambat: Number(r.terlambat) || 0,
          izin: Number(r.izin) || 0,
          sakit: Number(r.sakit) || 0,
          alpha: Number(r.alpha) || 0,
        };
      }
    }
    for (let i = 0; i < n; i++) {
      if (!out[i].label) {
        const d = new Date(today.getFullYear(), today.getMonth() - (n - 1 - i), 1);
        out[i].label = MONTH_SHORT[d.getMonth()] + " '" + String(d.getFullYear()).slice(2);
      }
    }
    return out;
  }

  // yearly
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT YEAR(a.date) AS yr,
            SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
            SUM(CASE WHEN a.status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
            SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
            SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
            SUM(CASE WHEN a.status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
     ${base}
     GROUP BY yr
     ORDER BY yr DESC
     LIMIT ?`,
    [...(schoolId ? [schoolId] : []), n]
  );
  const out = emptyTrend(n);
  const year = nowInWIB().getFullYear();
  for (const r of rows) {
    const y = Number(r.yr);
    const yearsBack = year - y;
    if (yearsBack >= 0 && yearsBack < n) {
      out[n - 1 - yearsBack] = {
        label: String(y),
        hadir: Number(r.hadir) || 0,
        terlambat: Number(r.terlambat) || 0,
        izin: Number(r.izin) || 0,
        sakit: Number(r.sakit) || 0,
        alpha: Number(r.alpha) || 0,
      };
    }
  }
  for (let i = 0; i < n; i++) {
    if (!out[i].label) out[i].label = String(year - (n - 1 - i));
  }
  return out;
}

/**
 * Aktivitas terbaru dari audit log (login, CRUD, scan) — untuk dashboard.
 */
export async function getRecentActivities(limit = 8, schoolId?: number): Promise<any[]> {
  const schoolFilter = schoolId ? ' AND l.school_id = ?' : '';
  const args: any[] = schoolId ? [schoolId, limit] : [limit];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.action, l.entity_type, l.details, l.created_at,
            COALESCE(l.actor_identifier, 'SYSTEM') AS identifier,
            COALESCE(u.full_name, l.actor_identifier) AS full_name,
            l.ip_address
     FROM audit_logs l
     LEFT JOIN users u ON l.actor_id = u.id
     WHERE l.school_id > 0${schoolFilter}
     ORDER BY l.id DESC
     LIMIT ?`,
    args
  );
  return rows;
}

/**
 * Statistik absensi untuk tanggal tertentu.
 */
export async function getAttendanceStats(date: string, schoolId?: number): Promise<AttendanceStats> {
  const params: any[] = [date];
  let schoolSql = '';
  if (schoolId) {
    schoolSql = ' AND school_id = ?';
    params.push(schoolId);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
       SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
       SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
       SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
       SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha,
       COUNT(*) AS total
     FROM attendance
     WHERE date = ? AND deleted_at IS NULL${schoolSql}`,
    params
  );
  const r = rows[0] || {};
  return {
    hadir: Number(r.hadir) || 0,
    terlambat: Number(r.terlambat) || 0,
    izin: Number(r.izin) || 0,
    sakit: Number(r.sakit) || 0,
    alpha: Number(r.alpha) || 0,
    total: Number(r.total) || 0,
  };
}

/**
 * Log presensi terbaru pada tanggal tertentu.
 */
export async function getRecentAttendance(date: string, limit = 6, schoolId?: number): Promise<RecentAttendanceRow[]> {
  const params: any[] = [date, limit];
  let schoolSql = '';
  if (schoolId) {
    schoolSql = ' AND a.school_id = ?';
    params.splice(1, 0, schoolId);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.full_name, u.identifier, c.class_name, r.role_name,
            a.status, a.time_in, a.time_out, a.updated_at
     FROM attendance a
     JOIN users u ON a.user_id = u.id
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN classes c ON a.class_id = c.id
     WHERE a.date = ? AND a.deleted_at IS NULL${schoolSql}
     ORDER BY a.updated_at DESC
     LIMIT ?`,
    params
  );
  return rows as RecentAttendanceRow[];
}

/**
 * Daftar izin yang masih pending.
 */
export async function getPendingPermissions(limit = 5, schoolId?: number): Promise<PendingPermissionRow[]> {
  const params: any[] = [limit];
  let schoolSql = '';
  if (schoolId) {
    schoolSql = ' AND p.school_id = ?';
    params.splice(0, 0, schoolId);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.full_name, u.identifier, p.type, p.reason, p.start_date, p.end_date
     FROM permissions p
     JOIN users u ON p.user_id = u.id
     WHERE p.status = 'pending' AND p.deleted_at IS NULL${schoolSql}
     ORDER BY p.created_at DESC
     LIMIT ?`,
    params
  );
  return rows as PendingPermissionRow[];
}

/**
 * Riwayat absensi pribadi seorang user (guru / siswa).
 */
export async function getPersonalAttendance(
  userId: number | string,
  limit = 5
): Promise<{ date: string; time_in: string | null; time_out: string | null; status: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT date, time_in, time_out, status
     FROM attendance
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY date DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows as [];
}

/**
 * Ambil data guru berdasarkan user_id.
 */
export async function getTeacherByUserId(userId: number | string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teachers WHERE user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Ambil data siswa beserta kelas oleh user_id.
 */
export async function getStudentByUserId(userId: number | string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.class_name, c.major, t.full_name AS homeroom_name
     FROM students s
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
     WHERE s.user_id = ? AND s.deleted_at IS NULL
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// Re-export formatting helpers (client-safe) untuk menjaga API lama.
export {
  statusBadge,
  formatDateIndo,
  formatTime,
  shortDay,
  formatDateTime,
} from '@/lib/format';