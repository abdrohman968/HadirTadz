/**
 * Validasi & parsing upload base64 (data URL) untuk foto selfie dan lampiran izin.
 * Membatasi ukuran file dan whitelist MIME agar tidak ada upload sewenang-wenang.
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

/** MIME yang diizinkan untuk foto selfie. */
export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** MIME yang diizinkan untuk lampiran izin (gambar atau PDF). */
export const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export interface ParsedUpload {
  mime: string;
  ext: string;
  buffer: Buffer;
}

/** Ambil ekstensi file dari MIME. */
export function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'application/pdf') return '.pdf';
  return '.bin';
}

/**
 * Parsing data URL `data:<mime>;base64,<...>`.
 * Mengembalikan null jika kosong/bukan data URL, atau melempar Error
 * deskriptif bila MIME tidak diizinkan / ukuran melebihi batas.
 */
export function parseDataUrl(
  dataUrl: string,
  allowedMimes: Set<string>,
  maxBytes = MAX_UPLOAD_BYTES
): ParsedUpload | null {
  if (!dataUrl || !dataUrl.startsWith('data:') || !dataUrl.includes(',')) return null;

  const commaIndex = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, commaIndex);
  const b64 = dataUrl.slice(commaIndex + 1);

  let mime = header.split(';')[0].toLowerCase() || '';

  // Fallback jika header tidak memuat mime (mis. `data:;base64`).
  if (!mime) mime = allowedMimes.has('image/jpeg') ? 'image/jpeg' : 'application/pdf';

  if (!allowedMimes.has(mime)) {
    throw new Error(
      `Tipe file tidak diizinkan (${mime || 'tidak diketahui'}). Gunakan ${Array.from(allowedMimes).join(', ')}.`
    );
  }

  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length === 0) return null;

  if (buffer.length > maxBytes) {
    throw new Error(
      `File terlalu besar (${(buffer.length / (1024 * 1024)).toFixed(1)} MB). Maksimal ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`
    );
  }

  return { mime, ext: extForMime(mime), buffer };
}