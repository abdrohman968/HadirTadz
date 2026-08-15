import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import JournalFeed from '@/components/admin/JournalFeed';
import type { Journal, ClassRow } from '@/components/admin/JournalFeed';

export const dynamic = 'force-dynamic';

export default async function AdminJournalsPage({
  searchParams,
}: {
  searchParams: { class_id?: string; date?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const filterClass = searchParams.class_id || '';
  const filterDate = searchParams.date || '';

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  let sql = `
    SELECT j.*, u.full_name AS teacher_name, u.identifier AS teacher_nip, c.class_name
    FROM journals j
    JOIN users u ON j.teacher_user_id = u.id
    JOIN classes c ON j.class_id = c.id
    WHERE j.deleted_at IS NULL AND j.school_id = ?
  `;
  const params: any[] = [schoolId];
  if (filterClass) {
    sql += ' AND j.class_id = ?';
    params.push(filterClass);
  }
  if (filterDate) {
    sql += ' AND j.date = ?';
    params.push(filterDate);
  }
  sql += ' ORDER BY j.date DESC, j.created_at DESC';

  const [journals] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <JournalFeed journals={journals as unknown as Journal[]} classes={classes as unknown as ClassRow[]} filterClass={filterClass} filterDate={filterDate} />
    </DashboardShell>
  );
}