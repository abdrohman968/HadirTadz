import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import AuditLogManager from '@/components/admin/AuditLogManager';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { action?: string; search?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM audit_logs WHERE school_id = ? ORDER BY id DESC LIMIT 25`,
    [schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <AuditLogManager initialLogs={rows as unknown as any[]} initialTotal={rows.length} schoolId={schoolId} />
    </DashboardShell>
  );
}