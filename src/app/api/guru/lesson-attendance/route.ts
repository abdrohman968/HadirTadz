import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit, currentTimeStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA']);

/**
 * GET: List attendance for a lesson session.
 * Query param: session_id.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['guru']);
  if (error) return error;

  const url = new URL(req.url);
  const sessionId = Number(url.searchParams.get('session_id'));

  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'session_id wajib diisi' });
  }

  const schoolId = user!.school_id;

  try {
    const [[session]] = await pool.query<RowDataPacket[]>(
      `SELECT ls.* FROM lesson_sessions ls
       WHERE ls.id = ? AND ls.school_id = ? AND ls.teacher_user_id = ? AND ls.deleted_at IS NULL LIMIT 1`,
      [sessionId, schoolId, user!.id]
    );
    if (!session) {
      return NextResponse.json({ success: false, message: 'Sesi pembelajaran tidak ditemukan.' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.user_id AS student_user_id,
              u.full_name AS student_name,
              u.identifier AS student_identifier,
              COALESCE(la.status, '') AS status,
              COALESCE(la.method, '') AS method,
              COALESCE(la.time_recorded, '') AS time_recorded,
              la.id AS attendance_id
       FROM students s
       JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
       LEFT JOIN lesson_attendance la ON la.student_user_id = s.user_id AND la.session_id = ?
       WHERE s.class_id = ? AND s.school_id = ? AND s.deleted_at IS NULL
       ORDER BY u.full_name ASC`,
      [sessionId, session.class_id, schoolId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('lesson-attendance GET error:', e);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data presensi.' }, { status: 500 });
  }
}

/**
 * POST: Record attendance for a lesson session.
 * Body: { session_id, statuses: { [student_user_id]: status } }
 * Or single: { session_id, student_user_id, status, method }.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['guru']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const sessionId = Number(input.session_id);
  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'session_id wajib diisi' });
  }

  const schoolId = user!.school_id;

  const [[session]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM lesson_sessions
     WHERE id = ? AND school_id = ? AND teacher_user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [sessionId, schoolId, user!.id]
  );
  if (!session) {
    return NextResponse.json({ success: false, message: 'Sesi pembelajaran tidak ditemukan.' });
  }

  let statuses: Record<string, string> = {};

  if (input.statuses && typeof input.statuses === 'object') {
    statuses = input.statuses;
  } else if (input.student_user_id && input.status) {
    statuses = { [String(input.student_user_id)]: String(input.status) };
  } else {
    return NextResponse.json({ success: false, message: 'statuses atau student_user_id + status wajib diisi' });
  }

  for (const [sid, st] of Object.entries(statuses)) {
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
        const method = input.method || 'manual';

        const [[studentRow]] = await conn.query<RowDataPacket[]>(
          `SELECT s.user_id, u.identifier
           FROM students s
           JOIN users u ON u.id = s.user_id
           WHERE s.user_id = ? AND s.class_id = ? AND s.school_id = ? AND s.deleted_at IS NULL
           LIMIT 1`,
          [studentUserId, session.class_id, schoolId]
        );
        if (!studentRow) continue;

        const identifier = studentRow.identifier ?? '';

        await conn.query(
          `INSERT INTO lesson_attendance (school_id, session_id, student_user_id, status, method, notes, time_recorded, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE status = VALUES(status), method = VALUES(method), notes = VALUES(notes), time_recorded = VALUES(time_recorded), updated_at = NOW()`,
          [schoolId, sessionId, studentUserId, status, method, identifier, currentTimeStr()]
        );
      }

      const [[counts]] = await conn.query<RowDataPacket[]>(
        `SELECT
           SUM(status IN ('HADIR', 'TERLAMBAT')) AS present_count,
           SUM(status IN ('ALPHA', 'IZIN', 'SAKIT')) AS absent_count
         FROM lesson_attendance WHERE session_id = ?`,
        [sessionId]
      );

      await conn.query(
        `UPDATE lesson_sessions
         SET present_count = ?, absent_count = ?, updated_at = NOW()
         WHERE id = ?`,
        [Number(counts?.present_count ?? 0), Number(counts?.absent_count ?? 0), sessionId]
      );

      await conn.commit();

      await logAudit({
        action: 'LESSON_ATTENDANCE',
        entityType: 'lesson_sessions',
        entityId: sessionId,
        details: `Recorded lesson attendance for session ${sessionId}`,
        schoolId,
        actor: user,
      });

      return NextResponse.json({ success: true, message: 'Presensi pembelajaran berhasil disimpan!' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('lesson-attendance POST error:', e);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan presensi pembelajaran.' }, { status: 500 });
  }
}
