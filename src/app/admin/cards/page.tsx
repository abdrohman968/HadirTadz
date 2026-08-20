import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import CardGrid from '@/components/admin/CardGrid';
import { getSetting } from '@/lib/queries';
import type { StudentCard, ClassRow } from '@/components/admin/CardGrid';

export const dynamic = 'force-dynamic';

export default async function AdminCardsPage({
  searchParams,
}: {
  searchParams: { class_id?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const filterClass = searchParams.class_id || '';
  const schoolName = (await getSetting('schoolName', 'SMA Negeri Harapan Bangsa', schoolId)) || 'SMA Negeri Harapan Bangsa';
  const address = (await getSetting('address', 'Bandung', schoolId)) || 'Bandung';
  const npsn = (await getSetting('npsn', '20227912', schoolId)) || '20227912';
  const academicYear = (await getSetting('academicYear', '2025/2026', schoolId)) || '2025/2026';

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  let sql = `
    SELECT s.*, c.class_name, c.major, u.identifier
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.deleted_at IS NULL AND u.school_id = ? AND u.deleted_at IS NULL
  `;
  const params: any[] = [schoolId];
  if (filterClass) {
    sql += ' AND s.class_id = ?';
    params.push(filterClass);
  }
  sql += ' ORDER BY c.class_name, u.full_name';

  const [students] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <CardGrid
        students={students as unknown as StudentCard[]}
        classes={classes as unknown as ClassRow[]}
        filterClass={filterClass}
        schoolName={schoolName}
        address={address}
        npsn={npsn}
        academicYear={academicYear}
      />
    </DashboardShell>
  );
}