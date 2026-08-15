import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const [schools] = await pool.query<RowDataPacket[]>(
      `SELECT id, school_code, npsn, name, level, logo_url, address, phone
       FROM schools
       WHERE is_active = 1 AND deleted_at IS NULL
       ORDER BY name ASC`
    );

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error('[API Schools Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data sekolah' },
      { status: 500 }
    );
  }
}
