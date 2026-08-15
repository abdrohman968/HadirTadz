import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { guruNavGroups } from '@/lib/nav';
import JournalEditor from '@/components/guru/JournalEditor';
import { todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function GuruJurnalPage() {
  const user = await requireRole(['guru']);
  const schoolId = user.school_id;

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  const [[teacherRows]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teachers WHERE user_id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [user.id, schoolId]
  );
  const teacher = teacherRows || null;

  const [myJournals] = await pool.query<RowDataPacket[]>(
    `SELECT j.*, c.class_name
     FROM journals j
     JOIN classes c ON j.class_id = c.id
     WHERE j.teacher_user_id = ? AND j.school_id = ? AND j.deleted_at IS NULL
     ORDER BY j.date DESC, j.created_at DESC`,
    [user.id, schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={guruNavGroups}>
      <JournalEditor
        classes={classes as unknown as ClassRow[]}
        myJournals={myJournals as unknown as JournalRow[]}
        defaultSubject={teacher?.subject_specialty || 'Informatika'}
        today={todayStr()}
      />
    </DashboardShell>
  );
}

export interface ClassRow {
  id: number;
  class_name: string;
}
export interface JournalRow {
  id: number;
  class_id: number;
  date: string;
  time: string | null;
  subject: string;
  topic: string;
  present_count: number;
  absent_count: number;
  notes: string | null;
  created_at: string;
  class_name: string;
}