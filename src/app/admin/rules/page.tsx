import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import RuleManager from '@/components/admin/RuleManager';
import type { Rule } from '@/components/admin/RuleManager';

export const dynamic = 'force-dynamic';

export default async function AdminRulesPage() {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const [rules] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance_rules WHERE school_id = ? ORDER BY id`,
    [schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <RuleManager initialRules={rules as unknown as Rule[]} />
    </DashboardShell>
  );
}