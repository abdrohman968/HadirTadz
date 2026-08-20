import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT, type UserPayload } from '@/lib/auth';
import { revalidateUser } from '@/lib/session-db';

const SESSION_COOKIE = 'hadirtadz_session';

/**
 * Membaca cookie sesi dari request dan mengembalikan payload JWT user.
 * Sesi divalidasi ulang ke database (status aktif, tidak dihapus, role terkini).
 * Mengembalikan null jika tidak ada/tidak valid.
 */
export async function getSession(): Promise<UserPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload) return null;
  return revalidateUser(payload);
}

/**
 * Mengambil user saat ini, redirect ke /login jika belum login.
 */
export async function requireSession(): Promise<UserPayload> {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Mengambil user saat ini dengan verifikasi role.
 * Redirect ke dashboard sesuai role bila role tidak cocok.
 */
export async function requireRole(allowedRoles: string[]): Promise<UserPayload> {
  const user = await requireSession();
  if (!allowedRoles.includes(user.role_code)) {
    redirect(dashboardForRole(user.role_code));
  }
  return user;
}

/**
 * Redirect ke dashboard sesuai role.
 */
export function dashboardForRole(role: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'guru') return '/guru';
  if (role === 'siswa') return '/siswa';
  return '/login';
}
