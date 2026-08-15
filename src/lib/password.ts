import { randomBytes } from 'crypto';

/**
 * Hasilkan kata sandi sementara acak per pengguna (bukan default statis).
 * Format: 3 huruf + 3 angka (mis. "Xkq-482"), cukup kuat & mudah diucapkan admin.
 */
export function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  let s = '';
  for (let i = 0; i < 3; i++) s += chars[randomBytes(1)[0] % chars.length];
  for (let i = 0; i < 3; i++) s += nums[randomBytes(1)[0] % nums.length];
  return s.slice(0, 3) + '-' + s.slice(3);
}