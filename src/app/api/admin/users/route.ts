import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';
import { generateTempPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

/**
 * Manajemen Akun Pengguna (users.php): reset password & toggle status.
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
  const userId = Number(input.user_id);
  const schoolId = user!.school_id;

  if (!userId) return NextResponse.json({ success: false, message: 'ID pengguna tidak valid' });

  try {
    if (action === 'reset_password') {
      const newPass = String(input.new_password ?? generateTempPassword());
      const hash = await bcrypt.hash(newPass, 10);
      await pool.execute(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`, [hash, userId, schoolId]);
      await logAudit({ action: 'RESET_PASSWORD', entityType: 'users', entityId: userId, details: 'Password reset by admin', schoolId, actor: user });
      return NextResponse.json({ success: true, message: `Password pengguna berhasil direset menjadi: ${newPass}`, temp_password: newPass });
    }

    if (action === 'toggle_status') {
      const newStatus = String(input.status ?? 'active');
      if (newStatus !== 'active' && newStatus !== 'inactive') {
        return NextResponse.json({ success: false, message: 'Status tidak valid' });
      }
      await pool.execute(`UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND school_id = ?`, [newStatus, userId, schoolId]);
      await logAudit({ action: 'UPDATE_USER_STATUS', entityType: 'users', entityId: userId, details: `Status changed to ${newStatus}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: `Status akun berhasil diubah menjadi: ${newStatus}` });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e) {
    console.error('users admin error:', e);
    return NextResponse.json({ success: false, message: 'Gagal memproses akun pengguna. Silakan coba lagi.' }, { status: 500 });
  }
}