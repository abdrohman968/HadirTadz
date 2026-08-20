import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit, getStudentClassId, todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Manajemen Presensi Manual (attendance.php admin).
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
    if (action === 'save_attendance') {
      const attId = input.attendance_id ? Number(input.attendance_id) : null;
      const userId = Number(input.user_id);
      const date = String(input.date ?? todayStr());
      const timeIn = input.time_in || null;
      const timeOut = input.time_out || null;
      const status = String(input.status ?? 'HADIR');
      const notes = String(input.notes ?? '').trim();

      if (!userId) return NextResponse.json({ success: false, message: 'Pilih pengguna terlebih dahulu' });

      const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
      if (!DATE_RE.test(date)) return NextResponse.json({ success: false, message: 'Format tanggal tidak valid' });
      const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d(:\d{2})?$/;
      if (timeIn && !TIME_RE.test(String(timeIn))) return NextResponse.json({ success: false, message: 'Format jam masuk tidak valid' });
      if (timeOut && !TIME_RE.test(String(timeOut))) return NextResponse.json({ success: false, message: 'Format jam pulang tidak valid' });
      const ALLOWED_STATUSES = ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'];
      if (!ALLOWED_STATUSES.includes(status)) return NextResponse.json({ success: false, message: 'Status tidak valid' });

      // class_id diambil dari data siswa
      const [clsRows] = await pool.query<RowDataPacket[]>(`SELECT class_id FROM students WHERE user_id = ? LIMIT 1`, [userId]);
      const classId = clsRows[0]?.class_id ?? null;

      const [userRows] = await pool.query<RowDataPacket[]>(`SELECT identifier FROM users WHERE id = ? AND school_id = ? LIMIT 1`, [userId, schoolId]);
      if (!userRows[0]) return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan' });
      const identifier = userRows[0].identifier;

      if (attId) {
        await pool.execute(
          `UPDATE attendance SET time_in = ?, time_out = ?, status = ?, notes = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`,
          [timeIn, timeOut, status, notes, attId, schoolId]
        );
        await logAudit({ action: 'UPDATE_ATTENDANCE', entityType: 'attendance', entityId: attId, details: `Status changed to ${status}`, schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Data presensi berhasil diperbarui!' });
      }

      await pool.execute(
        `INSERT INTO attendance (school_id, user_id, class_id, date, time_in, time_out, status, method, identifier, is_within_radius, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, 1, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), time_out = VALUES(time_out), status = VALUES(status), notes = VALUES(notes), updated_at = NOW()`,
        [schoolId, userId, classId, date, timeIn, timeOut, status, identifier, notes]
      );
      await logAudit({ action: 'CREATE_ATTENDANCE', entityType: 'attendance', entityId: `user:${userId}`, details: `Manual attendance added for user ${userId}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Presensi berhasil disimpan!' });
    }

    if (action === 'delete_attendance') {
      const delId = Number(input.attendance_id);
      if (!delId) return NextResponse.json({ success: false, message: 'ID tidak valid' });
      await pool.execute(`DELETE FROM attendance WHERE id = ? AND school_id = ?`, [delId, schoolId]);
      await logAudit({ action: 'DELETE_ATTENDANCE', entityType: 'attendance', entityId: delId, details: 'Attendance record deleted', schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Data presensi berhasil dihapus.' });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e) {
    console.error('attendance admin error:', e);
    return NextResponse.json({ success: false, message: 'Gagal memproses data presensi. Silakan coba lagi.' }, { status: 500 });
  }
}