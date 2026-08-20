import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * CRUD Aturan Absensi (rules.php admin).
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
    if (action === 'save_rule') {
      const ruleId = input.rule_id ? Number(input.rule_id) : null;
      const ruleName = String(input.rule_name ?? '').trim();
      const roleCode = String(input.role_code ?? 'all');
      const checkInStart = String(input.check_in_start ?? '06:00');
      const workStartTime = String(input.work_start_time ?? '07:00');
      const lateThresholdTime = String(input.late_threshold_time ?? '07:15');
      const earlyLeaveThreshold = String(input.early_leave_threshold ?? '13:30');
      const checkOutStart = String(input.check_out_start ?? '14:00');
      const workEndTime = String(input.work_end_time ?? '15:30');
      const radiusLimit = Number(input.radius_limit ?? 150);

      if (!ruleName) return NextResponse.json({ success: false, message: 'Nama aturan wajib diisi' });

      const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      const times = { checkInStart, workStartTime, lateThresholdTime, earlyLeaveThreshold, checkOutStart, workEndTime };
      for (const [k, v] of Object.entries(times)) {
        if (!TIME_RE.test(v)) {
          return NextResponse.json({ success: false, message: `Format waktu "${k}" tidak valid (contoh: 07:15)` });
        }
      }
      if (isNaN(radiusLimit) || radiusLimit < 1 || radiusLimit > 5000) {
        return NextResponse.json({ success: false, message: 'Batas radius tidak valid (1 s/d 5000 meter)' });
      }
      const validRoles = ['admin', 'guru', 'siswa', 'all'];
      if (!validRoles.includes(roleCode)) {
        return NextResponse.json({ success: false, message: 'Peran tidak valid' });
      }

      const padTime = (t: string) => `${t}:00`;

      if (ruleId) {
        await pool.execute(
          `UPDATE attendance_rules
           SET rule_name = ?, role_code = ?, check_in_start = ?, work_start_time = ?, late_threshold_time = ?, early_leave_threshold = ?, check_out_start = ?, work_end_time = ?, radius_limit = ?, updated_at = NOW()
           WHERE id = ? AND school_id = ?`,
          [ruleName, roleCode, padTime(checkInStart), padTime(workStartTime), padTime(lateThresholdTime), padTime(earlyLeaveThreshold), padTime(checkOutStart), padTime(workEndTime), radiusLimit, ruleId, schoolId]
        );
        await logAudit({ action: 'UPDATE_RULE', entityType: 'attendance_rules', entityId: ruleId, details: `Updated attendance rule ${ruleName}`, schoolId, actor: user });
        return NextResponse.json({ success: true, message: 'Aturan absensi berhasil diperbarui!' });
      }

      const ruleCode = `rule-${Date.now()}`;
      await pool.execute(
        `INSERT INTO attendance_rules (school_id, rule_code, rule_name, role_code, check_in_start, work_start_time, late_threshold_time, early_leave_threshold, check_out_start, work_end_time, radius_limit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [schoolId, ruleCode, ruleName, roleCode, padTime(checkInStart), padTime(workStartTime), padTime(lateThresholdTime), padTime(earlyLeaveThreshold), padTime(checkOutStart), padTime(workEndTime), radiusLimit]
      );
      await logAudit({ action: 'CREATE_RULE', entityType: 'attendance_rules', entityId: ruleCode, details: `Created attendance rule ${ruleName}`, schoolId, actor: user });
      return NextResponse.json({ success: true, message: 'Aturan absensi baru berhasil ditambahkan!' });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal memproses aturan absensi. Silakan coba lagi.' }, { status: 500 });
  }
}