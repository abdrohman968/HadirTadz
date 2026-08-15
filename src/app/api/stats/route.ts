import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { dateStrWIB } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Statistik tren absensi 7 hari terakhir.
 * Format mengikuti api/stats.php lama:
 * { categories: string[], series: [{ name, data }] }
 */
export async function GET(req: NextRequest) {
  const { user, error } = requireApiAuth(req, ['admin', 'guru']);
  if (error) return error;

  const schoolId = user!.school_id;
  const dates: string[] = [];
  const hadir: number[] = [];
  const terlambat: number[] = [];
  const izinSakit: number[] = [];
  const alpha: number[] = [];

  try {
    for (let i = 6; i >= 0; i--) {
      const dateStr = dateStrWIB(-i);

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
           SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
           SUM(CASE WHEN status IN ('IZIN','SAKIT') THEN 1 ELSE 0 END) AS izin_sakit,
           SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha
         FROM attendance
         WHERE date = ? AND school_id = ?`,
        [dateStr, schoolId]
      );
      const r = rows[0] || {};
      dates.push(dateStr);
      hadir.push(Number(r.hadir) || 0);
      terlambat.push(Number(r.terlambat) || 0);
      izinSakit.push(Number(r.izin_sakit) || 0);
      alpha.push(Number(r.alpha) || 0);
    }

    return NextResponse.json({
      categories: dates,
      series: [
        { name: 'Tepat Waktu', data: hadir },
        { name: 'Terlambat', data: terlambat },
        { name: 'Izin / Sakit', data: izinSakit },
        { name: 'Alpha', data: alpha },
      ],
    });
  } catch (e) {
    console.error('stats error:', e);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
