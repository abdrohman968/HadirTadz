import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import PermissionSubmit from '@/components/siswa/PermissionSubmit';

export const dynamic = 'force-dynamic';

export default async function SiswaIzinPage() {
  const user = await requireRole(['siswa']);
  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      <PermissionSubmit userId={user.id} />
    </DashboardShell>
  );
}