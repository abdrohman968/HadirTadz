import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('hadirtadz_session')?.value;
    if (token) {
      const user = verifyJWT(token);
      if (user) {
        try {
          await pool.query(
            `INSERT INTO audit_logs (school_id, actor_id, actor_identifier, actor_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, 'LOGOUT', 'users', ?, 'User logged out', ?, ?, NOW())`,
            [user.school_id, user.id, user.identifier, user.role_code, String(user.id), req.headers.get('x-forwarded-for') || '127.0.0.1', (req.headers.get('user-agent') || '').substring(0, 250)]
          );
        } catch (auditErr) {
          console.warn('Audit log error:', auditErr);
        }
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'hadirtadz_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('[API Logout Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
