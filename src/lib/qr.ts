import QRCode from 'qrcode';

/**
 * Generate QR Code sebagai Data URL untuk dirender server-side (kartu pelajar & ID card).
 */
export async function qrDataUrl(
  text: string,
  options?: { width?: number; dark?: string; light?: string }
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width ?? 120,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: options?.dark ?? '#064e3b',
      light: options?.light ?? '#ffffff',
    },
  });
}