import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = '7d';

/**
 * Ambil secret JWT dari environment. Tidak ada fallback hardcode:
 * sehingga produksi memaksa JWT_SECRET di-set (lihat .env.example).
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum di-set di environment. Salin .env.example menjadi .env.local dan isi nilainya.');
  }
  return secret;
}

export interface UserPayload {
  id: number;
  school_id: number;
  role_id: number;
  role_code: string;
  role_name: string;
  identifier: string;
  full_name: string;
  email?: string;
  school_name?: string;
}

/**
 * Compare plain password with bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Supports standard PHP password_verify / bcrypt hashes ($2y$, $2a$, $2b$)
  const normalizedHash = hash.replace(/^\$2y\$/, '$2a$');
  return bcrypt.compare(password, normalizedHash);
}

/**
 * Sign JWT Token
 * @param expiresIn Durasi token. Default 7d. Untuk "Ingat saya" beri 30d agar
 *  selaras dengan umur cookie — jika tidak, sesi putus di hari ke-8 padahal
 *  cookie remember masih berlaku.
 */
export function signJWT(payload: UserPayload, expiresIn: jwt.SignOptions['expiresIn'] = JWT_EXPIRES_IN): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

/**
 * Verify JWT Token
 */
export function verifyJWT(token: string): UserPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as UserPayload;
  } catch (error) {
    return null;
  }
}
