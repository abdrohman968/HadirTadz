import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Registrasi Sekolah Baru (auth/register_school.php).
 * Membuat: sekolah, akun admin utama, pengaturan default, dan aturan presensi default.
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`register-school:${clientIp(req)}`, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({
      success: false,
      message: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi beberapa saat kemudian.',
    }, { status: 429 });
  }

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const schoolName = String(input.school_name || '').trim();
  const npsn = String(input.npsn || '').trim();
  const level = String(input.level || 'SMA').trim();
  const address = String(input.address || '').trim();
  const city = String(input.city || '').trim();
  const province = String(input.province || '').trim();
  const postalCode = String(input.postal_code || '').trim();
  // Email & telepon sekolah (dipisah dari admin).
  const schoolEmail = String(input.school_email || input.email || '').trim();
  const schoolPhone = String(input.school_phone || input.phone || '').trim();
  const adminName = String(input.admin_name || '').trim();
  const adminNik = String(input.admin_nik || '').trim();
  const adminEmail = String(input.admin_email || input.email || '').trim();
  const adminPhone = String(input.admin_phone || input.phone || '').trim();
  let identifier = String(input.identifier || '').trim();
  const password = String(input.password || '');
  const confirmPassword = String(input.confirm_password || '');

  if (!schoolName || !npsn || !adminName || !password) {
    return NextResponse.json({ success: false, message: 'Harap lengkapi semua kolom wajib (Nama Sekolah, NPSN, Nama Admin, dan Kata Sandi).' });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ success: false, message: 'Konfirmasi kata sandi tidak cocok.' });
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, message: 'Kata sandi minimal harus 8 karakter.' });
  }
  if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(schoolEmail)) {
    return NextResponse.json({ success: false, message: 'Format email sekolah tidak valid.' });
  }
  if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adminEmail)) {
    return NextResponse.json({ success: false, message: 'Format email admin tidak valid.' });
  }

  const generateCode = (prefix: string) =>
    prefix + '-' + (Math.floor(1000 + Math.random() * 9000)).toString();

  try {
    const [existing] = await pool.query<RowDataPacket[]>(`SELECT id FROM schools WHERE npsn = ? LIMIT 1`, [npsn]);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: `Sekolah dengan NPSN ${npsn} sudah terdaftar!` });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Kode sekolah unik (coba hingga tidak bertabrakan).
      let schoolCode = generateCode('SCH');
      for (let i = 0; i < 5; i++) {
        const [sc] = await conn.query<RowDataPacket[]>(`SELECT id FROM schools WHERE school_code = ? LIMIT 1`, [schoolCode]);
        if (sc.length === 0) break;
        schoolCode = generateCode('SCH');
      }

      // 2. Insert schools
      const [schoolRes] = await conn.execute(
        `INSERT INTO schools (school_code, npsn, name, level, address, phone, email, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [schoolCode, npsn, schoolName, level, address, schoolPhone, schoolEmail]
      );
      const newSchoolId = (schoolRes as any).insertId;

      // 3. Identifier admin unik per sekolah (coba hingga tidak bertabrakan).
      if (!identifier) {
        identifier = generateCode('ADM');
      }
      for (let i = 0; i < 5; i++) {
        const [idc] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE school_id = ? AND identifier = ? LIMIT 1`,
          [newSchoolId, identifier]
        );
        if (idc.length === 0) break;
        identifier = generateCode('ADM');
      }

      // 4. Akun Admin Utama (role_id=1)
      const passHash = bcrypt.hashSync(password, 10);
      await conn.execute(
        `INSERT INTO users (school_id, role_id, identifier, full_name, password_hash, email, phone, status, created_at, updated_at)
         VALUES (?, 1, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [newSchoolId, identifier, adminName, passHash, adminEmail, adminPhone]
      );

      // 5. Pengaturan default
      const defaultSettings: Record<string, string> = {
        schoolName: schoolName,
        npsn: npsn,
        schoolLevel: level,
        address: address,
        city: city,
        province: province,
        postalCode: postalCode,
        latitude: '-6.92720000',
        longitude: '107.72250000',
        radiusMeters: '150',
        timeInStart: '06:00',
        timeInEnd: '07:15',
        lateThreshold: '07:15',
        timeOutStart: '14:00',
        operatorName: adminName,
        operatorNik: adminNik,
        operatorPhone: adminPhone,
      };
      for (const [k, v] of Object.entries(defaultSettings)) {
        await conn.execute(
          `INSERT INTO school_settings (school_id, setting_key, setting_value, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [newSchoolId, k, v]
        );
      }

      // 6. Aturan presensi default
      await conn.execute(
        `INSERT INTO attendance_rules (school_id, rule_code, rule_name, role_code, check_in_start, work_start_time, late_threshold_time, check_out_start, work_end_time, early_leave_threshold, allow_late, radius_limit, days_of_week, created_at, updated_at)
         VALUES (?, 'rule-std', 'Aturan Standar Siswa', 'siswa', '06:00:00', '07:00:00', '07:15:00', '14:00:00', '15:30:00', '13:30:00', 1, 150, '1,2,3,4,5', NOW(), NOW()),
                (?, 'rule-teacher', 'Aturan Standar Guru', 'guru', '06:30:00', '07:30:00', '07:45:00', '15:00:00', '16:00:00', '14:30:00', 1, 200, '1,2,3,4,5,6', NOW(), NOW())`,
        [newSchoolId, newSchoolId]
      );

      await conn.commit();
      return NextResponse.json({
        success: true,
        message: `Pendaftaran sekolah berhasil! Silakan login.`,
        data: {
          school_code: schoolCode,
          school_name: schoolName,
          admin_identifier: identifier,
          admin_name: adminName,
        },
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('register-school error:', e);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat mendaftarkan sekolah. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}