import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, type UserPayload } from '@/lib/auth';

const SESSION_COOKIE = 'hadirtadz_session';

/**
 * Baca user dari cookie sesi (untuk API routes).
 */
export function getApiUser(req: NextRequest): UserPayload | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

/**
 * Wajib login pada API route. Opsional membatasi role.
 * Mengembalikan { user, error } — jika error, langsung return error response.
 */
export function requireApiAuth(
  req: NextRequest,
  allowedRoles?: string[]
): { user: UserPayload | null; error: NextResponse | null } {
  const user = getApiUser(req);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 }),
    };
  }
  if (allowedRoles && !allowedRoles.includes(user.role_code)) {
    return {
      user,
      error: NextResponse.json({ success: false, message: 'Anda tidak memiliki hak akses' }, { status: 403 }),
    };
  }
  return { user, error: null };
}
