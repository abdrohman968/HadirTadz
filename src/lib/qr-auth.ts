import crypto from 'crypto';

/**
 * QR dinamis (DEVELOPMENT_RULES #13): kartu siswa menampilkan QR yang
 * berputar (rotating) dengan signature & masa berlaku. Kiosk hanya
 * menerima QR yang signaturenya valid dan belum kedaluwarsa.
 *
 * Format QR:
 *   HT|v1|<expUnixMs>|<identifier>|<hmacSha256Hex>
 */
const TICKET_TTL_MS = 120_000; // QR berlaku 2 menit

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum di-set di environment (dibutuhkan untuk QR dinamis).');
  }
  return secret;
}

function hmac(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/** Bangun QR ticket dinamis berisi identifier + masa berlaku + signature. */
export function createQrTicket(identifier: string, ttlMs: number = TICKET_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const body = `v1|${exp}|${identifier}`;
  return `HT|${body}|${hmac(body)}`;
}

export type TicketResult =
  | { valid: true; identifier: string }
  | { valid: false; reason: string };

/** Verifikasi QR ticket dinamis: format, signature, dan masa berlaku. */
export function verifyQrTicket(raw: string): TicketResult {
  const parts = raw.split('|');
  if (parts[0] !== 'HT' || parts.length !== 5) {
    return { valid: false, reason: 'QR tidak dikenali' };
  }
  const [, version, expStr, identifier, sig] = parts;
  if (version !== 'v1') {
    return { valid: false, reason: 'Versi QR tidak didukung' };
  }
  const body = `${version}|${expStr}|${identifier}`;
  const expected = hmac(body);
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'Signature QR tidak valid' };
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { valid: false, reason: 'QR sudah kedaluwarsa' };
  }
  if (!identifier || identifier.length > 64) {
    return { valid: false, reason: 'Identifier pada QR tidak valid' };
  }
  return { valid: true, identifier };
}

/** Deteksi apakah string merupakan QR dinamis (awalan HT|). */
export function isDynamicQr(raw: string): boolean {
  return raw.startsWith('HT|');
}