import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit, todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Jurnal Pembelajaran Guru (guru/jurnal.php).
 * Body: { action: 'save_journal', class_id, date, time, subject, topic, present_count, absent_count, notes }
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

  if (input.action !== 'save_journal') {
    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  }

  const schoolId = user!.school_id;
  const classId = Number(input.class_id);
  const date = String(input.date || todayStr()) || todayStr();
  const time = String(input.time || '').trim() || '';
  let subject = String(input.subject || '').trim();
  const topic = String(input.topic || '').trim();
  const presentCount = Number(input.present_count ?? 0);
  const absentCount = Number(input.absent_count ?? 0);
  const notes = String(input.notes || '').trim();

  if (!classId) return NextResponse.json({ success: false, message: 'Kelas wajib diisi' });
  if (!topic) return NextResponse.json({ success: false, message: 'Materi pokok wajib diisi' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, message: 'Format tanggal tidak valid (YYYY-MM-DD).' });
  }

  const [classRows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM classes WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [classId, schoolId]
  );
  if (!classRows[0]) {
    return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah Anda.' });
  }

  try {
    const [[teacherRows]] = await pool.query<RowDataPacket[]>(
      `SELECT subject_specialty FROM teachers WHERE user_id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
      [user!.id, schoolId]
    );
    if (!subject) subject = teacherRows?.subject_specialty || 'Informatika';

    const [res] = await pool.execute(
      `INSERT INTO journals (school_id, teacher_user_id, class_id, date, time, subject, topic, present_count, absent_count, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [schoolId, user!.id, classId, date, time, subject, topic, presentCount, absentCount, notes]
    );
    const insertId = (res as any).insertId;
    await logAudit({ action: 'CREATE_JOURNAL', entityType: 'journals', entityId: insertId, details: `Created journal for class ${classId}`, schoolId, actor: user });
    return NextResponse.json({ success: true, message: 'Jurnal pembelajaran berhasil disimpan!' });
  } catch (e) {
    console.error('journals save error:', e);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan jurnal. Silakan coba lagi.' }, { status: 500 });
  }
}