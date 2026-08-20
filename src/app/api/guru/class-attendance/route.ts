import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** Status presensi yang diizinkan. */
const ALLOWED_STATUSES = new Set(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA']);
/** Format tanggal yang diterima: YYYY-MM-DD. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Simpan Presensi Kelas Otomatis (guru/kelas.php).
 * Body: { class_id, date, statuses: { [studentUserId]: 'HADIR'|'TERLAMBAT'|... } }
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['guru', 'admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const classId = Number(input.class_id);
  const date = String(input.date ?? '').trim();
  const statuses = input.statuses || {};

  if (!classId || !date || Object.keys(statuses).length === 0) {
    return NextResponse.json({ success: false, message: 'Kelas, tanggal, dan status wajib diisi' });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid (YYYY-MM-DD).' });
  }

  const schoolId = user!.school_id;

  const [classRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM classes WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [classId, schoolId]
  );
  if (!classRows[0]) {
    return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah Anda.' });
  }

  for (const st of Object.values(statuses)) {
    const s = String(st || 'HADIR').toUpperCase();
    if (!ALLOWED_STATUSES.has(s)) {
      return NextResponse.json({ success: false, message: `Status presensi "${s}" tidak dikenali.` });
    }
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const [studentUserId, st] of Object.entries(statuses)) {
        const status = String(st || 'HADIR').toUpperCase();
        const [[identifierRows]] = await conn.query<RowDataPacket[]>(
          `SELECT identifier FROM users WHERE id = ? AND school_id = ? LIMIT 1`,
          [studentUserId, schoolId]
        );
        const identifier = identifierRows?.identifier ?? '';

        await conn.query(
          `INSERT INTO attendance (school_id, user_id, class_id, date, time_in, status, method, identifier, is_within_radius, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, '07:00:00', ?, 'manual', ?, 1, 'Presensi oleh Guru di Kelas', NOW(), NOW())
           ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
          [schoolId, studentUserId, classId, date, status, identifier]
        );
      }

      await conn.commit();
      await logAudit({ action: 'CLASS_ATTENDANCE', entityType: 'classes', entityId: classId, details: `Recorded class attendance for ${date}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Presensi seluruh siswa kelas berhasil disimpan!' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('class-attendance save error:', e);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan presensi kelas. Silakan coba lagi.' }, { status: 500 });
  }
}