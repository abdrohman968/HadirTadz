import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import SettingsManager from '@/components/admin/SettingsManager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await requireRole(['admin']);
  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <SettingsManager />
    </DashboardShell>
  );
}