/**
 * Rate limiter in-memory sederhana (per instance proses Node).
 * Cukup untuk melindungi endpoint publik seperti kiosk /scan dari spam/brute-force.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  opts?: { max?: number; windowMs?: number }
): RateLimitResult {
  const max = opts?.max ?? 40;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();

  // Bersihkan bucket basi secara berkala agar Map tidak membengkak.
  if (buckets.size > 5000) {
    for (const [k, v] of Array.from(buckets.entries())) {
      if (now - v.windowStart >= windowMs) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - existing.windowStart)),
    };
  }
  return { allowed: true, remaining: max - existing.count, retryAfterMs: 0 };
}

/**
 * Reset bucket rate limit (mis. saat login berhasil, agar akun sah tidak
 * terkunci oleh percobaan yang sukses/dibersihkan setelah autentikasi benar).
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Ambil IP client dengan aman.
 * - `x-real-ip` biasanya di-set oleh reverse proxy terpercaya (nginx) — paling dipercaya.
 * - `x-forwarded-for` baris PERTAMA dapat dipalsukan klien; hanya dipakai bila
 *   `TRUST_PROXY=true` (berjalan di belakang proxy terpercaya yang menimpa header).
 * - Fallback terakhir: alamat socket TCP dari koneksi (tidak bisa dipalsukan klien).
 */
export function clientIp(req: Request): string {
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  if (process.env.TRUST_PROXY === 'true') {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim() || 'unknown';
  }
  const socket = (req as any)?.socket?.remoteAddress;
  if (typeof socket === 'string' && socket) return socket;
  return 'unknown';
}