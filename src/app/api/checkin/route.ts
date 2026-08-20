import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { parseDataUrl, ALLOWED_IMAGE_TYPES, type ParsedUpload } from '@/lib/uploads';
import {
  getSetting,
  getRuleForRole,
  getStudentClassId,
  calculateDistance,
  todayStr,
  currentTimeStr,
} from '@/lib/queries';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

/**
 * Absen mandiri GPS + selfie (checkin_self.php).
 * Method: POST, body JSON { latitude, longitude, photo_base64, action }
 */
export async function POST(req: NextRequest) {
  // Rate limit per IP & per akun: absen mandiri hanya boleh untuk masuk + pulang,
  // sehingga batasan ketat mencegah spam panggilan API.
  const ipKey = clientIp(req);
  const ipLimit = rateLimit(`checkin-ip:${ipKey}`, { max: 20, windowMs: 60_000 });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' },
      { status: 429 }
    );
  }

  const { user, error } = await requireApiAuth(req);
  if (error) return error;

  const userLimit = rateLimit(`checkin-user:${user!.id}`, { max: 5, windowMs: 60_000 });
  if (!userLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Terlalu sering mencoba absen. Silakan tunggu beberapa saat.' },
      { status: 429 }
    );
  }

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const latitude = input.latitude !== undefined ? Number(input.latitude) : null;
  const longitude = input.longitude !== undefined ? Number(input.longitude) : null;
  const photoData = String(input.photo_base64 ?? '');
  const actionType = String(input.action ?? 'CHECK_IN').toUpperCase() === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN';

  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ success: false, message: 'Koordinat lokasi GPS tidak terdeteksi' });
  }

  const schoolId = user!.school_id;

  try {
    const schoolLat = Number(await getSetting('latitude', '-6.9272', schoolId));
    const schoolLon = Number(await getSetting('longitude', '107.7225', schoolId));
    let radiusLimit = Number(await getSetting('radiusMeters', '150', schoolId)) || 150;

    const rule = await getRuleForRole(schoolId, user!.role_code);
    if (rule?.radius_limit) {
      radiusLimit = Number(rule.radius_limit);
    }

    const distance = calculateDistance(latitude, longitude, schoolLat, schoolLon);
    const isWithinRadius = distance <= radiusLimit;

    if (!isWithinRadius) {
      return NextResponse.json({
        success: false,
        message: `Anda berada di luar radius sekolah! Jarak Anda: ${distance} meter (Maksimal: ${radiusLimit} meter).`,
        distance,
        allowed_radius: radiusLimit,
      });
    }

    // Simpan foto selfie bila ada (hanya dipanggil saat presensi akan disimpan,
    // agar tidak meninggalkan file yatim saat duplikat/gagal validasi).
    const saveSelfiePhoto = async (): Promise<string | null> => {
      if (!photoData) return null;
      let parsed: ParsedUpload | null;
      try {
        parsed = parseDataUrl(photoData, ALLOWED_IMAGE_TYPES);
      } catch (e: any) {
        e.name = 'UploadValidationError';
        throw e;
      }
      if (!parsed) return null;
      try {
        const dir = path.join(process.cwd(), 'public', 'assets', 'uploads', 'selfie');
        await fs.mkdir(dir, { recursive: true });
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const rand = crypto.randomBytes(8).toString('hex');
        const filename = `selfie_${user!.id}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${rand}${parsed.ext}`;
        await fs.writeFile(path.join(dir, filename), parsed.buffer);
        return `/assets/uploads/selfie/${filename}`;
      } catch (e) {
        return null;
      }
    };

    const today = todayStr();
    const currentTime = currentTimeStr();
    const lateThreshold = rule?.late_threshold_time ?? '07:15:00';

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM attendance WHERE user_id = ? AND date = ? LIMIT 1`,
      [user!.id, today]
    );
    const existing = existingRows[0];

    let classId: number | null = null;
    if (user!.role_code === 'siswa') {
      classId = await getStudentClassId(user!.id);
    }

    if (actionType === 'CHECK_IN') {
      if (existing) {
        return NextResponse.json({
          success: false,
          message: `Anda sudah melakukan presensi masuk hari ini pada pukul ${existing.time_in ? existing.time_in.slice(0, 5) : '-'}`,
        });
      }

      const status = currentTime > lateThreshold ? 'TERLAMBAT' : 'HADIR';
      const notes = status === 'TERLAMBAT' ? 'Absen mandiri GPS (Terlambat)' : 'Absen mandiri GPS (Tepat waktu)';
      const photoUrl = await saveSelfiePhoto();

      await pool.execute(
        `INSERT INTO attendance (school_id, user_id, class_id, date, time_in, status, method, identifier, latitude, longitude, distance_meters, is_within_radius, photo_url, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'selfie', ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
        [schoolId, user!.id, classId, today, currentTime, status, user!.identifier, latitude, longitude, distance, photoUrl, notes]
      );

      return NextResponse.json({
        success: true,
        message: `Presensi masuk berhasil (${status})! Jarak: ${distance}m dari sekolah.`,
        time: currentTime.slice(0, 5),
        status,
        distance,
      });
    }

    // CHECK_OUT
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Anda belum melakukan presensi masuk hari ini' });
    }
    if (existing.time_out) {
      return NextResponse.json({
        success: false,
        message: `Anda sudah melakukan presensi pulang hari ini pada pukul ${existing.time_out.slice(0, 5)}`,
      });
    }

    const photoUrl = await saveSelfiePhoto();

    await pool.execute(
      `UPDATE attendance SET time_out = ?, photo_url = COALESCE(?, photo_url), updated_at = NOW() WHERE id = ?`,
      [currentTime, photoUrl, existing.id]
    );

    return NextResponse.json({
      success: true,
      message: `Presensi pulang berhasil pada pukul ${currentTime.slice(0, 5)}`,
      time: currentTime.slice(0, 5),
      status: existing.status,
      distance,
    });
  } catch (e: any) {
    if (e?.name === 'UploadValidationError') {
      return NextResponse.json({ success: false, message: e?.message || 'Foto tidak valid' }, { status: 400 });
    }
    // Balapan antar-tab/perangkat â†’ baris duplikat dicegah oleh UNIQUE (user_id,date).
    if (e?.errno === 1062 && e?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'Anda sudah melakukan presensi hari ini. Muat ulang halaman untuk melihat status terbaru.' },
        { status: 409 }
      );
    }
    const handled = handleApiError(e, 'Gagal memproses presensi. Silakan coba lagi.');
    return NextResponse.json(handled, { status: 500 });
  }
}
