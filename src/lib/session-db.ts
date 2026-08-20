import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { UserPayload } from '@/lib/auth';

const VALIDATION_TTL_MS = 30_000;
const cache = new Map<number, { payload: UserPayload | null; at: number }>();

function inMemoryCacheKey(id: number): UserPayload | null | undefined {
  const hit = cache.get(id);
  if (!hit) return undefined;
  if (Date.now() - hit.at > VALIDATION_TTL_MS) {
    cache.delete(id);
    return undefined;
  }
  return hit.payload;
}

/**
 * Revalidasi sesi user terhadap database:
 * - status user masih 'active'? (bukan inactive/suspended)
 * - user tidak di-soft-delete?
 * - sekolah masih aktif?
 * - role_code di DB (bukan claim JWT) — mencegah role lama bertahan setelah demosi.
 *
 * Memakai cache in-memory TTL 30 detik supaya tidak membebani DB pada tiap request
 * (halaman dashboards & API ramai). Setelah user dinonaktifkan/dihapus, akses
 * ditolak dalam ≤30 detik — jauh lebih cepat daripada JWT 7 hari.
 */
export async function revalidateUser(payload: UserPayload): Promise<UserPayload | null> {
  const cached = inMemoryCacheKey(payload.id);
  if (cached !== undefined) return cached;

  let fresh: UserPayload | null = null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.school_id, u.role_id, u.identifier, u.full_name, u.email,
              r.role_code, r.role_name,
              s.name AS school_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN schools s ON u.school_id = s.id
       WHERE u.id = ?
         AND u.status = 'active' AND u.deleted_at IS NULL
         AND s.is_active = 1 AND s.deleted_at IS NULL
       LIMIT 1`,
      [payload.id]
    );
    const row = rows[0] as any;
    if (!row) {
      fresh = null;
    } else {
      fresh = {
        id: row.id,
        school_id: row.school_id,
        role_id: row.role_id,
        role_code: row.role_code,
        role_name: row.role_name,
        identifier: row.identifier,
        full_name: row.full_name,
        email: row.email ?? undefined,
        school_name: row.school_name ?? undefined,
      };
    }
  } catch (e) {
    // DB error — fallback ke claim JWT agar tidak memutus akses sah saat DB hiccup.
    // Status user dinonaktifkan tetap tidak terdeteksi sesaat, tapi DB turun lebih
    // berbahaya daripada menunda revoke. Didesain agar tidak throw ke caller.
    console.error('session-db revalidate error:', e);
    fresh = payload;
  }

  cache.set(payload.id, { payload: fresh, at: Date.now() });
  return fresh;
}