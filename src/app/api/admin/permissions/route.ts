import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit, addDaysToDateStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Verifikasi Izin & Sakit (permissions.php admin): approve/reject + auto-sync attendance.
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
  const permId = Number(input.permission_id);
  const schoolId = user!.school_id;

  if (!permId) return NextResponse.json({ success: false, message: 'ID permohonan tidak valid' });

  try {
    const [permRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM permissions WHERE id = ? AND school_id = ? LIMIT 1`, [permId, schoolId]);
    const perm = permRows[0];
    if (!perm) return NextResponse.json({ success: false, message: 'Permohonan tidak ditemukan' });

    if (action === 'approve') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.execute(
          `UPDATE permissions SET status = 'approved', verified_by_user_id = ?, verified_at = NOW(), updated_at = NOW() WHERE id = ?`,
          [user!.id, permId]
        );

        const attStatus = String(perm.type).toUpperCase() === 'SAKIT' ? 'SAKIT' : 'IZIN';
        const [clsRows] = await conn.query<RowDataPacket[]>(`SELECT class_id FROM students WHERE user_id = ? LIMIT 1`, [perm.user_id]);
        const classId = clsRows[0]?.class_id ?? null;
        const [idRows] = await conn.query<RowDataPacket[]>(`SELECT identifier FROM users WHERE id = ? LIMIT 1`, [perm.user_id]);
        const identifier = idRows[0]?.identifier ?? null;

        // Loop tanggal start_date s/d end_date
        const startDate = perm.start_date as string;
        const endDate = perm.end_date as string;
        let cur = startDate;
        while (cur <= endDate && cur.length === 10) {
          const d = cur;
          await conn.execute(
            `INSERT INTO attendance (school_id, user_id, class_id, date, status, method, identifier, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'manual', ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), updated_at = NOW()`,
            [schoolId, perm.user_id, classId, d, attStatus, identifier, `Izin disetujui: ${perm.reason}`]
          );
          cur = addDaysToDateStr(d, 1);
          if (cur === d) break; // pengaman bila dateStr tidak valid
        }

        await conn.commit();
        await logAudit({ action: 'APPROVE_PERMISSION', entityType: 'permissions', entityId: permId, details: `Permission approved as ${attStatus}`, schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Pengajuan izin berhasil disetujui dan disinkronkan ke rekaman presensi!' });
      } catch (e: any) {
        await conn.rollback();
        return NextResponse.json({ success: false, message: 'Gagal memproses persetujuan. Silakan coba lagi.' });
      } finally {
        conn.release();
      }
    }

    if (action === 'reject') {
      const reason = String(input.rejection_reason ?? 'Pengajuan tidak memenuhi syarat').trim();
      await pool.execute(
        `UPDATE permissions SET status = 'rejected', verified_by_user_id = ?, verified_at = NOW(), rejection_reason = ?, updated_at = NOW() WHERE id = ?`,
        [user!.id, reason, permId]
      );
      await logAudit({ action: 'REJECT_PERMISSION', entityType: 'permissions', entityId: permId, details: `Permission rejected: ${reason}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Pengajuan izin telah ditolak.' });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal memproses izin/sakit. Silakan coba lagi.' }, { status: 500 });
  }
}