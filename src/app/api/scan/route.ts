import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { todayStr, currentTimeStr, getRuleForRole, logAudit } from '@/lib/queries';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { verifyQrTicket, isDynamicQr } from '@/lib/qr-auth';

export const dynamic = 'force-dynamic';

/** Method presensi yang diperbolehkan pada kiosk. */
const ALLOWED_METHODS = new Set(['qr', 'barcode', 'manual', 'scan']);
/** Panjang maksimal identifier / NISN yang diterima. */
const MAX_IDENTIFIER_LENGTH = 64;

/**
 * Proses presensi via QR / barcode (scan_process.php).
 * Method: POST, body JSON { identifier, method }
 *
 * Kiosk/QR hanya diperuntukkan bagi KEHADIRAN HARIAN (check-in / check-out
 * gerbang) siswa & guru. Absensi pembelajaran / ekskul WAJIB lewat portal akun
 * masing-masing (menu "Absen Pelajaran" / "Absen Ekskul"), bukan scan QR.
 * Previous `pesan` pasts mode 'pelajaran'/'ekskul' telah dihapus; jika ada
 * klien lama mengirim `mode` selain default, kiosk tetap memproses kehadiran.
 */
export async function POST(req: NextRequest) {
  // Rate limit per IP: maksimal 40 request per 60 detik (kiosk ramai sekalipun cukup).
  const ip = clientIp(req);
  const ipLimit = rateLimit(`scan-ip:${ip}`);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Terlalu banyak permintaan. Silakan tunggu ${Math.ceil(ipLimit.retryAfterMs / 1000)} detik.`,
        sound: 'error',
      },
      { status: 429 }
    );
  }

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const rawIdentifier = String(input.identifier ?? '').trim();
  const method = String(input.method ?? 'qr').trim() || 'qr';
  const kioskSchoolId = Number(input.school_id) || null;

  if (!rawIdentifier) {
    return NextResponse.json({ success: false, message: 'Identifier atau QR Code tidak boleh kosong', sound: 'error' });
  }
  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({
      success: false,
      message: 'Metode presensi tidak dikenali.',
      sound: 'error',
    });
  }

  // QR dinamis (DEVELOPMENT_RULES #13): value HT|v1|exp|identifier|sig.
  // Signature dicek (HMAC) & masa berlaku divalidasi sebelum diproses.
  let identifier = rawIdentifier;
  if (isDynamicQr(rawIdentifier)) {
    const ticket = verifyQrTicket(rawIdentifier);
    if (!ticket.valid) {
      return NextResponse.json({
        success: false,
        message: `QR tidak valid: ${ticket.reason}. Perbarui kartu digital Anda.`,
        sound: 'error',
      });
    }
    identifier = ticket.identifier;
  }

  if (identifier.length > MAX_IDENTIFIER_LENGTH) {
    return NextResponse.json({
      success: false,
      message: `Identifier terlalu panjang (maksimal ${MAX_IDENTIFIER_LENGTH} karakter).`,
      sound: 'error',
    });
  }

  // Anti spam per kartu: hanya 1 proses per 2 detik per identifier.
  const cardLimit = rateLimit(`scan-card:${identifier}`, { max: 1, windowMs: 2000 });
  if (!cardLimit.allowed) {
    return NextResponse.json({
      success: false,
      message: 'Mohon tunggu sebentar sebelum melakukan scan berikutnya.',
      sound: 'info',
    });
  }

  try {
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.*, r.role_code, r.role_name,
              s.id AS student_id, s.class_id, s.nisn, c.class_name,
              t.id AS teacher_id, t.nip, t.subject_specialty
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN students s ON u.id = s.user_id AND s.deleted_at IS NULL
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON u.id = t.user_id AND t.deleted_at IS NULL
       WHERE (u.identifier = ? OR s.nisn = ? OR t.nip = ?)
         AND u.status = 'active' AND u.deleted_at IS NULL
         ${kioskSchoolId ? 'AND u.school_id = ?' : ''}
       LIMIT 1`,
      kioskSchoolId ? [identifier, identifier, identifier, kioskSchoolId] : [identifier, identifier, identifier]
    );
    const user = users[0];

    if (!user) {
      await logAudit({
        action: 'SCAN_REJECTED',
        entityType: 'scan',
        details: `Kartu / Barcode (${identifier}) belum terdaftar`,
        schoolId: kioskSchoolId || undefined,
        ip,
        userAgent: req.headers.get('user-agent') || '',
      });
      return NextResponse.json({
        success: false,
        message: `Data tidak ditemukan! Kartu / Barcode (${identifier}) belum terdaftar.`,
        sound: 'error',
      });
    }

    const today = todayStr();
    const currentTime = currentTimeStr();
    const userId = user.id;
    const classId = user.class_id ?? null;
    const schoolId = user.school_id ?? 1;

    // ── Mode: Gerbang (Default — Gate Check-In/Check-Out) ───
    const rule = await getRuleForRole(schoolId, user.role_code);
    const lateThreshold = rule?.late_threshold_time ?? '07:15:00';
    const earlyLeaveThreshold = rule?.early_leave_threshold ?? '13:30:00';

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM attendance WHERE user_id = ? AND date = ? LIMIT 1`,
      [userId, today]
    );
    const existing = existingRows[0];

    let actionType = 'CHECK_IN';
    let status = 'HADIR';
    let notes = '';
    let sound = 'success';
    let message = '';

    if (!existing) {
      // CHECK IN
      if (currentTime > lateThreshold) {
        status = 'TERLAMBAT';
        notes = `Masuk terlambat pukul ${currentTime.slice(0, 5)}`;
        sound = 'warning';
      } else {
        status = 'HADIR';
        notes = 'Hadir tepat waktu';
        sound = 'success';
      }

      const [insResult] = await pool.execute(
        `INSERT INTO attendance (school_id, user_id, class_id, date, time_in, status, method, identifier, is_within_radius, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
        [schoolId, userId, classId, today, currentTime, status, method, user.identifier, notes]
      );
      const attendanceId = (insResult as any).insertId;

      await pool.execute(
        `INSERT INTO attendance_logs (school_id, attendance_id, action, raw_payload, ip_address, created_at)
         VALUES (?, ?, 'CHECK_IN', ?, ?, NOW())`,
        [schoolId, attendanceId, JSON.stringify({ method, identifier }), req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1']
      );

      message = status === 'TERLAMBAT' ? 'Presensi Masuk Berhasil (Terlambat). Selamat beraktivitas!' : 'Presensi Masuk Berhasil. Selamat pagi!';
    } else {
      // SUDAH ADA RECORD HARI INI
      const timeInTs = existing.time_in ? Date.parse(`${today}T${existing.time_in}Z`) : null;
      const nowTs = Date.parse(`${today}T${currentTime}Z`);

      if (timeInTs && nowTs - timeInTs < 120000 && !existing.time_out) {
        return NextResponse.json({
          success: true,
          already: true,
          message: `Anda sudah melakukan presensi masuk hari ini pada pukul ${existing.time_in.slice(0, 5)}`,
          sound: 'info',
          user: {
            name: user.full_name,
            identifier: user.identifier,
            role: user.role_name,
            class: user.class_name ?? user.subject_specialty ?? '-',
            time: existing.time_in.slice(0, 5),
            status: existing.status,
            action: 'CHECK_IN',
          },
        });
      }

      if (existing.time_out) {
        return NextResponse.json({
          success: true,
          already: true,
          message: `Anda sudah selesai presensi masuk (${existing.time_in ? existing.time_in.slice(0, 5) : '-'}) & pulang (${existing.time_out.slice(0, 5)}) hari ini.`,
          sound: 'info',
          user: {
            name: user.full_name,
            identifier: user.identifier,
            role: user.role_name,
            class: user.class_name ?? user.subject_specialty ?? '-',
            time: existing.time_out.slice(0, 5),
            status: existing.status,
            action: 'CHECK_OUT',
          },
        });
      }

      // CHECK OUT
      actionType = 'CHECK_OUT';
      let newNotes = existing.notes ?? '';
      if (currentTime < earlyLeaveThreshold) {
        newNotes = `${newNotes ? newNotes + ' | ' : ''}Pulang cepat pukul ${currentTime.slice(0, 5)}`;
      }

      await pool.execute(
        `UPDATE attendance SET time_out = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
        [currentTime, newNotes || existing.notes, existing.id]
      );
      await pool.execute(
        `INSERT INTO attendance_logs (school_id, attendance_id, action, raw_payload, ip_address, created_at)
         VALUES (?, ?, 'CHECK_OUT', ?, ?, NOW())`,
        [schoolId, existing.id, JSON.stringify({ method, identifier }), req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1']
      );

      status = existing.status;
      message = 'Presensi Pulang Berhasil. Hati-hati di jalan!';
      sound = 'success';
    }

    return NextResponse.json({
      success: true,
      message,
      sound,
      user: {
        name: user.full_name,
        identifier: user.identifier,
        role: user.role_name,
        class: user.class_name ?? user.subject_specialty ?? 'Umum',
        time: currentTime.slice(0, 5),
        status,
        action: actionType,
      },
    });
  } catch (e) {
    console.error('scan error:', e);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem. Silakan coba lagi.', sound: 'error' },
      { status: 500 }
    );
  }
}
