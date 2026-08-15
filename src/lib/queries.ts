import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

/**
 * Waktu Indonesia Barat (UTC+7) yang konsisten di mana pun server berjalan.
 * Kunci: geser waktu lokal ke +7 lalu baca komponen UTC.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function nowInWIB(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

export function todayStr(): string {
  return nowInWIB().toISOString().slice(0, 10);
}

/** Bulan berjalan (YYYY-MM) dalam waktu WIB. */
export function monthStr(): string {
  return nowInWIB().toISOString().slice(0, 7);
}

/**
 * Tanggal (YYYY-MM-DD) dalam WIB dengan offset hari dari hari ini.
 * Contoh: dateStrWIB(-6) = 6 hari lalu.
 */
export function dateStrWIB(offsetDays: number): string {
  const d = new Date(nowInWIB().getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Aritmetika tanggal bebas-timezone: tambah/kurang hari pada string YYYY-MM-DD.
 * Aman dipakai untuk loop tanggal (mulai/akhir) tanpa bergeser karena zona waktu server.
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return dateStr;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function currentTimeStr(): string {
  const d = nowInWIB();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function currentTimeHHMM(): string {
  return currentTimeStr().slice(0, 5);
}

/**
 * Haversine distance dalam meter.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

/**
 * Ambil data sekolah.
 */
export async function getSchool(schoolId: number | string = 1) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM schools WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [schoolId]
  );
  return rows[0] || null;
}

/**
 * Ambil nilai pengaturan sekolah (fallback ke data tabel schools bila relevan).
 */
export async function getSetting(
  key: string,
  defaultValue: string = '',
  schoolId: number | string = 1
): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT setting_value FROM school_settings WHERE school_id = ? AND setting_key = ? LIMIT 1`,
    [schoolId, key]
  );
  if (rows[0]?.setting_value !== undefined && rows[0]?.setting_value !== null && rows[0]?.setting_value !== '') {
    return String(rows[0].setting_value);
  }
  const sch = await getSchool(schoolId);
  if (sch) {
    const map: Record<string, string> = {
      schoolName: 'name',
      address: 'address',
      npsn: 'npsn',
      schoolLevel: 'level',
      latitude: 'latitude',
      longitude: 'longitude',
      radiusMeters: 'radius_meters',
    };
    const col = map[key];
    if (col && sch[col] !== undefined && sch[col] !== null && String(sch[col]) !== '') {
      return String(sch[col]);
    }
  }
  return defaultValue;
}

/**
 * Simpan / perbarui pengaturan sekolah.
 */
export async function setSetting(key: string, value: string, schoolId: number | string = 1): Promise<void> {
  await pool.execute(
    `INSERT INTO school_settings (school_id, setting_key, setting_value, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
    [schoolId, key, value]
  );
}

/**
 * Ambil aturan absensi yang berlaku untuk role tertentu.
 */
export async function getRuleForRole(schoolId: number | string, roleCode: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance_rules
     WHERE school_id = ? AND (role_code = ? OR role_code = 'all')
     ORDER BY (role_code = ?) DESC LIMIT 1`,
    [schoolId, roleCode, roleCode]
  );
  return rows[0] || null;
}

/**
 * Tulis catatan audit log.
 */
export async function logAudit(opts: {
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: string;
  schoolId?: number | string;
  actor?: { id: number; identifier: string; role_code: string } | null;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO audit_logs
        (school_id, actor_id, actor_identifier, actor_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        opts.schoolId ?? 1,
        opts.actor?.id ?? null,
        opts.actor?.identifier ?? 'SYSTEM',
        opts.actor?.role_code ?? 'system',
        opts.action,
        opts.entityType,
        opts.entityId !== undefined ? String(opts.entityId) : '',
        opts.details ?? '',
        opts.ip ?? '',
        (opts.userAgent ?? '').slice(0, 250),
      ]
    );
  } catch (e) {
    // audit log tidak boleh mengganggu proses utama
  }
}

/**
 * Ambil riwayat audit log sekolah (filter: aksi, pencarian, rentang tanggal).
 */
export async function getAuditLogs(opts: {
  schoolId: number | string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: RowDataPacket[]; total: number }> {
  const where: string[] = ['school_id = ?'];
  const params: any[] = [opts.schoolId];

  if (opts.action) {
    where.push('action IN (?)');
    const actions = String(opts.action).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    params.push(actions.length ? actions : ['-']);
  }
  if (opts.from) {
    where.push('DATE(created_at) >= ?');
    params.push(opts.from);
  }
  if (opts.to) {
    where.push('DATE(created_at) <= ?');
    params.push(opts.to);
  }
  if (opts.search) {
    const s = `%${String(opts.search).trim()}%`;
    where.push('(actor_identifier LIKE ? OR actor_role LIKE ? OR action LIKE ? OR details LIKE ? OR entity_type LIKE ?)');
    params.push(s, s, s, s, s);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const offset = Math.max(Number(opts.offset) || 0, 0);

  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM audit_logs ${whereSql}`,
    params
  );
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM audit_logs ${whereSql} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return { rows, total: Number(total) };
}

/**
 * Ambil class_id milik seorang siswa berdasarkan user_id.
 */
export async function getStudentClassId(userId: number | string): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT class_id FROM students WHERE user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [userId]
  );
  return rows[0]?.class_id ?? null;
}

/**
 * Ambil identifier pengguna.
 */
export async function getUserIdentifier(userId: number | string): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT identifier FROM users WHERE id = ? LIMIT 1`, [userId]);
  return rows[0]?.identifier ?? null;
}

export interface RuleRow {
  id: number;
  school_id: number;
  rule_code: string;
  rule_name: string;
  role_code: string;
  check_in_start: string;
  work_start_time: string;
  late_threshold_time: string;
  check_out_start: string;
  work_end_time: string;
  early_leave_threshold: string;
  allow_late: number;
  radius_limit: number;
  days_of_week: string;
}
