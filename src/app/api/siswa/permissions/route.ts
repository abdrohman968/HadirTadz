import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireApiAuth } from '@/lib/api-auth';
import { logAudit } from '@/lib/queries';
import { parseDataUrl, ALLOWED_ATTACHMENT_TYPES, type ParsedUpload } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

/**
 * Submit Pengajuan Izin / Sakit (siswa/izin.php).
 * Body: { type, start_date, end_date, reason, attachment_base64?, attachment_name? }
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['siswa']);
  if (error) return error;

  let input: any = {};
  try {
    input = await req.json();
  } catch (e) {
    input = {};
  }

  const type = String(input.type || 'izin');
  const startDate = String(input.start_date || '');
  const endDate = String(input.end_date || '');
  const reason = String(input.reason || '').trim();
  const attachmentB64 = String(input.attachment_base64 || '');
  const attachmentName = String(input.attachment_name || '');

  if (!startDate || !endDate || !reason) {
    return NextResponse.json({ success: false, message: 'Jenis, tanggal, dan alasan wajib diisi' });
  }

  const schoolId = user!.school_id;

  try {
    let attachmentUrl: string | null = null;
    if (attachmentB64) {
      let parsed: ParsedUpload | null;
      try {
        parsed = parseDataUrl(attachmentB64, ALLOWED_ATTACHMENT_TYPES);
      } catch (e: any) {
        e.name = 'UploadValidationError';
        throw e;
      }
      if (parsed) {
        try {
          const dir = path.join(process.cwd(), 'public', 'assets', 'uploads', 'permissions');
          await fs.mkdir(dir, { recursive: true });
          const filename = `perm_${user!.id}_${Date.now()}${parsed.ext}`;
          await fs.writeFile(path.join(dir, filename), parsed.buffer);
          attachmentUrl = `/assets/uploads/permissions/${filename}`;
        } catch (e) {
          attachmentUrl = null;
        }
      }
    }

    const [res] = await pool.execute(
      `INSERT INTO permissions (school_id, user_id, type, start_date, end_date, reason, attachment_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [schoolId, user!.id, type, startDate, endDate, reason, attachmentUrl]
    );
    const insertId = (res as any).insertId;
    await logAudit({ action: 'SUBMIT_PERMISSION', entityType: 'permissions', entityId: insertId, details: `Submitted ${type} permission`, schoolId, actor: user });
    return NextResponse.json({ success: true, message: 'Permohonan izin berhasil diajukan! Menunggu persetujuan admin/guru.' });
  } catch (e: any) {
    if (e?.name === 'UploadValidationError') {
      return NextResponse.json(
        { success: false, message: e?.message || 'Lampiran tidak valid' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, message: 'Gagal mengajukan izin. Silakan coba lagi.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireApiAuth(req, ['siswa']);
  if (error) return error;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, v.full_name AS verifier_name
     FROM permissions p
     LEFT JOIN users v ON p.verified_by_user_id = v.id
     WHERE p.user_id = ? AND p.deleted_at IS NULL AND p.school_id = ?
     ORDER BY p.created_at DESC`,
    [user!.id, user!.school_id]
  );
  return NextResponse.json({ success: true, data: rows });
}