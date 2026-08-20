import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import ExkulManager from '@/components/admin/ExkulManager';
import type { ExkulRow, TeacherRow } from '@/components/admin/ExkulManager';

export const dynamic = 'force-dynamic';

export default async function AdminEkskulPage() {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const [extracurriculars] = await pool.query<RowDataPacket[]>(
    `SELECT ex.*, u.full_name AS coach_name
     FROM extracurriculars ex
     LEFT JOIN users u ON ex.coach_user_id = u.id
     WHERE ex.deleted_at IS NULL AND ex.school_id = ?
     ORDER BY ex.name`,
    [schoolId]
  );

  const [teachers] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.full_name, t.nip
     FROM teachers t
     JOIN users u ON t.user_id = u.id
     WHERE t.school_id = ? AND t.deleted_at IS NULL AND u.deleted_at IS NULL
     ORDER BY t.full_name`,
    [schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <ExkulManager
        extracurriculars={extracurriculars as unknown as ExkulRow[]}
        teachers={teachers as unknown as TeacherRow[]}
      />
    </DashboardShell>
  );
}
