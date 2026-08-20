import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getAuditLogs } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Riwayat Audit Log (admin). GET dengan query:
 * ?action=LOGIN,LOGOUT&search=&from=YYYY-MM-DD&to=&page=&pageSize=
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';
  const search = searchParams.get('search') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize')) || 25, 1), 200);

  try {
    const { rows, total } = await getAuditLogs({
      schoolId: user!.school_id,
      action,
      search,
      from,
      to,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return NextResponse.json({ success: true, data: rows, total, page, pageSize });
  } catch (e) {
    console.error('audit load error:', e);
    return NextResponse.json({ success: false, message: 'Gagal memuat audit log.' }, { status: 500 });
  }
}