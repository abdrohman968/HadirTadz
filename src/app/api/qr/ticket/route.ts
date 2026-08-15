import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { createQrTicket } from '@/lib/qr-auth';

export const dynamic = 'force-dynamic';

/**
 * Terbitkan QR ticket dinamis untuk pengguna login (kartu digital).
 * GET -> { ticket: "HT|v1|<exp>|<identifier>|<sig>" }
 */
export async function GET(req: NextRequest) {
  const { user, error } = requireApiAuth(req);
  if (error) return error;

  try {
    const ticket = createQrTicket(user!.identifier);
    return NextResponse.json({ success: true, ticket, ttlMs: 120_000 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal membuat QR. Silakan coba lagi.' }, { status: 500 });
  }
}