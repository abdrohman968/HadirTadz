import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { todayStr, logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET: List lesson sessions for logged-in teacher.
 * Query params: date, class_id (optional).
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['guru']);
  if (error) return error;

  const schoolId = user!.school_id;
  const url = new URL(req.url);
  const date = url.searchParams.get('date')?.trim() || '';
  const classId = url.searchParams.get('class_id')?.trim() || '';

  const where = ['ls.school_id = ?', 'ls.teacher_user_id = ?'];
  const params: any[] = [schoolId, user!.id];

  if (date && DATE_RE.test(date)) {
    where.push('ls.session_date = ?');
    params.push(date);
  }
  if (classId && Number.isInteger(Number(classId))) {
    where.push('ls.class_id = ?');
    params.push(Number(classId));
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ls.*,
              c.name AS class_name,
              COALESCE(p.present_count, 0) AS present_count,
              COALESCE(a.absent_count, 0) AS absent_count
       FROM lesson_sessions ls
       LEFT JOIN classes c ON c.id = ls.class_id AND c.deleted_at IS NULL
       LEFT JOIN (
         SELECT session_id, COUNT(*) AS present_count
         FROM lesson_attendance
         WHERE status IN ('HADIR', 'TERLAMBAT')
         GROUP BY session_id
       ) p ON p.session_id = ls.id
       LEFT JOIN (
         SELECT session_id, COUNT(*) AS absent_count
         FROM lesson_attendance
         WHERE status IN ('ALPHA', 'IZIN', 'SAKIT')
         GROUP BY session_id
       ) a ON a.session_id = ls.id
       WHERE ${where.join(' AND ')}
       ORDER BY ls.session_date DESC, ls.start_time DESC`,
      params
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('lesson-sessions GET error:', e);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data sesi pembelajaran.' }, { status: 500 });
  }
}

/**
 * POST: Create a new lesson session.
 * Body: { class_id, subject, topic, session_date, start_time }.
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

  const schoolId = user!.school_id;
  const classId = Number(input.class_id);
  const subject = String(input.subject || '').trim();
  const topic = String(input.topic || '').trim();
  const sessionDate = String(input.session_date || todayStr()).trim();
  const startTime = String(input.start_time || '').trim();

  if (!Number.isInteger(classId) || classId <= 0) return NextResponse.json({ success: false, message: 'Kelas wajib diisi' }, { status: 400 });
  if (!subject) return NextResponse.json({ success: false, message: 'Mata pelajaran wajib diisi' }, { status: 400 });
  if (!sessionDate || !DATE_RE.test(sessionDate)) {
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid (YYYY-MM-DD).' }, { status: 400 });
  }

  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  if (startTime && !TIME_RE.test(startTime)) {
    return NextResponse.json({ success: false, message: 'Format jam mulai tidak valid (HH:MM atau HH:MM:SS).' }, { status: 400 });
  }

  try {
    const [classRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM classes WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
      [classId, schoolId]
    );
    if (!classRows[0]) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah Anda.' }, { status: 400 });
    }

    const [res] = await pool.execute(
      `INSERT INTO lesson_sessions (school_id, teacher_user_id, class_id, subject, topic, session_date, start_time, present_count, absent_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [schoolId, user!.id, classId, subject, topic, sessionDate, startTime]
    );
    const insertId = (res as any).insertId;

    const [[created]] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM lesson_sessions WHERE id = ? LIMIT 1`,
      [insertId]
    );

    await logAudit({
      action: 'CREATE_LESSON_SESSION',
      entityType: 'lesson_sessions',
      entityId: insertId,
      details: `Created lesson session for class ${classId} on ${sessionDate}`,
      schoolId,
      actor: user,
    });

    return NextResponse.json({ success: true, message: 'Sesi pembelajaran berhasil dibuat!', data: created });
  } catch (e) {
    console.error('lesson-sessions POST error:', e);
    return NextResponse.json({ success: false, message: 'Gagal membuat sesi pembelajaran.' }, { status: 500 });
  }
}
