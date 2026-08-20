import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Ekspor CSV Rekap Kehadiran (reports.php?format=csv).
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['admin']);
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const startDate = sp.get('start_date') || '';
  const endDate = sp.get('end_date') || '';
  const filterClass = sp.get('class_id') || '';
  const filterRole = sp.get('role_code') || '';
  const schoolId = user!.school_id;

  if (!startDate || !endDate) {
    return NextResponse.json({ success: false, message: 'Rentang tanggal wajib diisi' });
  }

  let sql = `
    SELECT a.*, u.full_name, u.identifier, r.role_name, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date BETWEEN ? AND ? AND a.school_id = ?
  `;
  const params: any[] = [startDate, endDate, schoolId];

  if (filterClass) {
    sql += ' AND a.class_id = ?';
    params.push(filterClass);
  }
  if (filterRole) {
    sql += ' AND r.role_code = ?';
    params.push(filterRole);
  }
  sql += ' ORDER BY a.date DESC, c.class_name, u.full_name';

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);

  const header = ['No', 'Tanggal', 'ID/NISN', 'Nama Lengkap', 'Peran/Kelas', 'Jam Masuk', 'Jam Pulang', 'Status', 'Metode', 'Keterangan'];
  const lines = rows.map((r, i) => [
    i + 1,
    r.date,
    r.identifier,
    r.full_name,
    r.class_name ?? r.role_name,
    r.time_in ? r.time_in.slice(0, 5) : '-',
    r.time_out ? r.time_out.slice(0, 5) : '-',
    r.status,
    r.method,
    r.notes || '-',
  ]);

  let csv = header.map(esc).join(';') + '\r\n';
  for (const row of lines) {
    csv += row.map(esc).join(';') + '\r\n';
  }

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Rekap_Absensi_${startDate}_sd_${endDate}.csv"`,
    },
  });
}

function esc(v: any): string {
  let s = String(v ?? '');
  // Netralkan formula injection CSV (OWASP): hindari sel diawali = + - @ \t \r.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}