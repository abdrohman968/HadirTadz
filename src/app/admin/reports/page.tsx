import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import ReportView from '@/components/admin/ReportView';
import type { AttendanceRow, ClassRow } from '@/components/admin/ReportView';
import { getSetting } from '@/lib/queries';
import { todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { start_date?: string; end_date?: string; class_id?: string; role_code?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const now = todayStr();
  const startDate = searchParams.start_date || now.slice(0, 8) + '01';
  const endDate = searchParams.end_date || now;
  const filterClass = searchParams.class_id || '';
  const filterRole = searchParams.role_code || '';

  const schoolName = (await getSetting('schoolName', 'SMA Negeri Harapan Bangsa', schoolId)) || 'SMA Negeri Harapan Bangsa';
  const address = (await getSetting('address', 'Bandung', schoolId)) || 'Bandung';
  const principalName = (await getSetting('principalName', 'Drs. H. Ahmad Fauzi, M.M.', schoolId)) || 'Drs. H. Ahmad Fauzi, M.M.';
  const principalNip = (await getSetting('principalNip', '196805121995121001', schoolId)) || '196805121995121001';

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  let sql = `
    SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date BETWEEN ? AND ? AND a.school_id = ?
  `;
  const params: any[] = [startDate, endDate, schoolId];
  if (filterClass) {
    sql += ' AND a.class_id = ?';
    params.push(filterClass);
  }
  if (filterRole) {
    sql += ' AND r.role_code = ?';
    params.push(filterRole);
  }
  sql += ' ORDER BY a.date DESC, c.class_name, u.full_name';

  const [records] = await pool.query<RowDataPacket[]>(sql, params);

  const totals = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
  for (const r of records as any[]) {
    if (r.status in totals) totals[r.status as keyof typeof totals]++;
  }

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <ReportView
        records={records as unknown as AttendanceRow[]}
        classes={classes as unknown as ClassRow[]}
        operator={user}
        schoolName={schoolName}
        address={address}
        principalName={principalName}
        principalNip={principalNip}
        startDate={startDate}
        endDate={endDate}
        filterClass={filterClass}
        filterRole={filterRole}
        totals={totals}
        printDate={now}
      />
    </DashboardShell>
  );
}