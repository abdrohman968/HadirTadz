import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { todayStr, logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET: List exkul sessions.
 * Query params: exkul_id, date (optional).
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['guru', 'admin']);
  if (error) return error;

  const schoolId = user!.school_id;
  const url = new URL(req.url);
  const exkulId = url.searchParams.get('exkul_id')?.trim() || '';
  const date = url.searchParams.get('date')?.trim() || '';

  const where = ['es.school_id = ?'];
  const params: any[] = [schoolId];

  if (exkulId) {
    where.push('es.exkul_id = ?');
    params.push(Number(exkulId));
  }
  if (date && DATE_RE.test(date)) {
    where.push('es.session_date = ?');
    params.push(date);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT es.*,
              e.name AS exkul_name,
              e.coach_user_id,
              u.name AS coach_name,
              COALESCE(p.present_count, 0) AS present_count,
              COALESCE(a.absent_count, 0) AS absent_count
       FROM exkul_sessions es
       LEFT JOIN extracurriculars e ON e.id = es.exkul_id AND e.deleted_at IS NULL
       LEFT JOIN users u ON u.id = e.coach_user_id AND u.deleted_at IS NULL
       LEFT JOIN (
         SELECT session_id, COUNT(*) AS present_count
         FROM exkul_attendance
         WHERE status IN ('HADIR', 'TERLAMBAT')
         GROUP BY session_id
       ) p ON p.session_id = es.id
       LEFT JOIN (
         SELECT session_id, COUNT(*) AS absent_count
         FROM exkul_attendance
         WHERE status IN ('ALPHA', 'IZIN', 'SAKIT')
         GROUP BY session_id
       ) a ON a.session_id = es.id
       WHERE ${where.join(' AND ')}
       ORDER BY es.session_date DESC, es.start_time DESC`,
      params
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('exkul-sessions GET error:', e);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data sesi ekskul.' }, { status: 500 });
  }
}

/**
 * POST: Create a new exkul session.
 * Body: { exkul_id, session_date, start_time }.
 * Coach is auto-set from extracurriculars.coach_user_id.
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

  const schoolId = user!.school_id;
  const exkulId = Number(input.exkul_id);
  const sessionDate = String(input.session_date || todayStr()).trim();
  const startTime = String(input.start_time || '').trim();

  if (!exkulId) return NextResponse.json({ success: false, message: 'exkul_id wajib diisi' });
  if (!sessionDate || !DATE_RE.test(sessionDate)) {
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid (YYYY-MM-DD).' });
  }

  const [[exkulRow]] = await pool.query<RowDataPacket[]>(
    `SELECT id, coach_user_id FROM extracurriculars
     WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [exkulId, schoolId]
  );
  if (!exkulRow) {
    return NextResponse.json({ success: false, message: 'Ekstrakurikuler tidak ditemukan.' });
  }

  const coachUserId = exkulRow.coach_user_id;

  try {
    const [res] = await pool.execute(
      `INSERT INTO exkul_sessions (school_id, exkul_id, coach_user_id, session_date, start_time, present_count, absent_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [schoolId, exkulId, coachUserId, sessionDate, startTime]
    );
    const insertId = (res as any).insertId;

    const [[created]] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM exkul_sessions WHERE id = ? LIMIT 1`,
      [insertId]
    );

    await logAudit({
      action: 'CREATE_EXKUL_SESSION',
      entityType: 'exkul_sessions',
      entityId: insertId,
      details: `Created exkul session for exkul ${exkulId} on ${sessionDate}`,
      schoolId,
      actor: user,
    });

    return NextResponse.json({ success: true, message: 'Sesi ekskul berhasil dibuat!', data: created });
  } catch (e) {
    console.error('exkul-sessions POST error:', e);
    return NextResponse.json({ success: false, message: 'Gagal membuat sesi ekskul.' }, { status: 500 });
  }
}
