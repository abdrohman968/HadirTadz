import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';
import { generateTempPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

/**
 * CRUD Data Guru (teachers.php)
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
    if (action === 'save_teacher') {
      const teacherId = input.teacher_id ? Number(input.teacher_id) : null;
      const fullName = String(input.full_name ?? '').trim();
      const nip = String(input.nip ?? '').trim();
      const gender = String(input.gender ?? 'L');
      const subject = String(input.subject_specialty ?? '').trim();
      const phone = String(input.phone ?? '').trim();
      const email = String(input.email ?? '').trim();

      if (!fullName || !nip) {
        return NextResponse.json({ success: false, message: 'Nama lengkap dan NIP wajib diisi' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        if (teacherId) {
          const [rows] = await conn.query<RowDataPacket[]>(`SELECT user_id FROM teachers WHERE id = ? AND school_id = ? LIMIT 1`, [teacherId, schoolId]);
          const userId = rows[0]?.user_id;
          if (!userId) throw new Error('Data guru tidak ditemukan pada sekolah ini');

          await conn.execute(
            `UPDATE users SET full_name = ?, identifier = ?, phone = ?, email = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`,
            [fullName, nip, phone, email, userId, schoolId]
          );
          await conn.execute(
            `UPDATE teachers SET full_name = ?, nip = ?, gender = ?, subject_specialty = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`,
            [fullName, nip, gender, subject, teacherId, schoolId]
          );

          await logAudit({ action: 'UPDATE_TEACHER', entityType: 'teachers', entityId: teacherId, details: `Updated teacher ${fullName}`, schoolId, actor: user });
        } else {
          const tempPassword = generateTempPassword();
          const hash = await bcrypt.hash(tempPassword, 10);
          const [userResult] = await conn.execute(
            `INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, email, phone, status, created_at, updated_at)
             VALUES (?, 2, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
            [schoolId, nip, fullName, hash, email, phone]
          );
          const userId = (userResult as any).insertId;

          const [tchResult] = await conn.execute(
            `INSERT INTO teachers (school_id, user_id, full_name, nip, gender, subject_specialty, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [schoolId, userId, fullName, nip, gender, subject]
          );

          await logAudit({ action: 'CREATE_TEACHER', entityType: 'teachers', entityId: (tchResult as any).insertId, details: `Created teacher ${fullName}`, schoolId, actor: user });

          await conn.commit();
          return NextResponse.json({
            success: true,
            message: 'Guru baru berhasil ditambahkan!',
            temp_password: tempPassword,
            identifier: nip,
          });
        }

        await conn.commit();
        return NextResponse.json({ success: true, message: 'Data guru berhasil diperbarui!' });
      } catch (e: any) {
        await conn.rollback();
        return NextResponse.json({ success: false, message: 'Gagal menyimpan data guru. Silakan coba lagi.' });
      } finally {
        conn.release();
      }
    }

    if (action === 'delete_teacher') {
      const delId = Number(input.teacher_id);
      if (!delId) return NextResponse.json({ success: false, message: 'ID tidak valid' });

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.query<RowDataPacket[]>(`SELECT user_id FROM teachers WHERE id = ? AND school_id = ? LIMIT 1`, [delId, schoolId]);
        const userId = rows[0]?.user_id;
        if (!userId) throw new Error('Data guru tidak ditemukan pada sekolah ini');

        await conn.execute(`DELETE FROM teachers WHERE id = ? AND school_id = ?`, [delId, schoolId]);
        if (userId) {
          await conn.execute(`DELETE FROM users WHERE id = ? AND school_id = ?`, [userId, schoolId]);
        }
        await conn.commit();
        await logAudit({ action: 'DELETE_TEACHER', entityType: 'teachers', entityId: delId, details: 'Deleted teacher', schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Data guru berhasil dihapus.' });
      } catch (e: any) {
        await conn.rollback();
        return NextResponse.json({ success: false, message: 'Gagal menghapus data guru. Silakan coba lagi.' });
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal memproses data guru. Silakan coba lagi.' }, { status: 500 });
  }
}
