import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import StudentCard from '@/components/siswa/StudentCard';
import { getSetting } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function SiswaKartuPage() {
  const user = await requireRole(['siswa']);
  const schoolId = user.school_id;

  const schoolName = (await getSetting('schoolName', 'SMA Terpadu Al-Mu\'min', schoolId)) || 'SMA Terpadu Al-Mu\'min';
  const npsn = (await getSetting('npsn', '20227912', schoolId)) || '20227912';
  const academicYear = (await getSetting('academicYear', '2025/2026', schoolId)) || '2025/2026';

  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      <StudentCard user={user} schoolName={schoolName} npsn={npsn} academicYear={academicYear} />
    </DashboardShell>
  );
}