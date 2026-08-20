import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, type UserPayload } from '@/lib/auth';
import { revalidateUser } from '@/lib/session-db';

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
 * Sesi divalidasi ulang ke database (status aktif, tidak dihapus, role terkini)
 * sehingga akun yang dinonaktifkan/dihapus langsung kehilangan akses.
 * Mengembalikan { user, error } — jika error, langsung return error response.
 */
export async function requireApiAuth(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: UserPayload | null; error: NextResponse | null }> {
  const user = getApiUser(req);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 }),
    };
  }
  const fresh = await revalidateUser(user);
  if (!fresh) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Sesi berakhir atau akun tidak aktif. Silakan login kembali.' }, { status: 401 }),
    };
  }
  if (allowedRoles && !allowedRoles.includes(fresh.role_code)) {
    return {
      user: fresh,
      error: NextResponse.json({ success: false, message: 'Anda tidak memiliki hak akses' }, { status: 403 }),
    };
  }
  return { user: fresh, error: null };
}
