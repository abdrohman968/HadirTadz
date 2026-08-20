import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';
import { generateTempPassword } from '@/lib/password';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

/** Deteksi error duplikat (mis. NISN/NIP yang sudah dipakai user lain). */
function isDuplicateError(e: any): boolean {
  return e?.code === 'ER_DUP_ENTRY' || (e?.errno === 1062);
}

/**
 * CRUD Data Siswa (students.php)
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

  const action = input.action;
  const schoolId = user!.school_id;

  try {
    if (action === 'save_student') {
      const studentId = input.student_id && Number.isInteger(Number(input.student_id)) ? Number(input.student_id) : null;
      const fullName = String(input.full_name ?? '').trim();
      const nisn = String(input.nisn ?? '').trim();
      const classId = input.class_id && Number.isInteger(Number(input.class_id)) ? Number(input.class_id) : null;
      const gender = String(input.gender ?? 'L');
      const parentName = String(input.parent_name ?? '').trim();
      const parentPhone = String(input.parent_phone ?? '').trim();

      if (!fullName || !nisn) {
        return NextResponse.json({ success: false, message: 'Nama lengkap dan NISN wajib diisi' }, { status: 400 });
      }

      if (classId) {
        const [cls] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM classes WHERE id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
          [classId, schoolId]
        );
        if (!cls[0]) {
          return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan pada sekolah ini.' }, { status: 400 });
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        if (studentId) {
          const [rows] = await conn.query<RowDataPacket[]>(`SELECT user_id FROM students WHERE id = ? AND school_id = ? LIMIT 1`, [studentId, schoolId]);
          const userId = rows[0]?.user_id;
          if (!userId) throw new Error('Data siswa tidak ditemukan pada sekolah ini');

          await conn.execute(`UPDATE users SET full_name = ?, identifier = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`, [fullName, nisn, userId, schoolId]);
          await conn.execute(
            `UPDATE students SET full_name = ?, nisn = ?, class_id = ?, gender = ?, parent_name = ?, parent_phone = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`,
            [fullName, nisn, classId, gender, parentName, parentPhone, studentId, schoolId]
          );

          await logAudit({ action: 'UPDATE_STUDENT', entityType: 'students', entityId: studentId, details: `Updated student ${fullName}`, schoolId, actor: user });
        } else {
          const tempPassword = generateTempPassword();
          const hash = await bcrypt.hash(tempPassword, 10);
          const [userResult] = await conn.execute(
            `INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, status, created_at, updated_at)
             VALUES (?, 3, ?, ?, ?, 'active', NOW(), NOW())`,
            [schoolId, nisn, fullName, hash]
          );
          const userId = (userResult as any).insertId;

          const [stdResult] = await conn.execute(
            `INSERT INTO students (school_id, user_id, class_id, full_name, nisn, gender, parent_name, parent_phone, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [schoolId, userId, classId, fullName, nisn, gender, parentName, parentPhone]
          );

          await logAudit({ action: 'CREATE_STUDENT', entityType: 'students', entityId: (stdResult as any).insertId, details: `Created student ${fullName}`, schoolId, actor: user });

          await conn.commit();
          return NextResponse.json({
            success: true,
            message: 'Siswa baru berhasil ditambahkan!',
            temp_password: tempPassword,
            identifier: nisn,
          });
        }

        await conn.commit();
        return NextResponse.json({ success: true, message: 'Data siswa berhasil diperbarui!' });
      } catch (e: any) {
        await conn.rollback();
        if (isDuplicateError(e)) {
          return NextResponse.json({ success: false, message: `NISN "${nisn}" sudah digunakan oleh siswa lain.` }, { status: 409 });
        }
        console.error('admin/students save error:', e);
        return NextResponse.json({ success: false, message: 'Gagal menyimpan data siswa. Silakan coba lagi.' }, { status: 500 });
      } finally {
        conn.release();
      }
    }

    if (action === 'delete_student') {
      const delId = Number(input.student_id);
      if (!delId || !Number.isInteger(delId)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.query<RowDataPacket[]>(`SELECT user_id FROM students WHERE id = ? AND school_id = ? LIMIT 1`, [delId, schoolId]);
        const userId = rows[0]?.user_id;
        if (!userId) throw new Error('Data siswa tidak ditemukan pada sekolah ini');

        await conn.execute(`DELETE FROM students WHERE id = ? AND school_id = ?`, [delId, schoolId]);
        if (userId) {
          await conn.execute(`DELETE FROM users WHERE id = ? AND school_id = ?`, [userId, schoolId]);
        }
        await conn.commit();
        await logAudit({ action: 'DELETE_STUDENT', entityType: 'students', entityId: delId, details: 'Deleted student', schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Data siswa berhasil dihapus.' });
      } catch (e: any) {
        await conn.rollback();
        console.error('admin/students delete error:', e);
        return NextResponse.json({ success: false, message: 'Gagal menghapus data siswa. Silakan coba lagi.' }, { status: 500 });
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (e: any) {
    handleApiError(e, 'Gagal memproses data siswa. Silakan coba lagi.');
    return NextResponse.json(
      { success: false, message: 'Gagal memproses data siswa. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
