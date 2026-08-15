/**
 * Error handler API terpusat: log detail asli di server, kirim pesan generik
 * kepada klien agar detail SQL/path/file tidak bocor.
 */
export function handleApiError(error: unknown, fallback = 'Terjadi kesalahan sistem. Silakan coba lagi.'): { success: boolean; message: string; error: string } {
  console.error('[api-error]', error);
  return { success: false, message: fallback, error: 'internal_error' };
}