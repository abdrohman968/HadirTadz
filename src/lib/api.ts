/**
 * Central API Client Helper (Auto-Migration Ready)
 * Allows seamless switching between Next.js internal API Routes and external PHP backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  error?: string;
}

export async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Guard against non-JSON responses (HTML error pages, 404, 500, etc.)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        message: `Server mengembalikan error ${res.status}: ${res.statusText || 'Terjadi kesalahan server'}`,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    // Normalize: if server returns HTTP error status but JSON body, pass the JSON through
    if (!res.ok && data.success === undefined) {
      return {
        success: false,
        message: data.message || data.error || `Error ${res.status}`,
        error: data,
      };
    }
    return data;
  } catch (error: any) {
    console.error(`[fetchAPI Error] ${endpoint}:`, error);
    return {
      success: false,
      message: error?.message || 'Gagal terhubung ke server. Pastikan server sedang berjalan.',
      error: error?.toString(),
    };
  }
}
