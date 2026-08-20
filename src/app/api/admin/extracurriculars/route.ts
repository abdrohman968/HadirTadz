import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET: List all extracurriculars for the school.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  const schoolId = user!.school_id;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, u.name AS coach_name
       FROM extracurriculars e
       LEFT JOIN users u ON u.id = e.coach_user_id AND u.deleted_at IS NULL
       WHERE e.school_id = ? AND e.deleted_at IS NULL
       ORDER BY e.name ASC`,
      [schoolId]
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('extracurriculars GET error:', e);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data ekstrakurikuler.' }, { status: 500 });
  }
}

/**
 * POST: Create a new extracurricular.
 * Body: { name, description, coach_user_id, day_of_week, start_time, end_time }.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const schoolId = user!.school_id;
  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const coachUserId = Number(input.coach_user_id) || null;
  const dayOfWeek = String(input.day_of_week || '').trim();
  const startTime = String(input.start_time || '').trim();
  const endTime = String(input.end_time || '').trim();

  if (!name) return NextResponse.json({ success: false, message: 'Nama ekstrakurikuler wajib diisi' });

  if (coachUserId) {
    const [[coachRow]] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
      [coachUserId, schoolId]
    );
    if (!coachRow) {
      return NextResponse.json({ success: false, message: 'Coach tidak ditemukan pada sekolah Anda.' });
    }
  }

  try {
    const [res] = await pool.execute(
      `INSERT INTO extracurriculars (school_id, name, description, coach_user_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [schoolId, name, description, coachUserId, dayOfWeek, startTime, endTime]
    );
    const insertId = (res as any).insertId;

    const [[created]] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM extracurriculars WHERE id = ? LIMIT 1`,
      [insertId]
    );

    await logAudit({
      action: 'CREATE_EXTRACURRICULAR',
      entityType: 'extracurriculars',
      entityId: insertId,
      details: `Created extracurricular: ${name}`,
      schoolId,
      actor: user,
    });

    return NextResponse.json({ success: true, message: 'Ekstrakurikuler berhasil dibuat!', data: created });
  } catch (e) {
    console.error('extracurriculars POST error:', e);
    return NextResponse.json({ success: false, message: 'Gagal membuat ekstrakurikuler.' }, { status: 500 });
  }
}

/**
 * PUT: Update an extracurricular.
 * Body: { id, name, description, coach_user_id, day_of_week, start_time, end_time, is_active }.
 */
export async function PUT(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const schoolId = user!.school_id;
  const id = Number(input.id);
  if (!id) return NextResponse.json({ success: false, message: 'ID wajib diisi' });

  const [[existing]] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM extracurriculars WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id, schoolId]
  );
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Ekstrakurikuler tidak ditemukan.' });
  }

  const name = String(input.name ?? '').trim();
  const description = String(input.description ?? '').trim();
  const coachUserId = input.coach_user_id !== undefined ? Number(input.coach_user_id) || null : undefined;
  const dayOfWeek = String(input.day_of_week ?? '').trim();
  const startTime = String(input.start_time ?? '').trim();
  const endTime = String(input.end_time ?? '').trim();
  const isActive = input.is_active !== undefined ? Number(input.is_active) : undefined;

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== '') { updates.push('name = ?'); params.push(name); }
  if (description !== '' || input.description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (coachUserId !== undefined) { updates.push('coach_user_id = ?'); params.push(coachUserId); }
  if (dayOfWeek !== '' || input.day_of_week !== undefined) { updates.push('day_of_week = ?'); params.push(dayOfWeek); }
  if (startTime !== '' || input.start_time !== undefined) { updates.push('start_time = ?'); params.push(startTime); }
  if (endTime !== '' || input.end_time !== undefined) { updates.push('end_time = ?'); params.push(endTime); }
  if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive); }

  if (updates.length === 0) {
    return NextResponse.json({ success: false, message: 'Tidak ada data yang diubah' });
  }

  updates.push('updated_at = NOW()');
  params.push(id);

  try {
    await pool.execute(
      `UPDATE extracurriculars SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    await logAudit({
      action: 'UPDATE_EXTRACURRICULAR',
      entityType: 'extracurriculars',
      entityId: id,
      details: `Updated extracurricular ${id}`,
      schoolId,
      actor: user,
    });

    return NextResponse.json({ success: true, message: 'Ekstrakurikuler berhasil diperbarui!' });
  } catch (e) {
    console.error('extracurriculars PUT error:', e);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui ekstrakurikuler.' }, { status: 500 });
  }
}

/**
 * DELETE: Soft delete an extracurricular.
 * Body: { id }.
 */
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const schoolId = user!.school_id;
  const id = Number(input.id);
  if (!id) return NextResponse.json({ success: false, message: 'ID wajib diisi' });

  const [[existing]] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM extracurriculars WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id, schoolId]
  );
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Ekstrakurikuler tidak ditemukan.' });
  }

  try {
    await pool.execute(
      `UPDATE extracurriculars SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [id]
    );

    await logAudit({
      action: 'DELETE_EXTRACURRICULAR',
      entityType: 'extracurriculars',
      entityId: id,
      details: `Soft deleted extracurricular ${id}`,
      schoolId,
      actor: user,
    });

    return NextResponse.json({ success: true, message: 'Ekstrakurikuler berhasil dihapus.' });
  } catch (e) {
    console.error('extracurriculars DELETE error:', e);
    return NextResponse.json({ success: false, message: 'Gagal menghapus ekstrakurikuler.' }, { status: 500 });
  }
}
