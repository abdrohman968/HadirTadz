import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import SelfCheckinForm from '@/components/guru/SelfCheckinForm';
import { getSetting, todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function SiswaAbsenPage() {
  const user = await requireRole(['siswa']);
  const schoolId = user.school_id;
  const today = todayStr();

  const schoolLat = Number(await getSetting('latitude', '-6.9272', schoolId)) || -6.9272;
  const schoolLon = Number(await getSetting('longitude', '107.7225', schoolId)) || 107.7225;
  const radiusLimit = Number(await getSetting('radiusMeters', '150', schoolId)) || 150;

  const [[attRows]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance WHERE user_id = ? AND date = ? AND deleted_at IS NULL LIMIT 1`,
    [user.id, today]
  );
  const todayAtt = attRows || null;

  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      <SelfCheckinForm
        schoolLat={schoolLat}
        schoolLon={schoolLon}
        radiusLimit={radiusLimit}
        todayAtt={todayAtt as unknown as TodayAtt}
        redirectUrl="/siswa/absen"
      />
    </DashboardShell>
  );
}

export interface TodayAtt {
  id: number;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string;
}