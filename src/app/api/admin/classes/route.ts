import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * CRUD Data Kelas (classes.php)
 */
export async function POST(req: NextRequest) {
  const { user, error } = requireApiAuth(req, ['admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const action = input.action;
  const schoolId = user!.school_id;

  try {
    if (action === 'save_class') {
      const classId = input.class_id ? Number(input.class_id) : null;
      const classCode = String(input.class_code ?? '').trim();
      const className = String(input.class_name ?? '').trim();
      const grade = String(input.grade ?? 'X');
      const major = String(input.major ?? '').trim();
      const teacherId = input.homeroom_teacher_id ? Number(input.homeroom_teacher_id) : null;
      const academicYear = String(input.academic_year ?? '2025/2026').trim();

      if (!classCode || !className) {
        return NextResponse.json({ success: false, message: 'Kode kelas dan nama kelas wajib diisi' });
      }

      if (classId) {
        const [upd] = await pool.execute<ResultSetHeader>(
          `UPDATE classes SET class_code = ?, class_name = ?, grade = ?, major = ?, homeroom_teacher_id = ?, academic_year = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`,
          [classCode, className, grade, major, teacherId, academicYear, classId, schoolId]
        );
        if (!upd.affectedRows) {
          return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah ini.' });
        }
        await logAudit({ action: 'UPDATE_CLASS', entityType: 'classes', entityId: classId, details: `Updated class ${className}`, schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Data kelas berhasil diperbarui!' });
      }

      const [result] = await pool.execute(
        `INSERT INTO classes (school_id, class_code, class_name, grade, major, homeroom_teacher_id, academic_year, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [schoolId, classCode, className, grade, major, teacherId, academicYear]
      );
      await logAudit({ action: 'CREATE_CLASS', entityType: 'classes', entityId: (result as any).insertId, details: `Created class ${className}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Kelas baru berhasil ditambahkan!' });
    }

    if (action === 'delete_class') {
      const delId = Number(input.class_id);
      if (!delId) return NextResponse.json({ success: false, message: 'ID tidak valid' });
      const [del] = await pool.execute<ResultSetHeader>(`DELETE FROM classes WHERE id = ? AND school_id = ?`, [delId, schoolId]);
      if (!del.affectedRows) return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah ini.' });
      await logAudit({ action: 'DELETE_CLASS', entityType: 'classes', entityId: delId, details: 'Deleted class', schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Data kelas berhasil dihapus.' });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal memproses data kelas. Silakan coba lagi.' }, { status: 500 });
  }
}