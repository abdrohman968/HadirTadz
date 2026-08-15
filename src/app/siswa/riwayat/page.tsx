import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { monthStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import HistoryView from '@/components/HistoryView';

export const dynamic = 'force-dynamic';

export default async function SiswaRiwayatPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const user = await requireRole(['siswa']);

  const month = searchParams.month || monthStr();

  const [history] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance
     WHERE user_id = ? AND school_id = ? AND date LIKE ? AND deleted_at IS NULL
     ORDER BY date DESC`,
    [user.id, user.school_id, `${month}%`]
  );

  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      <HistoryView history={history as unknown as HistoryRow[]} month={month} />
    </DashboardShell>
  );
}

export interface HistoryRow {
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string | null;
  notes: string | null;
}