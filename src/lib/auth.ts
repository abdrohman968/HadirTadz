import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hadirtadz_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

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
 */
export function signJWT(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT Token
 */
export function verifyJWT(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}
