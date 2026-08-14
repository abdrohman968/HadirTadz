import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, signJWT } from '@/lib/auth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = (body.password || '').trim();
    const schoolId = Number(body.school_id) || 1;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Silakan masukkan ID Pengguna / Email dan Kata Sandi.' },
        { status: 400 }
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

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ID Pengguna / Email atau Kata Sandi salah!' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Verify bcrypt password
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'ID Pengguna / Email atau Kata Sandi salah!' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Akun Anda sedang dinonaktifkan atau disuspend. Hubungi Administrator.' },
        { status: 403 }
      );
    }

    // Update last_login_at
    await pool.query<ResultSetHeader>(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Audit log
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = (req.headers.get('user-agent') || '').substring(0, 250);
      await pool.query(
        `INSERT INTO audit_logs (school_id, actor_id, actor_identifier, actor_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, 'LOGIN', 'users', ?, 'User logged in via Next.js API', ?, ?, NOW())`,
        [user.school_id, user.id, user.identifier, user.role_code, String(user.id), ip, userAgent]
      );
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    // Sign JWT
    const token = signJWT({
      id: user.id,
      school_id: user.school_id,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      identifier: user.identifier,
      full_name: user.full_name,
      email: user.email,
      school_name: user.school_name,
    });

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

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'hadirtadz_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[API Login Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem pada server: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
