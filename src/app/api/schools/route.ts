import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [schools] = await pool.query<RowDataPacket[]>(
      `SELECT id, school_code, npsn, name, level, logo_url, address
       FROM schools
       WHERE is_active = 1 AND deleted_at IS NULL
       ORDER BY name ASC`
    );

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error: any) {
    console.error('[API Schools Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data sekolah', error: error?.message },
      { status: 500 }
    );
  }
}
