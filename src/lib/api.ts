import { toastError } from '@/components/ui/Toast';

/**
 * Central API Client Helper (Auto-Migration Ready)
 * Allows seamless switching between Next.js internal API Routes and external PHP backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
  user?: any;
  redirectUrl?: string;
  error?: string;
  temp_password?: string;
}

export interface ApiOptions extends RequestInit {
  /** Bila true, kegagalan tidak otomatis memunculkan toast error. */
  silent?: boolean;
}

function fail(message: string, silent: boolean, data?: any): ApiResponse {
  if (!silent) toastError(message || 'Terjadi kesalahan');
  return { success: false, message, error: data?.toString?.() || data };
}

export async function fetchAPI<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const silent = options.silent === true;
  // Lepaskan ekstensi 'silent' agar tidak ikut dikirim sebagai header/body.
  const { silent: _ignored, ...fetchOpts } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      headers: {
        ...defaultHeaders,
        ...fetchOpts.headers,
      },
    });

    // Guard against non-JSON responses (HTML error pages, 404, 500, etc.)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return fail(
        `Server mengembalikan error ${res.status}: ${res.statusText || 'Terjadi kesalahan server'}`,
        silent,
        `HTTP ${res.status}`
      );
    }

    const data = await res.json();
    // Normalize: if server returns HTTP error status but JSON body, pass the JSON through
    if (!res.ok && data.success === undefined) {
      return fail(data.message || data.error || `Error ${res.status}`, silent, data);
    }
    if (data.success === false) {
      return fail(data.message || 'Terjadi kesalahan', silent, data);
    }
    return data;
  } catch (error: any) {
    console.error(`[fetchAPI Error] ${endpoint}:`, error);
    return fail(
      error?.message || 'Gagal terhubung ke server. Pastikan server sedang berjalan.',
      silent,
      error?.toString()
    );
  }
}
