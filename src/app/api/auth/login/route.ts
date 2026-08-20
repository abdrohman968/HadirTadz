import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, signJWT } from '@/lib/auth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { rateLimit, clientIp, resetRateLimit } from '@/lib/rate-limit';

// Force this route to always run on the server (never statically cached)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = (body.password || '').trim();
    const schoolId = Number(body.school_id) || 1;
    const remember = Boolean(body.remember);

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Silakan masukkan ID Pengguna / Email dan Kata Sandi.' },
        { status: 400 }
      );
    }

    // Brute-force protection: batasi per IP + per identifier (5 gagal / 15 menit).
    const ipKey = clientIp(req);
    const ipLimit = rateLimit(`login-ip:${ipKey}`, { max: 30, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.' },
        { status: 429 }
      );
    }
    const idLimit = rateLimit(`login-id:${identifier.toLowerCase()}`, { max: 5, windowMs: 15 * 60 * 1000 });
    if (!idLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak percobaan login untuk akun ini. Coba lagi nanti.' },
        { status: 429 }
      );
    }

    // Query user by identifier/email and role/school
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.*, r.role_code, r.role_name, s.name AS school_name, s.logo_url AS school_logo_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE (u.identifier = ? OR u.email = ?) AND u.deleted_at IS NULL
       ORDER BY (u.school_id = ?) DESC
       LIMIT 1`,
      [identifier, identifier, schoolId]
    );

    const user = rows?.[0];

    // Periksa sandi hanya bila akun ditemukan, agar tidak ada pembeda waktu respons.
    let isMatch = false;
    if (user && user.password_hash) {
      isMatch = await verifyPassword(password, user.password_hash);
    }

    if (!user || !isMatch || user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'ID Pengguna / Email atau Kata Sandi salah!' },
        { status: 401 }
      );
    }

    // Login berhasil → reset bucket per-akun agar percobaan sah tidak terakumulasi.
    resetRateLimit(`login-id:${identifier.toLowerCase()}`);

    // Update last_login_at
    await pool.query<ResultSetHeader>(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Audit log
    try {
      const ip = clientIp(req);
      const userAgent = (req.headers.get('user-agent') || '').substring(0, 250);
      await pool.query(
        `INSERT INTO audit_logs (school_id, actor_id, actor_identifier, actor_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, 'LOGIN', 'users', ?, 'User logged in via Next.js API', ?, ?, NOW())`,
        [user.school_id, user.id, user.identifier, user.role_code, String(user.id), ip, userAgent]
      );
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    // Sign JWT — sama dengan umur cookie agar sesi tidak putus sebelum cookie habis.
    const token = signJWT(
      {
        id: user.id,
        school_id: user.school_id,
        role_id: user.role_id,
        role_code: user.role_code,
        role_name: user.role_name,
        identifier: user.identifier,
        full_name: user.full_name,
        email: user.email,
        school_name: user.school_name,
      },
      remember ? '30d' : '7d'
    );

    // Determine dashboard redirect URL based on role
    let redirectUrl = '/admin';
    if (user.role_code === 'guru') {
      redirectUrl = '/guru';
    } else if (user.role_code === 'siswa') {
      redirectUrl = '/siswa';
    }

    const response = NextResponse.json({
      success: true,
      message: `Selamat datang kembali, ${user.full_name}!`,
      user: {
        id: user.id,
        identifier: user.identifier,
        fullName: user.full_name,
        role: user.role_code,
        roleName: user.role_name,
        schoolId: user.school_id,
        schoolName: user.school_name,
      },
      redirectUrl,
    });

    // Set secure HTTP-only cookie.
    // "Ingat saya" => 30 hari; tanpa remember => sesi browser (hilang saat tab ditutup).
    response.cookies.set({
      name: 'hadirtadz_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });

    return response;
  } catch (error) {
    console.error('[API Login Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem pada server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
