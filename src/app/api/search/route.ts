import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Global search: cari siswa & guru satu sekolah berdasarkan kata kunci
 * (nama, NISN/NIP, kelas/mapel). Dipakai oleh Search Bar di header.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin', 'guru']);
  if (error) return error;

  const schoolId = user!.school_id;
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ success: true, students: [], teachers: [] });
  }
  const like = `%${q}%`;

  try {
    const [students] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.full_name, s.nisn AS identifier, c.class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.school_id = ? AND s.deleted_at IS NULL
         AND (s.full_name LIKE ? OR s.nisn LIKE ? OR c.class_name LIKE ?)
       ORDER BY s.full_name
       LIMIT 6`,
      [schoolId, like, like, like]
    );

    const [teachers] = await pool.query<RowDataPacket[]>(
      `SELECT t.id, t.full_name, t.nip AS identifier, t.subject_specialty
       FROM teachers t
       WHERE t.school_id = ? AND t.deleted_at IS NULL
         AND (t.full_name LIKE ? OR t.nip LIKE ? OR t.subject_specialty LIKE ?)
       ORDER BY t.full_name
       LIMIT 6`,
      [schoolId, like, like, like]
    );

    return NextResponse.json({ success: true, students, teachers });
  } catch (e) {
    console.error('search error:', e);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan' }, { status: 500 });
  }
}