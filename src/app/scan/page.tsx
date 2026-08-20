import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { Metadata } from 'next';
import ScanKiosk from '@/components/scan/ScanKiosk';
import { getSchool, getSetting, todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kiosk Scanner Gerbang',
};

export default async function ScanPage({ searchParams }: { searchParams: { school?: string } }) {
  const schoolId = Number(searchParams.school) || 1;
  const school = await getSchool(schoolId) || (await getSchool(1));
  const schoolName = (await getSetting('schoolName', 'SMA Negeri Harapan Bangsa', schoolId)) || school?.name || 'SMA Negeri Harapan Bangsa';
  const today = todayStr();

  const [recentScans] = await pool.query<RowDataPacket[]>(
    `SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
     FROM attendance a
     JOIN users u ON a.user_id = u.id
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN classes c ON a.class_id = c.id
     WHERE a.date = ? AND a.school_id = ?
     ORDER BY a.updated_at DESC
     LIMIT 8`,
    [today, schoolId]
  );

  return <ScanKiosk schoolName={schoolName} schoolId={schoolId} recentScans={recentScans as unknown as RecentScan[]} />;
}

export interface RecentScan {
  full_name: string;
  class_name: string | null;
  role_name: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
}