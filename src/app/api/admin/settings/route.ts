import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { getSetting, setSetting, logAudit } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Pengaturan Sekolah & Lokasi GPS (settings.php admin).
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const schoolId = user!.school_id;
  const settings: Record<string, string> = {
    schoolName: String(input.schoolName ?? '').trim(),
    npsn: String(input.npsn ?? '').trim(),
    schoolLevel: String(input.schoolLevel ?? 'SMA').trim(),
    address: String(input.address ?? '').trim(),
    operatorName: String(input.operatorName ?? '').trim(),
    operatorPhone: String(input.operatorPhone ?? '').trim(),
    principalName: String(input.principalName ?? '').trim(),
    principalNip: String(input.principalNip ?? '').trim(),
    latitude: String(input.latitude ?? '').trim(),
    longitude: String(input.longitude ?? '').trim(),
    radiusMeters: String(input.radiusMeters ?? '150').trim(),
    waApiKey: String(input.waApiKey ?? '').trim(),
    waGatewayNumber: String(input.waGatewayNumber ?? '').trim(),
  };

  if (!settings.schoolName || !settings.npsn) {
    return NextResponse.json({ success: false, message: 'Nama sekolah dan NPSN wajib diisi' });
  }
  const latNum = Number(settings.latitude);
  const lonNum = Number(settings.longitude);
  const radiusNum = Number(settings.radiusMeters);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return NextResponse.json({ success: false, message: 'Latitude tidak valid (kisaran -90 s/d 90)' });
  }
  if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
    return NextResponse.json({ success: false, message: 'Longitude tidak valid (kisaran -180 s/d 180)' });
  }
  if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 5000) {
    return NextResponse.json({ success: false, message: 'Batas radius tidak valid (1 s/d 5000 meter)' });
  }

  try {
    for (const [key, val] of Object.entries(settings)) {
      // waApiKey bersifat write-only: nilai kosong dari form = pertahankan token lama.
      if (key === 'waApiKey' && !val) continue;
      await setSetting(key, val, schoolId);
    }
    await logAudit({ action: 'UPDATE_SETTINGS', entityType: 'school_settings', entityId: 'all', details: 'Updated school and GPS settings', schoolId, actor: user });
    return NextResponse.json({ success: true, message: 'Pengaturan sistem dan lokasi sekolah berhasil disimpan!' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'Gagal menyimpan pengaturan. Silakan coba lagi.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;
  const schoolId = user!.school_id;
  const keys = ['schoolName', 'npsn', 'schoolLevel', 'address', 'operatorName', 'operatorPhone', 'principalName', 'principalNip', 'latitude', 'longitude', 'radiusMeters', 'waGatewayNumber'];
  const out: Record<string, string> = {};
  for (const k of keys) {
    out[k] = await getSetting(k, '', schoolId);
  }
  // waApiKey tidak pernah dikembalikan ke browser (write-only).
  return NextResponse.json(out);
}